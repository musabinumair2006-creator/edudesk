'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import StudentRow from '@/components/students/StudentRow'
import { getClassById } from '@/lib/supabase/queries/classes'
import { getStudentsByClass } from '@/lib/supabase/queries/students'
import type { Class, Student } from '@/lib/types'
import { Users, Plus, ArrowLeft } from 'lucide-react'

export default function ClassStudentsPage() {
  const params = useParams()
  const classId = params?.id as string

  const [cls, setCls] = useState<Class | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      const [cData, sData] = await Promise.all([
        getClassById(classId),
        getStudentsByClass(classId),
      ])
      setCls(cData)
      setStudents(sData)
      setIsLoading(false)
    }
    loadData()
  }, [classId])

  return (
    <AppShell>
      <Header
        title={`Student Roster — ${cls?.name || 'Physics Class'}`}
        subtitle="Manage enrolled physics students and individual performance tracking"
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/classes/${classId}`} className="btn btn-secondary btn-sm">
              <ArrowLeft size={14} /> Back to Class
            </Link>
            <Link href="/students/new" className="btn btn-primary btn-sm">
              <Plus size={14} /> Add Student
            </Link>
          </div>
        }
      />

      <div className="page-body">
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-sm">Active Students ({students.length})</h2>
            <Link href="/upload" className="text-xs text-accent hover:underline">
              Import via LMS File
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <span className="spinner spinner-lg" />
            </div>
          ) : students.length === 0 ? (
            <div className="empty-state py-12 text-xs">
              No students enrolled in this class yet. Upload a student list or add manually.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Roll No.</th>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Attendance %</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <StudentRow key={student.id} student={student} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  )
}
