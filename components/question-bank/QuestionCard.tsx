'use client'

import type { Question } from '@/lib/types'
import { Plus, Sparkles, Check, AlertTriangle, FileText } from 'lucide-react'

export function QuestionCard({
  question,
  isAdded,
  onAddToPaper,
  onGenerateSimilar,
}: {
  question: Question
  isAdded: boolean
  onAddToPaper: () => void
  onGenerateSimilar: () => void
}) {
  return (
    <div className="card bg-white p-5 hover:border-accent/40 transition-all flex flex-col gap-3 shadow-sm border border-border">
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {question.question_number && (
            <span className="text-xs font-bold text-text-muted bg-bg-subtle px-2 py-0.5 rounded font-mono-numbers">
              {question.question_number}
            </span>
          )}
          <span className="badge badge-primary text-xs font-semibold">{question.topic}</span>
          {question.subtopic && (
            <span className="badge badge-subtle text-xs font-normal">{question.subtopic}</span>
          )}
        </div>

        <span className="badge badge-primary font-mono-numbers font-bold text-xs py-1 px-2">
          [{question.marks} Marks]
        </span>
      </div>

      {/* Question Text */}
      <p className="text-xs text-text-primary leading-relaxed font-medium">
        {question.question_text}
      </p>

      {/* Diagram Warning if applicable */}
      {question.has_diagram && (
        <div className="p-2 rounded bg-warning-light border border-warning/30 text-[11px] text-warning font-semibold flex items-center gap-1.5 w-fit">
          <AlertTriangle size={14} />
          <span>Requires diagram reference from original paper</span>
        </div>
      )}

      {/* Mark Scheme Answer if available */}
      {question.answer && (
        <div className="p-2.5 rounded bg-success-light/60 border border-success/20 text-[11px] text-success font-mono-numbers mt-1">
          <strong className="block text-success font-sans mb-0.5">Solution Guidance:</strong>
          {question.answer}
        </div>
      )}

      {/* Footer Tags & Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t border-border mt-1">
        <div className="flex items-center gap-2 text-[11px] text-text-muted">
          {question.source?.title && (
            <span className="flex items-center gap-1">
              <FileText size={12} /> {question.source.title}
            </span>
          )}
          {question.year && <span className="font-mono-numbers">• {question.year}</span>}
          {question.difficulty && <span className="capitalize">• {question.difficulty}</span>}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            className="btn btn-outline py-1 px-2.5 text-xs border-accent/40 text-accent hover:bg-accent-light flex-1 sm:flex-none justify-center"
            onClick={onGenerateSimilar}
          >
            <Sparkles size={12} /> Generate Similar
          </button>

          <button
            type="button"
            className={`btn py-1 px-3 text-xs flex-1 sm:flex-none justify-center ${
              isAdded ? 'btn-secondary text-success border-success' : 'btn-primary'
            }`}
            onClick={onAddToPaper}
          >
            {isAdded ? (
              <>
                <Check size={12} /> Added to Paper
              </>
            ) : (
              <>
                <Plus size={12} /> Add to Paper
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
