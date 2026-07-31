'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { getClassById } from '@/lib/supabase/queries/classes'
import { getStudentsByClass } from '@/lib/supabase/queries/students'
import { getAssignments } from '@/lib/supabase/queries/assignments'
import type { Class, Student, Assignment } from '@/lib/types'
import { ArrowLeft, Calendar, Users, FileText, CheckCircle } from 'lucide-react'

export default function ClassDetailPage() {
  const params = useParams()
  const id = params?.id as string

  const [cls, setCls] = useState<Class | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      const [cData, sData, aData] = await Promise.all([
        getClassById(id),
        getStudentsByClass(id),
        getAssignments(),
      ])
      setCls(cData)
      setStudents(sData)
      setAssignments(aData.filter((a) => a.class_id === id || a.class_id === 'cls-1'))
      setIsLoading(false)
    }
    loadData()
  }, [id])

  if (isLoading) {
    return (
      <AppShell>
        <Header title="Class Details" />
        <div className="flex justify-center py-20">
          <span className="spinner spinner-lg" />
        </div>
      </AppShell>
    )
  }

  if (!cls) {
    return (
      <AppShell>
        <Header title="Class Not Found" />
        <div className="page-body text-center py-16 text-text-muted">
          <p>Class not found.</p>
          <Link href="/classes" className="btn btn-primary btn-sm mt-4">
            Back to Classes
          </Link>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <Header
        title={cls.name}
        subtitle={`${cls.curriculum_level?.name || 'Physics'} · ${cls.academic_year || '2025-2026'}`}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/classes" className="btn btn-ghost btn-sm">
              <ArrowLeft size={14} /> All Classes
            </Link>
            <Link href={`/classes/${id}/attendance`} className="btn btn-primary btn-sm">
              <Calendar size={14} /> Mark Attendance
            </Link>
          </div>
        }
      />

      <div className="page-body flex flex-col gap-6">
        {/* Class Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat-card">
            <span className="label-sm">Enrolled Students</span>
            <div className="stat-value">{students.length}</div>
            <Link href={`/classes/${id}/students`} className="text-xs text-accent hover:underline mt-1">
              View Student Roster →
            </Link>
          </div>

          <div className="stat-card">
            <span className="label-sm">Active Assignments</span>
            <div className="stat-value">{assignments.length}</div>
            <div className="text-xs text-text-muted mt-1">Coursework & Quizzes</div>
          </div>

          <div className="stat-card">
            <span className="label-sm">Average Class Attendance</span>
            <div className="stat-value text-success">86%</div>
            <Link href={`/classes/${id}/attendance`} className="text-xs text-accent hover:underline mt-1">
              Open Attendance Sheet →
            </Link>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="card p-0 overflow-hidden">
          <div className="tabs px-4 pt-2">
            <Link href={`/classes/${id}`} className="tab active">
              Overview
            </Link>
            <Link href={`/classes/${id}/students`} className="tab">
              Students ({students.length})
            </Link>
            <Link href={`/classes/${id}/attendance`} className="tab">
              Attendance Sheet
            </Link>
          </div>

          <div className="p-4 flex flex-col gap-4">
            <h3 className="font-bold text-sm text-text-primary">Recent Class Assignments</h3>
            {assignments.length === 0 ? (
              <p className="text-xs text-text-muted">No assignments for this class yet.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Total Marks</th>
                    <th>Submissions</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => (
                    <tr key={a.id}>
                      <td className="font-medium text-accent">{a.title}</td>
                      <td className="capitalize text-xs">{a.assignment_type}</td>
                      <td className="font-mono text-xs">{a.total_marks}</td>
                      <td className="font-mono text-xs">{a.submission_count || 0}</td>
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
        </div>
      </div>
    </AppShell>
  )
}
