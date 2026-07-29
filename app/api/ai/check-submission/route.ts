import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  SUBMISSION_CHECKER_PROMPT,
  buildSubmissionCheckPrompt,
} from '@/lib/ai/prompts'
import { generateContentWithGeminiOrClaude } from '@/lib/gemini/client'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { question_content, student_answer, total_marks, curriculum_level } = body

  if (!question_content || !total_marks) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const userMessage = buildSubmissionCheckPrompt({
    question_content,
    student_answer: student_answer || 'No answer provided',
    total_marks: Number(total_marks),
    curriculum_level: curriculum_level || 'A-Level',
  })

  try {
    const rawText = await generateContentWithGeminiOrClaude({
      systemPrompt: SUBMISSION_CHECKER_PROMPT,
      userMessage,
      modelPreference: 'flash',
    })

    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    const jsonText = jsonMatch ? jsonMatch[1] : rawText.trim()
    const result = JSON.parse(jsonText)

    return NextResponse.json(result)
  } catch (err) {
    console.error('Submission check error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'AI check failed. Please try again.' },
      { status: 500 }
    )
  }
}
