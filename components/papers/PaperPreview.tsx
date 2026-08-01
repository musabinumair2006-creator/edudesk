'use client'

import { useState } from 'react'
import type { Paper } from '@/lib/types'
import { exportPaper, exportMarkScheme } from '@/lib/pdf-export'
import { downloadBlob } from '@/lib/utils'
import { Printer, Download, X } from 'lucide-react'

export function PaperPreview({
  paper,
  onClose,
}: {
  paper: Paper
  onClose: () => void
}) {
  const [isExporting, setIsExporting] = useState(false)

  async function handleDownloadPDF(type: 'paper' | 'mark_scheme') {
    setIsExporting(true)
    try {
      const blob = type === 'paper' ? await exportPaper(paper) : await exportMarkScheme(paper)
      const filename = `${paper.title.replace(/\s+/g, '_')}_${type === 'paper' ? 'EXAM' : 'MARK_SCHEME'}.pdf`
      downloadBlob(blob, filename)
    } catch (err) {
      console.warn('PDF export error:', err)
    } finally {
      setIsExporting(false)
    }
  }

  const sections = paper.content?.sections || []
  let globalQNum = 1

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-4xl w-full p-8 shadow-2xl border border-border flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h2 className="font-extrabold text-lg text-text-primary">Official Print & Export Layout Preview</h2>
            <p className="text-xs text-text-muted">Centaurus Academy Physics Faculty Paper Layout</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-secondary text-xs"
              onClick={() => handleDownloadPDF('mark_scheme')}
              disabled={isExporting}
            >
              <Printer size={14} /> Mark Scheme PDF
            </button>
            <button
              type="button"
              className="btn btn-primary text-xs"
              onClick={() => handleDownloadPDF('paper')}
              disabled={isExporting}
            >
              <Download size={14} /> {isExporting ? 'Exporting PDF...' : 'Download Exam PDF'}
            </button>
            <button
              type="button"
              className="p-1 text-text-muted hover:text-text-primary text-base font-bold ml-2"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Rendered Official Exam Sheet */}
        <div className="border border-text-primary p-8 bg-bg-base flex flex-col gap-6 shadow-inner font-serif text-text-primary text-xs">
          {/* Cover Header */}
          <div className="flex flex-col items-center text-center gap-2 border-b-2 border-text-primary pb-6">
            <h1 className="text-2xl font-bold tracking-widest uppercase">CENTAURUS ACADEMY</h1>
            <p className="text-sm font-semibold text-text-secondary">DEPARTMENT OF PHYSICS</p>

            <div className="my-2 p-4 border border-text-primary w-full max-w-lg bg-white">
              <h2 className="text-lg font-bold">{paper.title}</h2>
              <p className="text-xs font-sans font-bold text-accent mt-1">
                {paper.curriculum_level?.name || 'Cambridge A-Level Physics'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-sans w-full max-w-lg bg-white p-3 border border-border">
              <div>Total Marks: <strong className="font-mono-numbers">{paper.total_marks}</strong></div>
              <div>Time Allowed: <strong>{paper.time_allowed || '1 Hour 30 Mins'}</strong></div>
            </div>

            <div className="p-3 bg-white border border-border text-left w-full max-w-lg font-sans text-[11px]">
              <strong className="block mb-1">INSTRUCTIONS TO CANDIDATES:</strong>
              <p>{paper.instructions}</p>
            </div>
          </div>

          {/* Paper Questions Body */}
          <div className="flex flex-col gap-6 font-sans">
            {sections.map((sec, secIdx) => (
              <div key={secIdx} className="flex flex-col gap-4">
                <h3 className="font-bold text-sm bg-bg-subtle p-2 rounded border-l-4 border-l-accent uppercase">
                  {sec.label || `SECTION ${secIdx + 1}`}
                </h3>

                {sec.questions.map((q, qIdx) => {
                  const currentNum = globalQNum++
                  return (
                    <div key={qIdx} className="p-4 rounded border border-border bg-white flex flex-col gap-2">
                      <div className="flex justify-between font-bold">
                        <span>Question {currentNum}</span>
                        <span className="font-mono-numbers text-accent">[{q.marks} Marks]</span>
                      </div>
                      <p className="text-xs text-text-primary leading-relaxed">{q.question_text}</p>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
