'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { useApp } from '@/context/AppContext'
import { createClass } from '@/lib/supabase/queries/classes'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function NewClassPage() {
  const router = useRouter()
  const { curriculumLevels } = useApp()

  const [name, setName] = useState('')
  const [curriculumLevelId, setCurriculumLevelId] = useState('')
  const [academicYear, setAcademicYear] = useState('2025-2026')
  const [subject, setSubject] = useState('Physics')
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [time, setTime] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (curriculumLevels.length > 0 && !curriculumLevelId) {
      setCurriculumLevelId(curriculumLevels[0].id)
    }
  }, [curriculumLevels])

  function toggleDay(day: string) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const newClass = await createClass({
        name: name.trim(),
        curriculum_level_id: curriculumLevelId,
        academic_year: academicYear,
        subject,
        schedule: { days: selectedDays, time },
      })
      setSuccess(true)
      setTimeout(() => router.push(`/classes/${newClass.id}`), 800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create class')
      setIsLoading(false)
    }
  }

  return (
    <AppShell>
      <Header
        title="New Class"
        subtitle="Create a new teaching class"
        actions={
          <Link href="/classes" className="btn btn-ghost btn-sm">
            <ArrowLeft size={14} /> Back to Classes
          </Link>
        }
      />

      <div className="page-body" style={{ maxWidth: '600px' }}>
        {success ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <CheckCircle size={48} style={{ color: 'var(--success)' }} />
            <div className="text-lg font-semibold">Class created!</div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Redirecting to class overview...
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="card">
              <h2
                className="font-semibold text-sm mb-4 pb-3"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                Class Details
              </h2>

              <div className="flex flex-col gap-4">
                <div className="form-group">
                  <label className="form-label">Class Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. IGCSE Batch 2025 Morning"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Curriculum Level *</label>
                    <select
                      className="form-input form-select"
                      value={curriculumLevelId}
                      onChange={(e) => setCurriculumLevelId(e.target.value)}
                      required
                    >
                      {curriculumLevels.map((lvl) => (
                        <option key={lvl.id} value={lvl.id}>
                          {lvl.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Academic Year</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="2025-2026"
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input
                    type="text"
                    className="form-input"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Physics"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Schedule — Days</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className="btn btn-sm"
                        style={{
                          background: selectedDays.includes(day)
                            ? 'var(--accent)'
                            : 'var(--bg-subtle)',
                          color: selectedDays.includes(day) ? 'white' : 'var(--text-secondary)',
                          border: selectedDays.includes(day)
                            ? '1px solid var(--accent)'
                            : '1px solid var(--border-strong)',
                          width: '50px',
                          justifyContent: 'center',
                          fontWeight: 500,
                        }}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Session Time</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 10:00 AM or 2:30 PM"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    style={{ maxWidth: '200px' }}
                  />
                </div>
              </div>

              {error && (
                <div
                  className="mt-4 p-3 rounded-md text-sm"
                  style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid var(--danger)' }}
                >
                  {error}
                </div>
              )}

              <div className="flex gap-3 mt-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <Link href="/classes" className="btn btn-secondary">
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  style={{ justifyContent: 'center' }}
                  disabled={isLoading || !name.trim() || !curriculumLevelId}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} />
                      Creating...
                    </>
                  ) : (
                    'Create Class'
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  )
}
