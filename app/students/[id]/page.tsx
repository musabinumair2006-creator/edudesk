'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { getStudentById, getStudentEnrollments, toggleStudentActive } from '@/lib/supabase/queries/students'
import { getAttendanceSummaryForStudent } from '@/lib/supabase/queries/attendance'
import { getAssignmentsForStudent } from '@/lib/supabase/queries/assignments'
import { getStudentPerformanceTrend } from '@/lib/supabase/queries/submissions'
import StudentPerformanceChart from '@/components/students/StudentPerformanceChart'
import type { Student, Enrollment, AttendanceSummary } from '@/lib/types'
import {
  formatDate,
  getAttendancePercentageBg,
  getAssignmentTypeLabel,
  getAssignmentTypeBadgeColor,
  getGradeFromPercentage,
  getGradeColor,
} from '@/lib/utils'
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  BookOpen,
  TrendingUp,
  Calendar,
  ToggleRight,
  ToggleLeft,
} from 'lucide-react'

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [student, setStudent] = useState<Student | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [attSummary, setAttSummary] = useState<AttendanceSummary | null>(null)
  const [assignments, setAssignments] = useState<
    Array<{ id: string; title: string; total_marks: number; assignment_type: string; submission?: { marks_obtained: number | null; status: string } }>
  >([])
  const [performanceTrend, setPerformanceTrend] = useState<
    Array<{ date: string; title: string; percentage: number; marks: number; total: number }>
  >([])
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'assignments'>('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    setIsLoading(true)
    const [studentData, enrollData, attData, assignData, trendData] = await Promise.all([
      getStudentById(id),
      getStudentEnrollments(id),
      getAttendanceSummaryForStudent(id),
      getAssignmentsForStudent(id),
      getStudentPerformanceTrend(id),
    ])
    setStudent(studentData)
    setEnrollments(enrollData)
    setAttSummary(attData)
    setAssignments(assignData as typeof assignments)
    setPerformanceTrend(trendData)
    setIsLoading(false)
  }

  async function handleToggleActive() {
    if (!student) return
    await toggleStudentActive(student.id, !student.is_active)
    setStudent((s) => s ? { ...s, is_active: !s.is_active } : null)
    setToast(student.is_active ? 'Student deactivated' : 'Student activated')
    setTimeout(() => setToast(null), 3000)
  }

  const avgMarks =
    performanceTrend.length > 0
      ? Math.round(performanceTrend.reduce((sum, p) => sum + p.percentage, 0) / performanceTrend.length)
      : null

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

  if (!student) {
    return (
      <AppShell>
        <Header title="Student not found" />
        <div className="page-body">
          <div className="empty-state">
            <User size={40} />
            <p>This student does not exist.</p>
            <Link href="/students" className="btn btn-secondary">Back to Students</Link>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <Header
        title={student.full_name}
        subtitle={student.roll_number ? `Roll #${student.roll_number}` : 'Student Profile'}
        actions={
          <div className="flex gap-2">
            <button
              onClick={handleToggleActive}
              className="btn btn-ghost btn-sm"
              style={{ color: student.is_active ? 'var(--warning)' : 'var(--success)' }}
            >
              {student.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              {student.is_active ? 'Deactivate' : 'Activate'}
            </button>
            <Link href="/students" className="btn btn-ghost btn-sm">
              <ArrowLeft size={14} /> All Students
            </Link>
          </div>
        }
      />

      <div className="page-body flex flex-col gap-6">
        {/* Student Header Card */}
        <div className="card">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              {student.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold">{student.full_name}</h2>
                <span
                  className="badge"
                  style={{
                    background: student.is_active ? 'var(--success-light)' : 'var(--bg-subtle)',
                    color: student.is_active ? 'var(--success)' : 'var(--text-muted)',
                  }}
                >
                  {student.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 mt-2">
                {student.email && (
                  <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <Mail size={13} /> {student.email}
                  </div>
                )}
                {student.phone && (
                  <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <Phone size={13} /> {student.phone}
                  </div>
                )}
                {student.parent_phone && (
                  <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <Phone size={13} /> Parent: {student.parent_phone}
                  </div>
                )}
                {student.date_of_birth && (
                  <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <Calendar size={13} /> {formatDate(student.date_of_birth)}
                  </div>
                )}
              </div>
              {/* Enrolled Classes */}
              <div className="flex flex-wrap gap-2 mt-3">
                {enrollments.map((e) => (
                  <Link
                    key={e.id}
                    href={`/classes/${e.class_id}`}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-xs"
                    style={{
                      background: 'var(--accent-light)',
                      color: 'var(--accent)',
                      textDecoration: 'none',
                      border: '1px solid rgba(37,99,235,0.15)',
                    }}
                  >
                    <BookOpen size={11} />
                    {(e.class as { name: string } | undefined)?.name || 'Class'}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {(['overview', 'attendance', 'assignments'] as const).map((t) => (
            <button
              key={t}
              className={`tab ${activeTab === t ? 'active' : ''}`}
              onClick={() => setActiveTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-4">
            <div className="grid-3">
              <div className="stat-card">
                <div className="label-sm">Attendance Rate</div>
                <div
                  className="stat-value font-mono"
                  style={{ color: attSummary ? (attSummary.percentage >= 80 ? 'var(--success)' : attSummary.percentage >= 60 ? 'var(--warning)' : 'var(--danger)') : 'var(--text-muted)' }}
                >
                  {attSummary ? `${attSummary.percentage}%` : '—'}
                </div>
                {attSummary && (
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {attSummary.present} present / {attSummary.total} sessions
                  </div>
                )}
              </div>
              <div className="stat-card">
                <div className="label-sm">Average Score</div>
                <div
                  className="stat-value font-mono"
                  style={{ color: avgMarks !== null ? (avgMarks >= 70 ? 'var(--success)' : avgMarks >= 50 ? 'var(--warning)' : 'var(--danger)') : 'var(--text-muted)' }}
                >
                  {avgMarks !== null ? `${avgMarks}%` : '—'}
                </div>
                {performanceTrend.length > 0 && (
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Based on {performanceTrend.length} graded submission{performanceTrend.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
              <div className="stat-card">
                <div className="label-sm">Overall Grade</div>
                <div className="flex items-center gap-2 mt-1">
                  {avgMarks !== null ? (
                    <span
                      className="badge text-xl font-bold font-mono"
                      style={{
                        ...Object.fromEntries(
                          getGradeColor(getGradeFromPercentage(avgMarks))
                            .split(' ')
                            .map((c) => {
                              const [k, v] = c.split('-')
                              return [k === 'text' ? 'color' : 'background', v]
                            })
                        ),
                        padding: '0.25rem 0.75rem',
                        fontSize: '1.5rem',
                      }}
                    >
                      {getGradeFromPercentage(avgMarks)}
                    </span>
                  ) : (
                    <span className="text-2xl font-mono" style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </div>
              </div>
            </div>

            {performanceTrend.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={15} style={{ color: 'var(--accent)' }} />
                    <h3 className="font-semibold text-sm">Performance Trend</h3>
                  </div>
                </div>
                <StudentPerformanceChart data={performanceTrend} />
              </div>
            )}
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-sm">Attendance Summary</h3>
            </div>
            {attSummary ? (
              <div>
                <div className="grid-4 mb-6">
                  {[
                    { label: 'Total Sessions', value: attSummary.total, color: 'var(--text-primary)' },
                    { label: 'Present', value: attSummary.present, color: 'var(--success)' },
                    { label: 'Absent', value: attSummary.absent, color: 'var(--danger)' },
                    { label: 'Late', value: attSummary.late, color: 'var(--warning)' },
                  ].map((item) => (
                    <div key={item.label} className="stat-card">
                      <div className="label-sm">{item.label}</div>
                      <div className="stat-value font-mono" style={{ color: item.color }}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  className="flex items-center gap-3 p-4 rounded-md"
                  style={{ background: 'var(--bg-subtle)' }}
                >
                  <div className="font-semibold">Attendance Rate:</div>
                  <span
                    className={`badge text-base font-mono font-semibold ${getAttendancePercentageBg(attSummary.percentage)}`}
                    style={{ padding: '0.25rem 0.75rem' }}
                  >
                    {attSummary.percentage}%
                  </span>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    ({attSummary.percentage >= 80 ? 'Good standing' : attSummary.percentage >= 60 ? 'Borderline — needs improvement' : 'Below threshold — action required'})
                  </span>
                </div>
              </div>
            ) : (
              <div className="empty-state py-8">
                <Calendar size={28} />
                <p>No attendance records found for this student.</p>
              </div>
            )}
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-sm">Assignment History</h3>
            </div>
            {assignments.length === 0 ? (
              <div className="empty-state py-8">
                <BookOpen size={28} />
                <p>No assignments found for this student&apos;s classes.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Assignment</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Marks</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => {
                    const sub = a.submission
                    const pct = sub?.marks_obtained != null
                      ? Math.round((sub.marks_obtained / a.total_marks) * 100)
                      : null
                    return (
                      <tr key={a.id}>
                        <td>
                          <Link
                            href={`/assignments/${a.id}`}
                            className="font-medium hover:underline"
                            style={{ color: 'var(--accent)' }}
                          >
                            {a.title}
                          </Link>
                        </td>
                        <td>
                          <span className={`badge ${getAssignmentTypeBadgeColor(a.assignment_type)}`}>
                            {getAssignmentTypeLabel(a.assignment_type)}
                          </span>
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
                            <span className="badge" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                              Not submitted
                            </span>
                          )}
                        </td>
                        <td>
                          {sub?.marks_obtained != null ? (
                            <span className="font-mono text-sm">
                              {sub.marks_obtained}/{a.total_marks}
                            </span>
                          ) : (
                            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                        <td>
                          {pct !== null ? (
                            <span
                              className={`badge font-mono font-semibold`}
                              style={{
                                background: pct >= 70 ? 'var(--success-light)' : pct >= 50 ? 'var(--warning-light)' : 'var(--danger-light)',
                                color: pct >= 70 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)',
                              }}
                            >
                              {getGradeFromPercentage(pct)}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {toast && <div className="toast success">✓ {toast}</div>}
    </AppShell>
  )
}
