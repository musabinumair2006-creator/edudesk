import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  ASSIGNMENT_GENERATOR_PROMPT,
  buildAssignmentPrompt,
} from '@/lib/ai/prompts'
import { generateContentWithGeminiOrClaude } from '@/lib/gemini/client'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { curriculum_level, topic, assignment_type, num_questions, total_marks, difficulty } = body

  if (!curriculum_level || !topic || !num_questions || !total_marks) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const userMessage = buildAssignmentPrompt({
    curriculum_level,
    topic,
    assignment_type: assignment_type || 'assignment',
    num_questions: Number(num_questions),
    total_marks: Number(total_marks),
    difficulty: difficulty || 'standard',
  })

  try {
    const rawText = await generateContentWithGeminiOrClaude({
      systemPrompt: ASSIGNMENT_GENERATOR_PROMPT,
      userMessage,
      modelPreference: 'pro',
    })

    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    const jsonText = jsonMatch ? jsonMatch[1] : rawText.trim()
    const result = JSON.parse(jsonText)

    return NextResponse.json(result)
  } catch (err) {
    console.error('Assignment generation error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate assignment.' },
      { status: 500 }
    )
  }
}
