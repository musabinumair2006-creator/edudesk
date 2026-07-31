'use client'

import React from 'react'

interface ReportPDFTemplateProps {
  title: string
  academyName?: string
  date?: string
  content: any
}

export default function ReportPDFTemplate({
  title,
  academyName = 'Centaurus Academy',
  date = new Date().toLocaleDateString(),
  content,
}: ReportPDFTemplateProps) {
  return (
    <div className="p-8 bg-white border border-slate-300 font-sans max-w-2xl mx-auto print:p-0 print:border-none">
      <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4 mb-6">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900">
            Centaurus Academy
          </h1>
          <p className="text-xs text-slate-600 font-medium">Department of Physics • Official Academic Report</p>
        </div>
        <div className="text-right text-xs text-slate-500 font-mono">
          <div>{date}</div>
        </div>
      </div>

      <div className="flex flex-col gap-4 text-xs leading-relaxed text-slate-800">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1">{title}</h2>

        {content.executive_summary && (
          <div>
            <h3 className="font-bold text-slate-900 uppercase text-[11px] mb-1">1. Executive Summary</h3>
            <p className="text-slate-700">{content.executive_summary}</p>
          </div>
        )}

        {content.strengths && content.strengths.length > 0 && (
          <div>
            <h3 className="font-bold text-slate-900 uppercase text-[11px] mb-1">2. Key Strengths</h3>
            <ul className="list-disc pl-4 space-y-1">
              {content.strengths.map((item: string, idx: number) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {content.recommendations && content.recommendations.length > 0 && (
          <div>
            <h3 className="font-bold text-slate-900 uppercase text-[11px] mb-1">3. Recommendations</h3>
            <ul className="list-disc pl-4 space-y-1">
              {content.recommendations.map((item: string, idx: number) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-8 pt-4 border-t border-slate-300 flex justify-between text-[10px] text-slate-500 font-mono">
        <span>Verified by PhysicsDesk AI Engine</span>
        <span>Centaurus Academy • Physics Faculty</span>
      </div>
    </div>
  )
}
