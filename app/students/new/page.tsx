'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { createStudent } from '@/lib/supabase/queries/students'
import { ArrowLeft, CheckCircle } from 'lucide-react'

export default function NewStudentPage() {
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [rollNumber, setRollNumber] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [dob, setDob] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const student = await createStudent({
        full_name: fullName.trim(),
        roll_number: rollNumber.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        parent_phone: parentPhone.trim() || undefined,
        date_of_birth: dob || undefined,
      })
      setSuccess(true)
      setTimeout(() => router.push(`/students/${student.id}`), 800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create student')
      setIsLoading(false)
    }
  }

  return (
    <AppShell>
      <Header
        title="Add Student"
        subtitle="Register a new student"
        actions={
          <Link href="/students" className="btn btn-ghost btn-sm">
            <ArrowLeft size={14} /> Back to Students
          </Link>
        }
      />

      <div className="page-body" style={{ maxWidth: '600px' }}>
        {success ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <CheckCircle size={48} style={{ color: 'var(--success)' }} />
            <div className="text-lg font-semibold">Student added!</div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Redirecting to student profile...
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="card">
              <h2
                className="font-semibold text-sm mb-4 pb-3"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                Student Information
              </h2>

              <div className="flex flex-col gap-4">
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Ahmed Khan"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Roll Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 001"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="student@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Student Phone</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+92 300 0000000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Parent / Guardian Phone</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+92 300 0000000"
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
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
                <Link href="/students" className="btn btn-secondary">
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  style={{ justifyContent: 'center' }}
                  disabled={isLoading || !fullName.trim()}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} />
                      Adding...
                    </>
                  ) : (
                    'Add Student'
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
