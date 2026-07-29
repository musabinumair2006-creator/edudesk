import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  REPORT_GENERATOR_PROMPT,
  buildReportPrompt,
} from '@/lib/ai/prompts'
import { buildStudentReportData, buildClassReportData, saveReport } from '@/lib/supabase/queries/reports'
import { generateContentWithGeminiOrClaude } from '@/lib/gemini/client'
import type { ReportContent } from '@/lib/types'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { report_type, student_id, class_id, period_start, period_end } = body

  if (!report_type || !period_start || !period_end) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    let reportData: object
    let entityName: string

    if (student_id) {
      reportData = await buildStudentReportData(student_id, period_start, period_end)
      const { data: std } = await supabase.from('students').select('full_name').eq('id', student_id).single()
      entityName = (std as { full_name: string } | null)?.full_name || 'Student'
    } else if (class_id) {
      reportData = await buildClassReportData(class_id, period_start, period_end)
      const { data: cls } = await supabase.from('classes').select('name').eq('id', class_id).single()
      entityName = (cls as { name: string } | null)?.name || 'Class'
    } else {
      return NextResponse.json({ error: 'Either student_id or class_id is required' }, { status: 400 })
    }

    const userMessage = buildReportPrompt({
      report_type,
      period_start,
      period_end,
      data: reportData,
      entity_name: entityName,
    })

    const rawText = await generateContentWithGeminiOrClaude({
      systemPrompt: REPORT_GENERATOR_PROMPT,
      userMessage,
      modelPreference: 'pro',
    })

    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    const jsonText = jsonMatch ? jsonMatch[1] : rawText.trim()
    const aiContent: ReportContent = JSON.parse(jsonText)

    const fullContent: ReportContent = {
      ...aiContent,
      data: reportData as ReportContent['data'],
    }

    const report = await saveReport({
      report_type,
      student_id: student_id || undefined,
      class_id: class_id || undefined,
      period_start,
      period_end,
      content: fullContent,
    })

    return NextResponse.json(report)
  } catch (err) {
    console.error('Report generation error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Report generation failed.' },
      { status: 500 }
    )
  }
}
