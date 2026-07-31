'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import StudentRow from '@/components/students/StudentRow'
import { getStudents } from '@/lib/supabase/queries/students'
import type { Student } from '@/lib/types'
import { Users, Plus, Search } from 'lucide-react'

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getStudents().then((data) => {
      setStudents(data)
      setIsLoading(false)
    })
  }, [])

  const filtered = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (s.roll_number && s.roll_number.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <AppShell>
      <Header
        title="Student Directory"
        subtitle="View and manage all Physics students across Centaurus Academy sections"
        actions={
          <Link href="/students/new" className="btn btn-primary btn-sm">
            <Plus size={14} /> Add Student
          </Link>
        }
      />

      <div className="page-body flex flex-col gap-4">
        {/* Search Bar */}
        <div className="card p-3">
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3 top-3 text-text-muted" />
            <input
              type="text"
              className="form-input pl-9 text-xs"
              placeholder="Search by student name or roll number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="card">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <span className="spinner spinner-lg" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state py-12 text-xs">No students match your search.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Roll No.</th>
                  <th>Student Name</th>
                  <th>Class</th>
                  <th>Attendance %</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <StudentRow key={s.id} student={s} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  )
}
