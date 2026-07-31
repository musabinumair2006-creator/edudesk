import { NextRequest, NextResponse } from 'next/server'
import { generateJSON } from '@/lib/ai/gemini'
import { REPORT_GENERATOR_PROMPT } from '@/lib/ai/prompts'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { report_type = 'student', student_id, class_id, period_type = 'monthly' } = body

    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const teacherId = session?.user?.id || 'teacher-1'

    let studentName = 'Alex Morgan'
    if (student_id) {
      const { data: sRow } = await supabase
        .from('students')
        .select('full_name')
        .eq('id', student_id)
        .single()
      if (sRow?.full_name) studentName = sRow.full_name
    }

    const userPrompt = `${REPORT_GENERATOR_PROMPT}

Report Target: ${report_type === 'student' ? `Student: ${studentName}` : 'Class Section'}
Period: ${period_type}
Sample Performance Data:
- Attendance: 85% (17/20 sessions present)
- Quiz Average: 78%
- Homework Submission: 90%`

    let generated: any
    try {
      generated = await generateJSON(userPrompt)
    } catch {
      generated = {
        executive_summary: `${studentName} has shown strong conceptual grasp in A-Level Physics mechanics and electromagnetism over the past month.`,
        attendance_analysis: `${studentName} maintained 85% attendance across 20 sessions, showing good consistency.`,
        performance_analysis: `Assessment scores averaged 78% with highest performance in Kinematics calculations.`,
        strengths: ['Clear mathematical derivations', 'Consistent homework submission rate'],
        areas_to_improve: ['Flux linkage sign conventions', 'AC circuit vector diagrams'],
        recommendations: ['Complete extra practice problems on Faraday law', 'Review SI unit conversions before midterm exam'],
        overall_rating: 'Good',
        overall_percentage: 78,
      }
    }

    // Insert into ai_suggestions queue for teacher approval
    const { data: sugRow } = await supabase
      .from('ai_suggestions')
      .insert({
        teacher_id: teacherId,
        suggestion_type: report_type === 'student' ? 'student_report' : 'class_report',
        title: `AI Performance Report: ${studentName}`,
        content: generated,
        related_id: student_id || class_id || null,
        status: 'pending',
      })
      .select()
      .single()

    return NextResponse.json({
      success: true,
      suggestion_id: sugRow?.id || 'sug-' + Date.now(),
      report: generated,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error generating report.' }, { status: 500 })
  }
}
