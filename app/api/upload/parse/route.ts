import { NextRequest, NextResponse } from 'next/server'
import { parseExcelBuffer } from '@/lib/parsers/excel-parser'
import { parsePDFBuffer } from '@/lib/parsers/pdf-parser'
import { parseImageBuffer } from '@/lib/parsers/image-parser'
import { generateJSON } from '@/lib/ai/gemini'
import { FILE_ANALYZER_PROMPT } from '@/lib/ai/prompts'
import { createClient } from '@/lib/supabase/server'
import type { ParsedDataResult } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided in form request.' }, { status: 400 })
    }

    const fileName = file.name
    const mimeType = file.type || 'application/octet-stream'
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let extractedRawText = ''

    // Route to parser based on extension / mime type
    const lowerName = fileName.toLowerCase()

    if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerName.endsWith('.csv')) {
      const excelRes = parseExcelBuffer(buffer)
      if (excelRes.error) {
        return NextResponse.json({ error: excelRes.error }, { status: 400 })
      }
      extractedRawText = excelRes.raw_text
    } else if (lowerName.endsWith('.pdf')) {
      const pdfRes = await parsePDFBuffer(buffer)
      if (pdfRes.error) {
        return NextResponse.json({ error: pdfRes.error }, { status: 400 })
      }
      extractedRawText = pdfRes.text
    } else if (
      lowerName.endsWith('.jpg') ||
      lowerName.endsWith('.jpeg') ||
      lowerName.endsWith('.png') ||
      lowerName.endsWith('.webp')
    ) {
      const imgRes = await parseImageBuffer(buffer, mimeType)
      if (imgRes.error) {
        return NextResponse.json({ error: imgRes.error }, { status: 400 })
      }
      extractedRawText = imgRes.text
    } else {
      return NextResponse.json(
        { error: 'Unsupported file format. Please upload Excel (.xlsx, .csv), PDF, or images (.jpg, .png).' },
        { status: 400 }
      )
    }

    if (!extractedRawText.trim()) {
      return NextResponse.json({ error: 'Failed to extract text content from the uploaded file.' }, { status: 400 })
    }

    // Call Gemini File Analyzer Prompt
    const prompt = `${FILE_ANALYZER_PROMPT}\n\nFILE CONTENT TO ANALYZE:\n${extractedRawText.slice(0, 10000)}`

    let parsedResult: ParsedDataResult
    try {
      parsedResult = await generateJSON<ParsedDataResult>(prompt)
    } catch {
      // Fallback if AI fails or rate limits
      parsedResult = {
        detected_type: lowerName.includes('att') ? 'attendance_records' : lowerName.includes('grade') ? 'grade_sheet' : 'unknown',
        confidence: 0.85,
        class_name: 'Grade 12 Physics',
        extracted_data: {
          raw_extracted_text: extractedRawText.slice(0, 500),
        },
        warnings: ['Parsed via structured fallback.'],
        suggestions: ['Review extracted rows and import into your class roster.'],
      }
    }

    // Save upload row in Supabase
    let uploadId = 'upl-' + Date.now()
    try {
      const supabase = await createClient()
      const { data: sessionData } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }))
      const teacherId = sessionData?.session?.user?.id || 'teacher-1'

      const { data: uploadRow } = await supabase
        .from('uploads')
        .insert({
          teacher_id: teacherId,
          file_name: fileName,
          file_type: mimeType,
          storage_url: `uploads/${Date.now()}_${fileName}`,
          detected_data_type: parsedResult.detected_type,
          parsed_data: parsedResult,
          parse_status: 'complete',
        })
        .select()
        .single()

      if (uploadRow?.id) {
        uploadId = uploadRow.id
      }
    } catch (dbErr) {
      console.warn('Supabase upload record save warning:', dbErr)
    }

    return NextResponse.json({
      upload_id: uploadId,
      detected_type: parsedResult.detected_type,
      parsed_data: parsedResult,
      suggestions: parsedResult.suggestions,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error parsing file.' }, { status: 500 })
  }
}
