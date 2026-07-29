'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { getAssignmentById } from '@/lib/supabase/queries/assignments'
import { getSubmissionsByAssignment } from '@/lib/supabase/queries/submissions'
import { getStudentsByClass } from '@/lib/supabase/queries/students'
import type { Assignment, Submission, Student } from '@/lib/types'
import {
  formatDate,
  formatTimeAgo,
  getAssignmentTypeLabel,
  getAssignmentTypeBadgeColor,
  getGradeFromPercentage,
} from '@/lib/utils'
import { ArrowLeft, Users, Clock, Eye, EyeOff, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()

  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [showAnswerKey, setShowAnswerKey] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    setIsLoading(true)
    const a = await getAssignmentById(id)
    if (a) {
      setAssignment(a)
      const [subs, stds] = await Promise.all([
        getSubmissionsByAssignment(id),
        getStudentsByClass(a.class_id),
      ])
      setSubmissions(subs)
      setStudents(stds)
    }
    setIsLoading(false)
  }

  async function handleAddSubmission(studentId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !assignment) return

    await supabase.from('submissions').upsert({
      assignment_id: id,
      student_id: studentId,
      teacher_id: user.id,
      content: '',
      status: 'submitted',
    }, { onConflict: 'assignment_id,student_id' })

    loadData()
  }

  if (isLoading) {
    return (
      <AppShell>
        <Header title="Loading..." />
        <div className="page-body flex justify-center py-20">
          <div className="spinner spinner-lg" />
        </div>
      </AppShell>
    )
  }

  if (!assignment) {
    return (
      <AppShell>
        <Header title="Assignment not found" />
        <div className="page-body">
          <div className="empty-state">
            <p>This assignment does not exist.</p>
            <Link href="/assignments" className="btn btn-secondary">Back to Assignments</Link>
          </div>
        </div>
      </AppShell>
    )
  }

  // Build submission map
  const subMap = Object.fromEntries(submissions.map((s) => [s.student_id, s]))

  // Stats
  const submitted = submissions.length
  const checked = submissions.filter((s) => s.status === 'checked' || s.status === 'returned').length
  const notSubmitted = students.length - submitted
  const markedSubs = submissions.filter((s) => s.marks_obtained !== null)
  const classAvg = markedSubs.length > 0
    ? Math.round(markedSubs.reduce((sum, s) => sum + ((s.marks_obtained as number) / assignment.total_marks) * 100, 0) / markedSubs.length)
    : null

  return (
    <AppShell>
      <Header
        title={assignment.title}
        subtitle={`${(assignment.class as { name: string } | undefined)?.name || ''} · ${getAssignmentTypeLabel(assignment.assignment_type)}`}
        actions={
          <Link href="/assignments" className="btn btn-ghost btn-sm">
            <ArrowLeft size={14} /> All Assignments
          </Link>
        }
      />

      <div className="page-body flex flex-col gap-6">
        {/* Assignment Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card lg:col-span-2">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`badge ${getAssignmentTypeBadgeColor(assignment.assignment_type)}`}>
                {getAssignmentTypeLabel(assignment.assignment_type)}
              </span>
              {assignment.ai_generated && (
                <span className="badge" style={{ background: '#EDE9FE', color: '#7C3AED' }}>⚡ AI Generated</span>
              )}
              {assignment.topic && (
                <span className="badge" style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                  {assignment.topic}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <div className="label-sm mb-1">Total Marks</div>
                <div className="font-mono font-semibold text-lg">{assignment.total_marks}</div>
              </div>
              <div>
                <div className="label-sm mb-1">Due Date</div>
                <div className="text-sm">{assignment.due_date ? formatDate(assignment.due_date) : '—'}</div>
              </div>
              <div>
                <div className="label-sm mb-1">Class Average</div>
                <div
                  className="font-mono font-semibold text-lg"
                  style={{ color: classAvg !== null ? (classAvg >= 70 ? 'var(--success)' : classAvg >= 50 ? 'var(--warning)' : 'var(--danger)') : 'var(--text-muted)' }}
                >
                  {classAvg !== null ? `${classAvg}%` : '—'}
                </div>
              </div>
              <div>
                <div className="label-sm mb-1">Progress</div>
                <div className="text-sm">
                  <span className="font-mono font-semibold">{checked}</span>
                  <span className="text-text-muted">/{students.length} checked</span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="label-sm mb-2">Instructions</div>
            <div
              className="text-sm"
              style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}
              dangerouslySetInnerHTML={{ __html: assignment.instructions }}
            />

            {/* Answer Key */}
            {assignment.answer_key && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <button
                  className="btn btn-ghost btn-sm mb-2"
                  onClick={() => setShowAnswerKey(!showAnswerKey)}
                  style={{ color: 'var(--warning)' }}
                >
                  {showAnswerKey ? <EyeOff size={13} /> : <Eye size={13} />}
                  {showAnswerKey ? 'Hide' : 'Show'} Answer Key
                </button>
                {showAnswerKey && (
                  <div
                    className="p-3 rounded-md text-sm"
                    style={{ background: 'var(--warning-light)', border: '1px solid var(--warning)' }}
                    dangerouslySetInnerHTML={{ __html: assignment.answer_key }}
                  />
                )}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex flex-col gap-3">
            {[
              { label: 'Submitted', value: submitted, color: 'var(--accent)' },
              { label: 'Checked', value: checked, color: 'var(--success)' },
              { label: 'Not Submitted', value: notSubmitted, color: 'var(--danger)' },
            ].map((s) => (
              <div key={s.label} className="stat-card">
                <div className="label-sm">{s.label}</div>
                <div className="stat-value font-mono" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Submissions Table */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Users size={15} style={{ color: 'var(--accent)' }} />
              <h2 className="font-semibold text-sm">Student Submissions</h2>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Marks</th>
                <th>Grade</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const sub = subMap[student.id]
                const pct = sub?.marks_obtained != null
                  ? Math.round((sub.marks_obtained / assignment.total_marks) * 100)
                  : null

                return (
                  <tr key={student.id}>
                    <td>
                      <Link
                        href={`/students/${student.id}`}
                        className="font-medium hover:underline"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {student.full_name}
                      </Link>
                    </td>
                    <td>
                      {sub ? (
                        <span
                          className="badge"
                          style={{
                            background: sub.status === 'returned' ? 'var(--success-light)' : sub.status === 'checked' ? 'var(--accent-light)' : 'var(--warning-light)',
                            color: sub.status === 'returned' ? 'var(--success)' : sub.status === 'checked' ? 'var(--accent)' : 'var(--warning)',
                          }}
                        >
                          {sub.status}
                        </span>
                      ) : (
                        <span className="badge" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
                          Not submitted
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {sub ? formatTimeAgo(sub.submitted_at) : '—'}
                      </span>
                    </td>
                    <td>
                      {sub?.marks_obtained != null ? (
                        <span className="font-mono text-sm font-medium">
                          {sub.marks_obtained}/{assignment.total_marks}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      {pct !== null ? (
                        <span
                          className="badge font-mono font-semibold"
                          style={{
                            background: pct >= 70 ? 'var(--success-light)' : pct >= 50 ? 'var(--warning-light)' : 'var(--danger-light)',
                            color: pct >= 70 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)',
                          }}
                        >
                          {getGradeFromPercentage(pct)}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      {sub ? (
                        <Link
                          href={`/assignments/${id}/submissions/${student.id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          {sub.status === 'submitted' ? 'Review' : 'View'}
                        </Link>
                      ) : (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleAddSubmission(student.id)}
                          title="Add empty submission to mark"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <Plus size={13} /> Add
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  )
}
