'use client'

import React from 'react'
import type { Report } from '@/lib/types'
import { generateAcademicTextPDF } from '@/lib/exporters/pdf-exporter'
import { Download } from 'lucide-react'

interface ReportViewerProps {
  report: Report
}

export default function ReportViewer({ report }: ReportViewerProps) {
  const content = report.content

  function handleDownloadPDF() {
    const text = generateAcademicTextPDF({
      title: `${report.report_type.toUpperCase()} Academic Report`,
      subtitle: `Centaurus Academy Physics — ${report.student?.full_name || report.class?.name || 'Class'}`,
      content: JSON.stringify(content, null, 2),
    })

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Academic_Report_${report.report_type}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-3 text-xs">
      <div className="p-3 bg-bg-subtle rounded border border-border">
        <strong className="text-text-primary block mb-1">Executive Summary:</strong>
        <p className="text-text-secondary leading-relaxed">{content.executive_summary}</p>
      </div>

      {content.strengths && content.strengths.length > 0 && (
        <div>
          <strong className="text-text-primary block mb-1">Observed Strengths:</strong>
          <ul className="list-disc pl-4 text-text-secondary">
            {content.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {content.recommendations && content.recommendations.length > 0 && (
        <div>
          <strong className="text-text-primary block mb-1">Actionable Recommendations:</strong>
          <ul className="list-disc pl-4 text-text-secondary">
            {content.recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="pt-2 border-t border-border flex justify-end">
        <button className="btn btn-secondary btn-sm flex items-center gap-1" onClick={handleDownloadPDF}>
          <Download size={12} /> Export Document
        </button>
      </div>
    </div>
  )
}
