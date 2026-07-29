'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { createClient } from '@/lib/supabase/client'
import { formatDate, formatTimeAgo } from '@/lib/utils'
import { FileText, Plus } from 'lucide-react'

interface Paper {
  id: string
  title: string
  paper_type: string
  topics: string[]
  total_marks: number | null
  time_allowed: string | null
  created_at: string
  curriculum_level?: { name: string } | null
}

export default function PapersPage() {
  const supabase = createClient()
  const [papers, setPapers] = useState<Paper[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPapers()
  }, [])

  async function loadPapers() {
    setIsLoading(true)
    const { data } = await supabase
      .from('papers')
      .select('*, curriculum_level:curriculum_levels(name)')
      .order('created_at', { ascending: false })
    setPapers((data || []) as Paper[])
    setIsLoading(false)
  }

  return (
    <AppShell>
      <Header
        title="Exam Papers"
        subtitle="AI-generated exam papers"
        actions={
          <Link href="/papers/generate" className="btn btn-primary btn-sm">
            <Plus size={14} /> Generate Paper
          </Link>
        }
      />

      <div className="page-body">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="spinner spinner-lg" />
          </div>
        ) : papers.length === 0 ? (
          <div className="empty-state" style={{ paddingTop: '5rem' }}>
            <FileText size={48} />
            <div>
              <p className="font-semibold text-base" style={{ color: 'var(--text-secondary)' }}>
                No exam papers yet
              </p>
              <p className="text-sm mt-1">Use the AI paper generator to create your first exam.</p>
            </div>
            <Link href="/papers/generate" className="btn btn-primary mt-2">
              <Plus size={14} /> Generate Paper
            </Link>
          </div>
        ) : (
          <div className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Level</th>
                  <th>Marks</th>
                  <th>Time</th>
                  <th>Topics</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {papers.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <FileText size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                        <span className="font-medium">{p.title}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: p.paper_type === 'finalterm' ? 'var(--danger-light)' : 'var(--warning-light)',
                          color: p.paper_type === 'finalterm' ? 'var(--danger)' : 'var(--warning)',
                        }}
                      >
                        {p.paper_type === 'finalterm' ? 'Final Term' : 'Mid-Term'}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {p.curriculum_level?.name || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono">{p.total_marks || '—'}</span>
                    </td>
                    <td>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {p.time_allowed || '—'}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {(p.topics || []).slice(0, 2).map((t, i) => (
                          <span
                            key={i}
                            className="badge"
                            style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)', fontSize: '11px' }}
                          >
                            {t}
                          </span>
                        ))}
                        {(p.topics || []).length > 2 && (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            +{p.topics.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {formatTimeAgo(p.created_at)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  )
}
