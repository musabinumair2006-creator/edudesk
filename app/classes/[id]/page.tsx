'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { getClassById } from '@/lib/supabase/queries/classes'
import { getStudentsByClass } from '@/lib/supabase/queries/students'
import { getAssignmentsByClass } from '@/lib/supabase/queries/assignments'
import type { Class, Student, Assignment } from '@/lib/types'
import { formatSchedule, formatDate, getAssignmentTypeLabel, getAssignmentTypeBadgeColor } from '@/lib/utils'
import {
  ArrowLeft,
  Users,
  CalendarCheck,
  ClipboardList,
  BookOpen,
  Clock,
} from 'lucide-react'

export default function ClassOverviewPage() {
  const { id } = useParams<{ id: string }>()
  const [cls, setCls] = useState<Class | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    setIsLoading(true)
    const [classData, studentData, assignmentData] = await Promise.all([
      getClassById(id),
      getStudentsByClass(id),
      getAssignmentsByClass(id),
    ])
    setCls(classData)
    setStudents(studentData)
    setAssignments(assignmentData.slice(0, 5))
    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <AppShell>
        <Header title="Loading..." />
        <div className="page-body flex items-center justify-center py-20">
          <div className="spinner spinner-lg" />
        </div>
      </AppShell>
    )
  }

  if (!cls) {
    return (
      <AppShell>
        <Header title="Class not found" />
        <div className="page-body">
          <div className="empty-state">
            <BookOpen size={40} />
            <p>This class does not exist or you do not have access to it.</p>
            <Link href="/classes" className="btn btn-secondary">
              <ArrowLeft size={14} /> Back to Classes
            </Link>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <Header
        title={cls.name}
        subtitle={cls.curriculum_level?.name || 'Class Overview'}
        actions={
          <Link href="/classes" className="btn btn-ghost btn-sm">
            <ArrowLeft size={14} /> All Classes
          </Link>
        }
      />

      <div className="page-body flex flex-col gap-6">
        {/* Info + Quick Links */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card lg:col-span-2">
            <h2 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
              CLASS INFORMATION
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="label-sm mb-1">Level</div>
                <div className="font-medium">{cls.curriculum_level?.name || 'N/A'}</div>
              </div>
              <div>
                <div className="label-sm mb-1">Subject</div>
                <div className="font-medium">{cls.subject}</div>
              </div>
              <div>
                <div className="label-sm mb-1">Academic Year</div>
                <div className="font-medium">{cls.academic_year || '—'}</div>
              </div>
              <div>
                <div className="label-sm mb-1">Schedule</div>
                <div className="font-medium">{formatSchedule(cls.schedule)}</div>
              </div>
              <div>
                <div className="label-sm mb-1">Students Enrolled</div>
                <div className="stat-value" style={{ fontSize: '1.5rem' }}>
                  {cls.enrollment_count || 0}
                </div>
              </div>
              <div>
                <div className="label-sm mb-1">Status</div>
                <span
                  className="badge"
                  style={{
                    background: cls.is_active ? 'var(--success-light)' : 'var(--bg-subtle)',
                    color: cls.is_active ? 'var(--success)' : 'var(--text-muted)',
                  }}
                >
                  {cls.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href={`/classes/${id}/attendance`}
              className="card flex items-center gap-3 transition-all"
              style={{ cursor: 'pointer', textDecoration: 'none', color: 'var(--text-primary)' }}
            >
              <div
                className="p-2 rounded-md"
                style={{ background: 'var(--accent-light)' }}
              >
                <CalendarCheck size={18} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <div className="font-semibold text-sm">Attendance</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Mark & view sessions
                </div>
              </div>
            </Link>

            <Link
              href={`/classes/${id}/students`}
              className="card flex items-center gap-3 transition-all"
              style={{ cursor: 'pointer', textDecoration: 'none', color: 'var(--text-primary)' }}
            >
              <div className="p-2 rounded-md" style={{ background: 'var(--success-light)' }}>
                <Users size={18} style={{ color: 'var(--success)' }} />
              </div>
              <div>
                <div className="font-semibold text-sm">Students</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Manage enrollments
                </div>
              </div>
            </Link>

            <Link
              href={`/classes/${id}/assignments`}
              className="card flex items-center gap-3 transition-all"
              style={{ cursor: 'pointer', textDecoration: 'none', color: 'var(--text-primary)' }}
            >
              <div className="p-2 rounded-md" style={{ background: 'var(--warning-light)' }}>
                <ClipboardList size={18} style={{ color: 'var(--warning)' }} />
              </div>
              <div>
                <div className="font-semibold text-sm">Assignments</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  View all work
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Students */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Users size={15} style={{ color: 'var(--success)' }} />
              <h2 className="font-semibold text-sm">Enrolled Students ({students.length})</h2>
            </div>
            <Link href={`/classes/${id}/students`} className="btn btn-ghost btn-sm">
              Manage →
            </Link>
          </div>
          {students.length === 0 ? (
            <div className="empty-state py-6">
              <Users size={28} />
              <p className="text-sm">No students enrolled yet.</p>
              <Link href={`/classes/${id}/students`} className="btn btn-secondary btn-sm">
                Add Students
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {students.map((s) => (
                <Link
                  key={s.id}
                  href={`/students/${s.id}`}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: 'var(--accent)', color: 'white' }}
                  >
                    {s.full_name.charAt(0)}
                  </div>
                  {s.full_name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Assignments */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <ClipboardList size={15} style={{ color: 'var(--warning)' }} />
              <h2 className="font-semibold text-sm">Recent Assignments</h2>
            </div>
            <Link href={`/classes/${id}/assignments`} className="btn btn-ghost btn-sm">
              View all →
            </Link>
          </div>
          {assignments.length === 0 ? (
            <div className="empty-state py-6">
              <ClipboardList size={28} />
              <p className="text-sm">No assignments for this class yet.</p>
              <Link href="/assignments/new" className="btn btn-secondary btn-sm">
                Create Assignment
              </Link>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Due Date</th>
                  <th>Submissions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
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
                      <div className="flex items-center gap-1 text-sm">
                        <Clock size={12} style={{ color: 'var(--text-muted)' }} />
                        {a.due_date ? formatDate(a.due_date) : '—'}
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-sm">
                        {a.submission_count ?? 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  )
}
