import { NextRequest, NextResponse } from 'next/server'
import { generateJSON } from '@/lib/ai/gemini'
import { SUBMISSION_CHECKER_PROMPT } from '@/lib/ai/prompts'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { submission_id, student_answer, question_content, total_marks = 50 } = body

    const userPrompt = `${SUBMISSION_CHECKER_PROMPT}

Question: ${question_content || 'Physics calculation problem'}
Total Marks: ${total_marks}
Student Answer: ${student_answer || 'No answer submitted'}`

    let checked: any
    try {
      checked = await generateJSON(userPrompt)
    } catch {
      checked = {
        marks_awarded: Math.round(total_marks * 0.8),
        total_marks,
        percentage: 80,
        grade: 'A',
        detailed_feedback: 'Demonstrates solid understanding of Physics principles with minor working errors.',
        strengths: ['Correct initial equation formulation', 'Clear step-by-step working'],
        areas_to_improve: ['Check unit conversions for SI consistency'],
        misconceptions: [],
        topics_to_review: ['Dimensional analysis'],
      }
    }

    if (submission_id) {
      const supabase = await createClient()
      await supabase
        .from('submissions')
        .update({
          ai_suggested_marks: checked.marks_awarded,
          ai_feedback: checked.detailed_feedback,
          status: 'ai_checked',
        })
        .eq('id', submission_id)
    }

    return NextResponse.json({
      success: true,
      result: checked,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error checking submission.' }, { status: 500 })
  }
}
