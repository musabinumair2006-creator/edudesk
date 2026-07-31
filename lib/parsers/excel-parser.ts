import * as XLSX from 'xlsx'

export interface ExcelParseResult {
  sheets: Array<{
    name: string
    data: Record<string, any>[]
  }>
  raw_text: string
  error?: string
}

export function parseExcelBuffer(buffer: Buffer): ExcelParseResult {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
    const sheets: Array<{ name: string; data: Record<string, any>[] }> = []
    let rawTextAccumulator = ''

    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
        defval: '',
        raw: false,
      })

      const csvText = XLSX.utils.sheet_to_csv(worksheet)
      rawTextAccumulator += `--- Sheet: ${sheetName} ---\n${csvText}\n\n`

      sheets.push({
        name: sheetName,
        data: jsonData,
      })
    })

    return {
      sheets,
      raw_text: rawTextAccumulator,
    }
  } catch (err: any) {
    return {
      sheets: [],
      raw_text: '',
      error: `Excel parse failed: ${err.message || err}`,
    }
  }
}
