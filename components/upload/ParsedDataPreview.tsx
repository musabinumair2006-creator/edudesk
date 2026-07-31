'use client'

import React from 'react'
import type { ParsedDataResult } from '@/lib/types'
import { AlertCircle, Lightbulb } from 'lucide-react'

interface ParsedDataPreviewProps {
  parsedData: ParsedDataResult
}

export default function ParsedDataPreview({ parsedData }: ParsedDataPreviewProps) {
  const students = parsedData.extracted_data?.students || []

  return (
    <div className="flex flex-col gap-4">
      {/* Warnings & Suggestions */}
      {parsedData.warnings && parsedData.warnings.length > 0 && (
        <div className="p-3 rounded bg-warning-light border border-warning text-warning text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{parsedData.warnings.join(' • ')}</span>
        </div>
      )}

      {parsedData.suggestions && parsedData.suggestions.length > 0 && (
        <div className="p-3 rounded bg-accent-light border border-accent text-accent text-xs flex items-center gap-2">
          <Lightbulb size={16} />
          <span>AI Suggestion: {parsedData.suggestions.join(' • ')}</span>
        </div>
      )}

      {/* Preview Table */}
      <div className="overflow-x-auto border border-border rounded-lg bg-bg-surface">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Student Name</th>
              <th>Roll Number</th>
              <th>Status / Score</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-xs text-text-muted">
                  No explicit student rows detected in the extracted view.
                </td>
              </tr>
            ) : (
              students.slice(0, 10).map((std, idx) => (
                <tr key={idx}>
                  <td className="font-mono text-xs text-text-muted">{idx + 1}</td>
                  <td className="font-semibold">{std.name}</td>
                  <td className="font-mono text-xs">{std.roll_number || '—'}</td>
                  <td>
                    {std.status ? (
                      <span className="badge capitalize bg-bg-subtle text-text-primary">
                        {std.status}
                      </span>
                    ) : std.scores && std.scores.length > 0 ? (
                      <span className="font-mono text-xs text-accent">
                        {std.scores[0].marks_obtained} / {std.scores[0].total_marks}
                      </span>
                    ) : (
                      'Extracted'
                    )}
                  </td>
                  <td className="text-xs text-text-muted">
                    {std.date || (std.scores ? std.scores[0]?.assessment_name : 'Verified')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
