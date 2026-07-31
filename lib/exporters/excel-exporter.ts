import * as XLSX from 'xlsx'

export function exportDataToExcelBuffer(
  data: Record<string, any>[],
  sheetName: string = 'PhysicsDesk_Export'
): Buffer {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  const excelBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'buffer',
  })

  return excelBuffer
}
