'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { getStudents } from '@/lib/supabase/queries/students'
import type { Student } from '@/lib/types'
import { Plus, Search, UserCheck } from 'lucide-react'

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStudents()
  }, [])

  async function loadStudents() {
    setIsLoading(true)
    try {
      const data = await getStudents()
      setStudents(data)
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (s.roll_number && s.roll_number.toLowerCase().includes(search.toLowerCase())) ||
      (s.email && s.email.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <AppShell>
      <Header
        title="Students"
        subtitle={`${students.length} total student${students.length !== 1 ? 's' : ''}`}
        actions={
          <Link href="/students/new" className="btn btn-primary btn-sm">
            <Plus size={14} /> Add Student
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
            {/* Search */}
            <div
              className="flex items-center gap-2 mb-4 pb-4"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <Search size={15} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search by name, roll number, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ maxWidth: '400px' }}
              />
              <span
                className="text-sm ml-auto font-mono"
                style={{ color: 'var(--text-muted)' }}
              >
                {filtered.length} of {students.length}
              </span>
            </div>

            {filtered.length === 0 ? (
              <div className="empty-state py-10">
                <UserCheck size={36} />
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {students.length === 0 ? 'No students added yet' : 'No students match your search'}
                  </p>
                  {students.length === 0 && (
                    <p className="text-xs mt-1">Add your first student to get started.</p>
                  )}
                </div>
                {students.length === 0 && (
                  <Link href="/students/new" className="btn btn-primary">
                    <Plus size={14} /> Add Student
                  </Link>
                )}
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Roll No.</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <span className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
                          {s.roll_number || '—'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                          >
                            {s.full_name.charAt(0).toUpperCase()}
                          </div>
                          <Link
                            href={`/students/${s.id}`}
                            className="font-medium hover:underline"
                            style={{ color: 'var(--accent)' }}
                          >
                            {s.full_name}
                          </Link>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {s.email || '—'}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {s.phone || '—'}
                        </span>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: s.is_active ? 'var(--success-light)' : 'var(--bg-subtle)',
                            color: s.is_active ? 'var(--success)' : 'var(--text-muted)',
                          }}
                        >
                          {s.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/students/${s.id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          Profile
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
