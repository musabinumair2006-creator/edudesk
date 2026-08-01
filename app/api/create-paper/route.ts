import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: authData } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))
    const teacherId = authData?.user?.id || 'demo-teacher'

    const body = await req.json()
    const {
      title,
      paper_type,
      curriculum_level_id,
      class_id,
      total_marks,
      time_allowed,
      instructions,
      creation_mode,
      sections,
      status,
    } = body

    if (!title || !paper_type || !sections || !Array.isArray(sections)) {
      return NextResponse.json(
        { error: 'Missing required paper builder parameters (title, paper_type, sections)' },
        { status: 400 }
      )
    }

    // Calculate actual total marks from questions
    let calculatedTotal = 0
    sections.forEach((sec: any) => {
      if (sec.questions && Array.isArray(sec.questions)) {
        sec.questions.forEach((q: any) => {
          calculatedTotal += q.marks || 0
        })
      }
    })

    const finalMarks = calculatedTotal > 0 ? calculatedTotal : total_marks || 50

    // 1. Insert paper record
    const { data: paper, error: paperErr } = await supabase
      .from('papers')
      .insert({
        teacher_id: teacherId,
        title: title.trim(),
        paper_type: paper_type || 'assignment',
        curriculum_level_id: curriculum_level_id || null,
        class_id: class_id || null,
        total_marks: finalMarks,
        time_allowed: time_allowed || '1 Hour 30 Minutes',
        instructions: instructions || 'Answer all questions. Show all working for calculation questions.',
        status: status || 'final',
        creation_mode: creation_mode || 'mixed',
        content: { sections },
      })
      .select('id')
      .single()

    const paperId = paper?.id || `paper-${Date.now()}`

    // 2. Insert into paper_questions table
    const pqRows: any[] = []
    let orderIndex = 1

    sections.forEach((sec: any) => {
      if (sec.questions && Array.isArray(sec.questions)) {
        sec.questions.forEach((q: any) => {
          pqRows.push({
            paper_id: paperId,
            question_id: q.id && !q.id.startsWith('ai-') ? q.id : null,
            teacher_id: teacherId,
            question_text: q.question_text || q.text || '',
            marks: q.marks || 1,
            section: sec.label || 'SECTION A',
            order_index: orderIndex++,
            is_ai_generated: Boolean(q.is_ai_generated),
            answer: q.answer || null,
          })
        })
      }
    })

    if (paper?.id && pqRows.length > 0) {
      await supabase.from('paper_questions').insert(pqRows)
    }

    return NextResponse.json({ paper_id: paperId })
  } catch (err: any) {
    console.error('create-paper error:', err)
    return NextResponse.json({ error: err.message || 'Failed to create paper' }, { status: 500 })
  }
}
