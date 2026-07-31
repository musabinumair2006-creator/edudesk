const pdfParse = require('pdf-parse')

export interface PDFParseResult {
  text: string
  num_pages: number
  error?: string
}

export async function parsePDFBuffer(buffer: Buffer): Promise<PDFParseResult> {
  try {
    const data = await pdfParse(buffer)
    return {
      text: data.text || '',
      num_pages: data.numpages || 1,
    }
  } catch (err: any) {
    return {
      text: '',
      num_pages: 0,
      error: `PDF parse failed: ${err.message || err}`,
    }
  }
}
