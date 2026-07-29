'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { getClassById } from '@/lib/supabase/queries/classes'
import {
  getStudentsByClass,
  getStudentsNotInClass,
  enrollStudentInClass,
  unenrollStudentFromClass,
} from '@/lib/supabase/queries/students'
import type { Class, Student } from '@/lib/types'
import { ArrowLeft, Plus, UserMinus, Search, UserCheck } from 'lucide-react'

export default function ClassStudentsPage() {
  const { id } = useParams<{ id: string }>()
  const [cls, setCls] = useState<Class | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [availableStudents, setAvailableStudents] = useState<Student[]>([])
  const [searchEnrolled, setSearchEnrolled] = useState('')
  const [searchAvailable, setSearchAvailable] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    const [classData, studentData] = await Promise.all([
      getClassById(id),
      getStudentsByClass(id),
    ])
    setCls(classData)
    setStudents(studentData)
    setIsLoading(false)
  }, [id])

  const loadAvailable = useCallback(async () => {
    const avail = await getStudentsNotInClass(id)
    setAvailableStudents(avail)
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (showAdd) loadAvailable()
  }, [showAdd, loadAvailable])

  async function handleEnroll(student: Student) {
    try {
      await enrollStudentInClass(student.id, id)
      setStudents((prev) => [...prev, student])
      setAvailableStudents((prev) => prev.filter((s) => s.id !== student.id))
      showToast(`${student.full_name} enrolled successfully`)
    } catch {
      showToast('Failed to enroll student', 'error')
    }
  }

  async function handleUnenroll(student: Student) {
    if (!confirm(`Remove ${student.full_name} from this class?`)) return
    try {
      await unenrollStudentFromClass(student.id, id)
      setStudents((prev) => prev.filter((s) => s.id !== student.id))
      showToast(`${student.full_name} removed from class`)
    } catch {
      showToast('Failed to remove student', 'error')
    }
  }

  const filteredEnrolled = students.filter((s) =>
    s.full_name.toLowerCase().includes(searchEnrolled.toLowerCase()) ||
    (s.roll_number && s.roll_number.toLowerCase().includes(searchEnrolled.toLowerCase()))
  )

  const filteredAvailable = availableStudents.filter((s) =>
    s.full_name.toLowerCase().includes(searchAvailable.toLowerCase())
  )

  return (
    <AppShell>
      <Header
        title={`Students — ${cls?.name || ''}`}
        subtitle={`${students.length} enrolled`}
        actions={
          <div className="flex gap-2">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowAdd(!showAdd)}
            >
              <Plus size={14} /> Add Students
            </button>
            <Link href={`/classes/${id}`} className="btn btn-ghost btn-sm">
              <ArrowLeft size={14} /> Back
            </Link>
          </div>
        }
      />

      <div className="page-body flex flex-col gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner spinner-lg" />
          </div>
        ) : (
          <>
            {/* Add Students Panel */}
            {showAdd && (
              <div className="card" style={{ border: '1px solid var(--accent)', background: 'var(--accent-light)' }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Add Students to Class</h3>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>×</button>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Search size={14} style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search students..."
                    value={searchAvailable}
                    onChange={(e) => setSearchAvailable(e.target.value)}
                  />
                </div>
                {filteredAvailable.length === 0 ? (
                  <div className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
                    {availableStudents.length === 0
                      ? 'All active students are already enrolled.'
                      : 'No students match your search.'}
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
                    {filteredAvailable.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-2 rounded-md"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ background: 'var(--accent)', color: 'white' }}
                          >
                            {s.full_name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{s.full_name}</div>
                            {s.roll_number && (
                              <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                                #{s.roll_number}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleEnroll(s)}
                        >
                          <UserCheck size={13} /> Enroll
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-3 pt-2" style={{ borderTop: '1px solid rgba(37,99,235,0.2)' }}>
                  <Link href="/students/new" className="btn btn-ghost btn-sm" style={{ color: 'var(--accent)' }}>
                    <Plus size={13} /> Create new student
                  </Link>
                </div>
              </div>
            )}

            {/* Enrolled Students */}
            <div className="card">
              <div className="card-header">
                <h2 className="font-semibold text-sm">Enrolled Students</h2>
                <div className="flex items-center gap-2">
                  <Search size={14} style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search..."
                    value={searchEnrolled}
                    onChange={(e) => setSearchEnrolled(e.target.value)}
                    style={{ width: '200px', height: '32px', padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              {filteredEnrolled.length === 0 ? (
                <div className="empty-state py-8">
                  <UserCheck size={32} />
                  <p className="text-sm">
                    {students.length === 0 ? 'No students enrolled yet.' : 'No students match your search.'}
                  </p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Roll No.</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEnrolled.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <span className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
                            {s.roll_number || '—'}
                          </span>
                        </td>
                        <td>
                          <Link
                            href={`/students/${s.id}`}
                            className="font-medium hover:underline"
                            style={{ color: 'var(--accent)' }}
                          >
                            {s.full_name}
                          </Link>
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
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleUnenroll(s)}
                            style={{ color: 'var(--danger)' }}
                            title="Remove from class"
                          >
                            <UserMinus size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}
    </AppShell>
  )
}
