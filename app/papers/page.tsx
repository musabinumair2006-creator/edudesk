'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { supabase } from '@/lib/supabase'
import type { Paper } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { FileText, FilePlus, Search, Trash2, Eye } from 'lucide-react'

export default function PapersListPage() {
  const [papers, setPapers] = useState<Paper[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPapers()
  }, [])

  async function loadPapers() {
    setIsLoading(true)
    try {
      const { data } = await supabase
        .from('papers')
        .select('*, class:classes(name), curriculum_level:curriculum_levels(name)')
        .order('created_at', { ascending: false })

      if (data && data.length > 0) {
        setPapers(data as Paper[])
      } else {
        // Fallback demo papers
        setPapers([
          {
            id: 'p-1',
            teacher_id: 'demo',
            title: 'A-Level Electromagnetic Induction & Faraday Laws',
            paper_type: 'assignment',
            total_marks: 45,
            time_allowed: '1 Hour',
            status: 'distributed',
            creation_mode: 'mixed',
            content: { sections: [] },
            created_at: new Date().toISOString(),
          },
          {
            id: 'p-2',
            teacher_id: 'demo',
            title: 'IGCSE Kinematics & Velocity-Time Graphs',
            paper_type: 'quiz',
            total_marks: 25,
            time_allowed: '45 Mins',
            status: 'final',
            creation_mode: 'pull',
            content: { sections: [] },
            created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          },
          {
            id: 'p-3',
            teacher_id: 'demo',
            title: 'Quantum Physics & Photoelectric Effect Test',
            paper_type: 'midterm',
            total_marks: 60,
            time_allowed: '1 Hour 30 Mins',
            status: 'draft',
            creation_mode: 'generate',
            content: { sections: [] },
            created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
          },
        ])
      }
    } catch (err) {
      console.warn('Papers load error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDeletePaper(id: string) {
    if (!confirm('Are you sure you want to delete this paper?')) return
    try {
      await supabase.from('papers').delete().eq('id', id)
      setPapers(papers.filter((p) => p.id !== id))
    } catch (err) {
      console.warn('Delete paper error:', err)
    }
  }

  const filteredPapers = papers.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <AppShell>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-border">
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
              Exam Papers & Assignments
            </h1>
            <p className="text-xs text-text-muted mt-1 font-medium">
              Manage created papers, track distribution, and record student marks
            </p>
          </div>
          <Link href="/papers/create" className="btn btn-primary text-xs shadow-sm">
            <FilePlus size={16} /> Create New Paper
          </Link>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-border">
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-3 text-text-muted" />
            <input
              type="text"
              className="form-input pl-8 text-xs py-1.5"
              placeholder="Search paper title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-medium text-text-muted">Status:</span>
            <select
              className="form-input text-xs py-1.5 px-3 border-border"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="final">Final</option>
              <option value="distributed">Distributed</option>
            </select>
          </div>
        </div>

        {/* Papers List */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-text-muted">Loading papers...</div>
        ) : filteredPapers.length === 0 ? (
          <div className="card p-12 text-center text-xs text-text-muted bg-bg-subtle border border-border">
            <FileText size={32} className="mx-auto mb-3 text-text-muted" />
            <p className="font-semibold text-text-primary text-sm mb-1">No papers match your filters</p>
            <p className="text-text-muted max-w-sm mx-auto mb-4">Click "Create New Paper" to build your first exam paper.</p>
            <Link href="/papers/create" className="btn btn-primary text-xs py-1.5 px-4 mx-auto">
              <FilePlus size={14} /> Create Paper
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPapers.map((paper) => (
              <div
                key={paper.id}
                className="card bg-white hover:border-accent/40 transition-all flex flex-col justify-between gap-4 p-5"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`badge ${
                        paper.status === 'distributed'
                          ? 'badge-success'
                          : paper.status === 'final'
                          ? 'badge-primary'
                          : 'badge-subtle'
                      }`}
                    >
                      {paper.status.toUpperCase()}
                    </span>
                    <span className="text-[11px] font-mono-numbers text-text-muted">
                      {formatDate(paper.created_at)}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-text-primary mt-1 line-clamp-2">{paper.title}</h3>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted mt-1">
                    <span className="badge badge-subtle">{paper.paper_type.toUpperCase()}</span>
                    <span>•</span>
                    <span className="font-mono-numbers font-semibold text-text-primary">
                      {paper.total_marks} Marks
                    </span>
                    <span>•</span>
                    <span>{paper.curriculum_level?.name || 'A-Level Physics'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border mt-2">
                  <span className="text-[11px] text-text-muted font-medium">
                    Mode: {paper.creation_mode ? paper.creation_mode.toUpperCase() : 'MIXED'}
                  </span>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/papers/${paper.id}`}
                      className="btn btn-primary py-1 px-3 text-xs"
                    >
                      <Eye size={14} /> Open
                    </Link>
                    <button
                      type="button"
                      className="p-1.5 text-text-muted hover:text-danger rounded-md hover:bg-danger-light"
                      onClick={() => handleDeletePaper(paper.id)}
                      title="Delete paper"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
