'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { getAssignments } from '@/lib/supabase/queries/assignments'
import type { Assignment } from '@/lib/types'
import {
  formatDate,
  formatTimeAgo,
  getAssignmentTypeLabel,
  getAssignmentTypeBadgeColor,
} from '@/lib/utils'
import { Plus, Search, Clock, Users, Zap } from 'lucide-react'

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAssignments()
  }, [])

  async function loadAssignments() {
    setIsLoading(true)
    try {
      const data = await getAssignments()
      setAssignments(data)
    } finally {
      setIsLoading(false)
    }
  }

  const TYPES = ['all', 'assignment', 'quiz', 'classwork', 'midterm', 'finalterm']

  const filtered = assignments.filter((a) => {
    const matchSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.topic && a.topic.toLowerCase().includes(search.toLowerCase()))
    const matchType = filterType === 'all' || a.assignment_type === filterType
    return matchSearch && matchType
  })

  return (
    <AppShell>
      <Header
        title="Assignments"
        subtitle="All assignments across all classes"
        actions={
          <Link href="/assignments/new" className="btn btn-primary btn-sm">
            <Plus size={14} /> New Assignment
          </Link>
        }
      />

      <div className="page-body">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner spinner-lg" />
          </div>
        ) : (
          <div className="card">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-4 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 flex-1" style={{ minWidth: '200px', maxWidth: '360px' }}>
                <Search size={14} style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search title or topic..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {TYPES.map((type) => (
                  <button
                    key={type}
                    className="btn btn-sm"
                    style={{
                      background: filterType === type ? 'var(--accent)' : 'var(--bg-subtle)',
                      color: filterType === type ? 'white' : 'var(--text-secondary)',
                      border: filterType === type ? '1px solid var(--accent)' : '1px solid var(--border-strong)',
                    }}
                    onClick={() => setFilterType(type)}
                  >
                    {type === 'all' ? 'All' : getAssignmentTypeLabel(type)}
                  </button>
                ))}
              </div>
              <span className="text-sm font-mono ml-auto" style={{ color: 'var(--text-muted)' }}>
                {filtered.length}
              </span>
            </div>

            {filtered.length === 0 ? (
              <div className="empty-state py-10">
                <Clock size={36} />
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {assignments.length === 0 ? 'No assignments yet' : 'No assignments match your filters'}
                  </p>
                  {assignments.length === 0 && (
                    <p className="text-xs mt-1">Create your first assignment manually or with AI.</p>
                  )}
                </div>
                {assignments.length === 0 && (
                  <Link href="/assignments/new" className="btn btn-primary">
                    <Plus size={14} /> Create Assignment
                  </Link>
                )}
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Class</th>
                    <th>Type</th>
                    <th>Topic</th>
                    <th>Marks</th>
                    <th>Due Date</th>
                    <th>Submissions</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/assignments/${a.id}`}
                            className="font-medium hover:underline"
                            style={{ color: 'var(--accent)' }}
                          >
                            {a.title}
                          </Link>
                          {a.ai_generated && (
                            <span
                              title="AI Generated"
                              className="badge"
                              style={{ background: '#EDE9FE', color: '#7C3AED', fontSize: '10px', padding: '1px 5px' }}
                            >
                              <Zap size={9} />
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {a.class && (
                          <Link
                            href={`/classes/${a.class_id}`}
                            className="text-sm hover:underline"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {(a.class as { name: string }).name}
                          </Link>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${getAssignmentTypeBadgeColor(a.assignment_type)}`}>
                          {getAssignmentTypeLabel(a.assignment_type)}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {a.topic || '—'}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono font-medium">{a.total_marks}</span>
                      </td>
                      <td>
                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {a.due_date ? formatDate(a.due_date) : '—'}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Users size={12} style={{ color: 'var(--text-muted)' }} />
                          <span className="font-mono text-sm">{a.submission_count ?? 0}</span>
                          {(a.checked_count ?? 0) > 0 && (
                            <span className="text-xs" style={{ color: 'var(--success)' }}>
                              ✓{a.checked_count}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <Link href={`/assignments/${a.id}`} className="btn btn-secondary btn-sm">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
