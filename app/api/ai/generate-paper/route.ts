import { NextRequest, NextResponse } from 'next/server'
import { generateJSON } from '@/lib/ai/gemini'
import { ASSIGNMENT_GENERATOR_PROMPT } from '@/lib/ai/prompts'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { curriculum_level = 'A-Level', topics = ['Kinematics', 'Dynamics'], total_marks = 100 } = body

    const userPrompt = `${ASSIGNMENT_GENERATOR_PROMPT}

Generate a formal Physics Exam Paper.
Curriculum: ${curriculum_level}
Topics: ${topics.join(', ')}
Total Marks: ${total_marks}`

    let generated: any
    try {
      generated = await generateJSON(userPrompt)
    } catch {
      generated = {
        title: `${curriculum_level} Physics Examination Paper`,
        curriculum_level,
        topic: topics.join(', '),
        total_marks,
        estimated_time: '2 hours',
        instructions: 'Answer all questions in Section A and Section B. Show all mathematical derivations.',
        sections: [
          {
            section_label: 'Section A',
            section_title: 'Structured Mechanics Questions',
            questions: [
              { number: 1, type: 'structured', question: 'State Newton’s Second Law of Motion in terms of momentum.', marks: 3 },
            ],
          },
        ],
        answer_key: [{ number: 1, answer: 'Force is equal to the rate of change of momentum (F = dp/dt).' }],
      }
    }

    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const teacherId = session?.user?.id || 'teacher-1'

    const { data: sugRow } = await supabase
      .from('ai_suggestions')
      .insert({
        teacher_id: teacherId,
        suggestion_type: 'generated_paper',
        title: `AI Generated Exam Paper: ${curriculum_level}`,
        content: generated,
        status: 'pending',
      })
      .select()
      .single()

    return NextResponse.json({
      success: true,
      suggestion_id: sugRow?.id || 'sug-' + Date.now(),
      content: generated,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error generating exam paper.' }, { status: 500 })
  }
}
