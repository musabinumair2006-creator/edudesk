import { analyzeImage } from '@/lib/ai/gemini'

export interface ImageParseResult {
  text: string
  error?: string
}

export async function parseImageBuffer(
  buffer: Buffer,
  mimeType: string
): Promise<ImageParseResult> {
  try {
    const base64 = buffer.toString('base64')
    const prompt =
      'Extract all text and structured data from this image. This is likely an academic document, attendance register, or grade sheet from a Physics LMS. Return everything you can read clearly formatted.'

    const extractedText = await analyzeImage(base64, mimeType, prompt)
    return {
      text: extractedText,
    }
  } catch (err: any) {
    return {
      text: '',
      error: `Image OCR failed: ${err.message || err}`,
    }
  }
}
