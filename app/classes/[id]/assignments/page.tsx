'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { getClassById } from '@/lib/supabase/queries/classes'
import { getAssignmentsByClass } from '@/lib/supabase/queries/assignments'
import type { Class, Assignment } from '@/lib/types'
import {
  formatDate,
  getAssignmentTypeLabel,
  getAssignmentTypeBadgeColor,
} from '@/lib/utils'
import { ArrowLeft, Plus, Clock, Users } from 'lucide-react'

export default function ClassAssignmentsPage() {
  const { id } = useParams<{ id: string }>()
  const [cls, setCls] = useState<Class | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    setIsLoading(true)
    const [classData, assignmentData] = await Promise.all([
      getClassById(id),
      getAssignmentsByClass(id),
    ])
    setCls(classData)
    setAssignments(assignmentData)
    setIsLoading(false)
  }

  return (
    <AppShell>
      <Header
        title={`Assignments — ${cls?.name || ''}`}
        subtitle={`${assignments.length} assignment${assignments.length !== 1 ? 's' : ''}`}
        actions={
          <div className="flex gap-2">
            <Link href="/assignments/new" className="btn btn-primary btn-sm">
              <Plus size={14} /> New Assignment
            </Link>
            <Link href={`/classes/${id}`} className="btn btn-ghost btn-sm">
              <ArrowLeft size={14} /> Back
            </Link>
          </div>
        }
      />

      <div className="page-body">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner spinner-lg" />
          </div>
        ) : assignments.length === 0 ? (
          <div className="empty-state" style={{ paddingTop: '5rem' }}>
            <Clock size={40} />
            <div>
              <p className="font-semibold text-base" style={{ color: 'var(--text-secondary)' }}>
                No assignments yet
              </p>
              <p className="text-sm mt-1">
                Create an assignment for this class manually or using AI.
              </p>
            </div>
            <Link href="/assignments/new" className="btn btn-primary mt-2">
              <Plus size={14} /> Create Assignment
            </Link>
          </div>
        ) : (
          <div className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Topic</th>
                  <th>Total Marks</th>
                  <th>Due Date</th>
                  <th>Submissions</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div>
                        <Link
                          href={`/assignments/${a.id}`}
                          className="font-medium hover:underline"
                          style={{ color: 'var(--accent)' }}
                        >
                          {a.title}
                        </Link>
                        {a.ai_generated && (
                          <span
                            className="badge ml-2"
                            style={{ background: '#EDE9FE', color: '#7C3AED', fontSize: '10px' }}
                          >
                            AI
                          </span>
                        )}
                      </div>
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
                      <div className="flex items-center gap-1 text-sm">
                        <Clock size={12} style={{ color: 'var(--text-muted)' }} />
                        {a.due_date ? formatDate(a.due_date) : '—'}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Users size={12} style={{ color: 'var(--text-muted)' }} />
                        <span className="font-mono text-sm">{a.submission_count ?? 0}</span>
                        {(a.checked_count ?? 0) > 0 && (
                          <span className="text-xs" style={{ color: 'var(--success)' }}>
                            ({a.checked_count} checked)
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <Link
                        href={`/assignments/${a.id}`}
                        className="btn btn-secondary btn-sm"
                      >
                        View
                      </Link>
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
