import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  EXAM_PAPER_GENERATOR_PROMPT,
  buildPaperPrompt,
} from '@/lib/ai/prompts'
import { generateContentWithGeminiOrClaude } from '@/lib/gemini/client'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { paper_type, curriculum_level, topics, total_marks, time_allowed, num_sections, instructions } = body

  if (!curriculum_level || !topics?.length || !total_marks) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const userMessage = buildPaperPrompt({
    paper_type: paper_type || 'midterm',
    curriculum_level,
    topics: Array.isArray(topics) ? topics : [topics],
    total_marks: Number(total_marks),
    time_allowed: time_allowed || '2 hours',
    num_sections: Number(num_sections) || 3,
    instructions: instructions || 'Answer all questions. Show all working for calculation questions.',
  })

  try {
    const rawText = await generateContentWithGeminiOrClaude({
      systemPrompt: EXAM_PAPER_GENERATOR_PROMPT,
      userMessage,
      modelPreference: 'pro',
    })

    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    const jsonText = jsonMatch ? jsonMatch[1] : rawText.trim()
    const result = JSON.parse(jsonText)

    return NextResponse.json(result)
  } catch (err) {
    console.error('Paper generation error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate exam paper.' },
      { status: 500 }
    )
  }
}
