'use client'

import React from 'react'
import Link from 'next/link'
import SuggestionBadge from '@/components/suggestions/SuggestionBadge'
import type { AISuggestion } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { Lightbulb, ArrowRight, X } from 'lucide-react'

interface SuggestionCardProps {
  suggestion: AISuggestion
  onRefresh?: () => void
}

export default function SuggestionCard({ suggestion, onRefresh }: SuggestionCardProps) {
  async function handleDismiss() {
    await fetch('/api/suggestions/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        suggestion_id: suggestion.id,
        action: 'reject',
      }),
    })
    if (onRefresh) onRefresh()
  }

  return (
    <div className="card flex flex-col justify-between p-4 gap-3 border-border hover:border-accent/40 transition-all">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <SuggestionBadge type={suggestion.suggestion_type} />
          <span className="text-[11px] text-text-muted">{formatDate(suggestion.created_at)}</span>
        </div>

        <h3 className="font-bold text-sm text-text-primary mt-1 line-clamp-2">{suggestion.title}</h3>

        <p className="text-xs text-text-secondary line-clamp-2">
          {typeof suggestion.content === 'string'
            ? suggestion.content
            : suggestion.content?.executive_summary ||
              suggestion.content?.recommended_action ||
              suggestion.content?.title ||
              'Click review to examine generated AI suggestion details.'}
        </p>
      </div>

      <div className="pt-3 border-t border-border flex items-center justify-between">
        <button className="btn btn-ghost btn-sm text-xs text-text-muted hover:text-danger" onClick={handleDismiss}>
          Dismiss
        </button>

        <Link href={`/suggestions/${suggestion.id}`} className="btn btn-secondary btn-sm flex items-center gap-1 text-xs">
          <span>Review & Approve</span>
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  )
}
