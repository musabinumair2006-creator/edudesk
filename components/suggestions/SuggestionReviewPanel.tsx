'use client'

import React, { useState } from 'react'
import type { AISuggestion } from '@/lib/types'
import { generateAcademicTextPDF } from '@/lib/exporters/pdf-exporter'
import { CheckCircle, X, Download, Edit2, Sparkles, Send } from 'lucide-react'

interface SuggestionReviewPanelProps {
  suggestion: AISuggestion
  onApproved?: () => void
}

export default function SuggestionReviewPanel({ suggestion, onApproved }: SuggestionReviewPanelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState<any>(suggestion.content)
  const [teacherNote, setTeacherNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleApprove(action: 'approve' | 'reject' | 'modify' = 'approve') {
    setIsSubmitting(true)
    try {
      await fetch('/api/suggestions/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestion_id: suggestion.id,
          action,
          teacher_note: teacherNote,
          updated_content: action === 'modify' ? editedContent : suggestion.content,
        }),
      })

      if (onApproved) onApproved()
    } catch {
      alert('Error saving suggestion status.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleExportPDF() {
    const pdfText = generateAcademicTextPDF({
      title: suggestion.title,
      subtitle: `Centaurus Academy Physics — ${suggestion.suggestion_type}`,
      content: JSON.stringify(editedContent, null, 2),
    })

    const blob = new Blob([pdfText], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${suggestion.title.replace(/[^a-z0-9]/gi, '_')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Main Content View */}
      <div className="lg:col-span-2 card p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h2 className="font-bold text-base text-text-primary">{suggestion.title}</h2>
          <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(!isEditing)}>
            <Edit2 size={14} /> {isEditing ? 'Cancel Edit' : 'Edit Content'}
          </button>
        </div>

        {isEditing ? (
          <div className="flex flex-col gap-3">
            <label className="text-xs font-semibold text-text-muted">Edit JSON / Content Representation</label>
            <textarea
              className="form-input font-mono text-xs h-96"
              value={typeof editedContent === 'string' ? editedContent : JSON.stringify(editedContent, null, 2)}
              onChange={(e) => {
                try {
                  setEditedContent(JSON.parse(e.target.value))
                } catch {
                  setEditedContent(e.target.value)
                }
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4 text-xs leading-relaxed text-text-primary">
            {/* Render based on suggestion type */}
            {suggestion.suggestion_type.includes('assignment') || suggestion.suggestion_type.includes('paper') ? (
              <div className="flex flex-col gap-3">
                <div className="p-3 bg-bg-subtle rounded border border-border">
                  <div className="font-bold text-sm">{editedContent.title}</div>
                  <div className="text-text-muted mt-0.5">
                    {editedContent.curriculum_level} • {editedContent.topic} • {editedContent.total_marks} Marks
                  </div>
                </div>

                <div>
                  <strong>Instructions:</strong> {editedContent.instructions}
                </div>

                {editedContent.sections?.map((sec: any, idx: number) => (
                  <div key={idx} className="flex flex-col gap-2 mt-2">
                    <div className="font-bold text-accent uppercase">{sec.section_label}: {sec.section_title}</div>
                    {sec.questions?.map((q: any) => (
                      <div key={q.number} className="p-3 border border-border rounded bg-bg-surface flex flex-col gap-1">
                        <div className="font-medium">
                          {q.number}. {q.question} <span className="text-text-muted font-mono">[{q.marks} marks]</span>
                        </div>
                        {q.options && (
                          <div className="grid grid-cols-2 gap-1 mt-1 text-text-secondary">
                            {q.options.map((opt: string, i: number) => (
                              <span key={i}>{opt}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : suggestion.suggestion_type.includes('report') ? (
              <div className="flex flex-col gap-3">
                <div className="p-3.5 bg-accent-light rounded border border-accent">
                  <div className="font-bold text-sm text-accent">Executive Summary</div>
                  <div className="mt-1 text-text-primary">{editedContent.executive_summary}</div>
                </div>

                <div>
                  <h4 className="font-bold text-xs uppercase text-text-muted mb-1">Strengths</h4>
                  <ul className="list-disc pl-4 text-text-secondary">
                    {editedContent.strengths?.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-xs uppercase text-text-muted mb-1">Areas to Improve</h4>
                  <ul className="list-disc pl-4 text-text-secondary">
                    {editedContent.areas_to_improve?.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded border border-border bg-bg-subtle font-mono text-xs whitespace-pre-wrap">
                {JSON.stringify(editedContent, null, 2)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Action Control Panel */}
      <div className="card p-6 flex flex-col justify-between gap-6">
        <div className="flex flex-col gap-4">
          <h3 className="font-bold text-sm text-text-primary border-b border-border pb-2">
            Teacher Approval Actions
          </h3>

          <div className="form-group">
            <label className="form-label">Optional Teacher Note</label>
            <textarea
              className="form-input text-xs"
              placeholder="Add personal notes before approving..."
              value={teacherNote}
              onChange={(e) => setTeacherNote(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <button
              className="btn btn-primary justify-center py-2.5"
              onClick={() => handleApprove('approve')}
              disabled={isSubmitting}
            >
              <CheckCircle size={16} /> Approve & Save as Active
            </button>

            {isEditing && (
              <button
                className="btn btn-secondary justify-center py-2 text-accent border-accent"
                onClick={() => handleApprove('modify')}
                disabled={isSubmitting}
              >
                Approve Modified Version
              </button>
            )}

            <button
              className="btn btn-danger justify-center py-2"
              onClick={() => handleApprove('reject')}
              disabled={isSubmitting}
            >
              <X size={16} /> Reject Suggestion
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <button className="btn btn-secondary w-full justify-center text-xs" onClick={handleExportPDF}>
            <Download size={14} /> Export Text / PDF Copy
          </button>
        </div>
      </div>
    </div>
  )
}
