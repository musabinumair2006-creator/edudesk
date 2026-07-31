'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import SuggestionCard from '@/components/suggestions/SuggestionCard'
import { getAISuggestions } from '@/lib/supabase/queries/suggestions'
import type { AISuggestion, AISuggestionStatus } from '@/lib/types'
import { Lightbulb, Filter, CheckCircle2, Clock } from 'lucide-react'

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<AISuggestionStatus>('pending')

  useEffect(() => {
    loadData()
  }, [filterStatus])

  async function loadData() {
    setIsLoading(true)
    const data = await getAISuggestions(filterStatus)
    setSuggestions(data)
    setIsLoading(false)
  }

  const filtered = suggestions.filter((s) => {
    if (filterType === 'all') return true
    if (filterType === 'assignment') return s.suggestion_type === 'generated_assignment' || s.suggestion_type === 'generated_paper'
    if (filterType === 'feedback') return s.suggestion_type === 'submission_feedback'
    if (filterType === 'report') return s.suggestion_type === 'student_report' || s.suggestion_type === 'class_report'
    if (filterType === 'alert') return s.suggestion_type === 'attendance_alert' || s.suggestion_type === 'performance_flag'
    return true
  })

  return (
    <AppShell>
      <Header
        title="AI Suggestions Review Queue"
        subtitle="Review, modify, and approve AI-generated assignments, feedback, and reports"
      />

      <div className="page-body flex flex-col gap-6">
        {/* Filter Tabs */}
        <div className="card">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                className={`btn btn-sm ${filterStatus === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterStatus('pending')}
              >
                <Clock size={13} /> Pending Review
              </button>
              <button
                className={`btn btn-sm ${filterStatus === 'approved' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterStatus('approved')}
              >
                <CheckCircle2 size={13} /> Approved
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {['all', 'assignment', 'feedback', 'report', 'alert'].map((type) => (
                <button
                  key={type}
                  className="btn btn-sm capitalize"
                  style={{
                    background: filterType === type ? 'var(--accent)' : 'var(--bg-subtle)',
                    color: filterType === type ? 'white' : 'var(--text-secondary)',
                  }}
                  onClick={() => setFilterType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Suggestions List Grid */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <span className="spinner spinner-lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16 text-text-muted">
            <Lightbulb size={40} className="mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-text-primary">No suggestions match your filter</p>
            <p className="text-xs mt-1">Upload an LMS file or generate an AI assignment to create suggestions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((sug) => (
              <SuggestionCard key={sug.id} suggestion={sug} onRefresh={loadData} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
