import React from 'react'

export interface PDFExportOptions {
  title: string
  subtitle?: string
  content: string
}

export function generateAcademicTextPDF(options: PDFExportOptions): string {
  // Returns a formatted plain text / markdown printable string or HTML document for browser printing
  return `
================================================================================
PHYSICSDESK ACADEMIC REPORT — CENTAURUS ACADEMY
Title: ${options.title}
Subtitle: ${options.subtitle || ''}
Generated Date: ${new Date().toLocaleDateString()}
================================================================================

${options.content}
`
}
