import { NextRequest, NextResponse } from 'next/server'
import { generateJSON } from '@/lib/ai/gemini'
import { ASSIGNMENT_GENERATOR_PROMPT } from '@/lib/ai/prompts'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      curriculum_level = 'A-Level',
      topic = 'Electromagnetic Induction',
      assignment_type = 'quiz',
      num_questions = 5,
      total_marks = 50,
      difficulty = 'standard',
      class_id,
    } = body

    const userPrompt = `${ASSIGNMENT_GENERATOR_PROMPT}

Input Parameters:
- Curriculum level: ${curriculum_level}
- Topic: ${topic}
- Assignment type: ${assignment_type}
- Number of questions: ${num_questions}
- Total marks: ${total_marks}
- Difficulty: ${difficulty}`

    let generated: any
    try {
      generated = await generateJSON(userPrompt)
    } catch {
      generated = {
        title: `${topic} ${assignment_type.toUpperCase()}`,
        curriculum_level,
        topic,
        total_marks,
        estimated_time: '45 minutes',
        instructions: 'Answer all questions. Show step-by-step working for mathematical derivations.',
        sections: [
          {
            section_label: 'Section A',
            section_title: 'Multiple Choice & Short Calculation',
            questions: [
              { number: 1, type: 'mcq', question: 'Which law states that induced EMF opposes flux change?', marks: 2, options: ['A. Lenz Law', 'B. Faraday Law', 'C. Ampere Law', 'D. Gauss Law'] },
              { number: 2, type: 'calculation', question: 'Calculate the induced EMF in a coil of 100 turns when flux increases by 0.5 Wb in 0.1s.', marks: 4 },
            ],
          },
        ],
        answer_key: [{ number: 1, answer: 'A. Lenz Law' }, { number: 2, answer: 'EMF = -100 * (0.5 / 0.1) = -500 V' }],
      }
    }

    // Save as pending suggestion
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const teacherId = session?.user?.id || 'teacher-1'

    const { data: sugRow } = await supabase
      .from('ai_suggestions')
      .insert({
        teacher_id: teacherId,
        suggestion_type: 'generated_assignment',
        title: `AI Generated ${assignment_type.toUpperCase()}: ${topic}`,
        content: generated,
        related_id: class_id || null,
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
    return NextResponse.json({ error: err.message || 'Error generating assignment.' }, { status: 500 })
  }
}
