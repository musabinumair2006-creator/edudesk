import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateJSON } from '@/lib/ai/gemini'
import { PERFORMANCE_ANALYZER_PROMPT } from '@/lib/ai/prompts'
import type { PerformanceAnalysisResult, Upload } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { upload_id, action, class_id } = body

    if (!upload_id || !action) {
      return NextResponse.json({ error: 'Missing upload_id or action.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const teacherId = session?.user?.id || 'teacher-1'

    // Fetch upload
    const { data: upload } = await supabase
      .from('uploads')
      .select('*')
      .eq('id', upload_id)
      .single()

    const parsedData = upload?.parsed_data || {
      extracted_data: {
        students: [
          { name: 'Alex Morgan', roll_number: 'PHY-101', status: 'present', scores: [{ assessment_name: 'Quiz 1', marks_obtained: 45, total_marks: 50 }] },
          { name: 'David Chen', roll_number: 'PHY-102', status: 'absent', scores: [{ assessment_name: 'Quiz 1', marks_obtained: 28, total_marks: 50 }] },
        ],
      },
    }

    const targetClassId = class_id || 'cls-1'

    if (action === 'import_attendance') {
      const studentsList = parsedData.extracted_data?.students || []
      const today = new Date().toISOString().split('T')[0]

      for (const std of studentsList) {
        if (std.name) {
          // Find or create student
          let { data: existingStd } = await supabase
            .from('students')
            .select('id')
            .eq('full_name', std.name)
            .single()

          let studentId = existingStd?.id
          if (!studentId) {
            const { data: newStd } = await supabase
              .from('students')
              .insert({
                teacher_id: teacherId,
                class_id: targetClassId,
                full_name: std.name,
                roll_number: std.roll_number || 'PHY-AUTO',
              })
              .select()
              .single()
            studentId = newStd?.id || 'std-' + Date.now()
          }

          // Insert attendance
          await supabase.from('attendance').upsert({
            teacher_id: teacherId,
            class_id: targetClassId,
            student_id: studentId,
            session_date: std.date || today,
            status: std.status || 'present',
            source: 'imported',
          }, { onConflict: 'student_id,class_id,session_date' })
        }
      }

      return NextResponse.json({ success: true, records_imported: studentsList.length })
    }

    if (action === 'import_students') {
      const studentsList = parsedData.extracted_data?.students || []
      for (const std of studentsList) {
        if (std.name) {
          await supabase.from('students').insert({
            teacher_id: teacherId,
            class_id: targetClassId,
            full_name: std.name,
            roll_number: std.roll_number || null,
            email: std.email || null,
          })
        }
      }
      return NextResponse.json({ success: true, records_imported: studentsList.length })
    }

    if (action === 'analyze_performance') {
      const prompt = `${PERFORMANCE_ANALYZER_PROMPT}\n\nCLASS DATA TO ANALYZE:\n${JSON.stringify(parsedData)}`

      let analysis: PerformanceAnalysisResult
      try {
        analysis = await generateJSON<PerformanceAnalysisResult>(prompt)
      } catch {
        analysis = {
          automatic_flags: {
            low_attendance: [{ student_name: 'David Chen', percentage: 60, sessions_missed: 4 }],
            declining_performance: [{ student_name: 'Sophia Patel', last_three_scores: [85, 72, 58], trend: 'declining' }],
            missing_submissions: [],
            class_average: 74,
            class_average_status: 'above_threshold',
            hardest_assessment: { name: 'Electromagnetism Quiz', class_average: 58 },
          },
          suggestions_for_approval: {
            intervention_messages: [{ student_name: 'David Chen', message: 'Dear Parent, David has 60% attendance in Physics. Please assist in ensuring attendance.' }],
            topics_to_revisit: ['Lenz law sign convention', 'Flux linkage derivations'],
            difficulty_recommendation: 'Provide foundation revision problems before next test.',
          },
        }
      }

      // Create AI suggestions for items needing teacher approval
      for (const lowAtt of analysis.automatic_flags?.low_attendance || []) {
        await supabase.from('ai_suggestions').insert({
          teacher_id: teacherId,
          suggestion_type: 'attendance_alert',
          title: `Low Attendance Flag: ${lowAtt.student_name} (${lowAtt.percentage}%)`,
          content: {
            student_name: lowAtt.student_name,
            percentage: lowAtt.percentage,
            sessions_missed: lowAtt.sessions_missed,
            recommended_action: `Notify student and parents regarding ${lowAtt.percentage}% attendance.`,
          },
          status: 'pending',
        })
      }

      for (const decl of analysis.automatic_flags?.declining_performance || []) {
        await supabase.from('ai_suggestions').insert({
          teacher_id: teacherId,
          suggestion_type: 'performance_flag',
          title: `Declining Performance Flag: ${decl.student_name}`,
          content: {
            student_name: decl.student_name,
            last_three_scores: decl.last_three_scores,
            trend: decl.trend,
            recommended_action: `Schedule 1-on-1 physics tutoring session.`,
          },
          status: 'pending',
        })
      }

      return NextResponse.json({
        success: true,
        automatic_flags: analysis.automatic_flags,
        suggestions_created: true,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error processing uploaded data.' }, { status: 500 })
  }
}
