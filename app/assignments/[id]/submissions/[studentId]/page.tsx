'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { getAssignmentById } from '@/lib/supabase/queries/assignments'
import { getSubmissionByStudentAndAssignment, updateSubmissionMarking } from '@/lib/supabase/queries/submissions'
import { getStudentById } from '@/lib/supabase/queries/students'
import type { Assignment, Submission, Student, AISubmissionCheckResponse } from '@/lib/types'
import { formatDateTime, getGradeFromPercentage, getGradeColor } from '@/lib/utils'
import { ArrowLeft, Zap, CheckCircle, AlertCircle, Save } from 'lucide-react'

export default function SubmissionReviewPage() {
  const { id: assignmentId, studentId } = useParams<{ id: string; studentId: string }>()

  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [student, setStudent] = useState<Student | null>(null)
  const [marks, setMarks] = useState<number | ''>('')
  const [feedback, setFeedback] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [aiResult, setAiResult] = useState<AISubmissionCheckResponse | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    loadData()
  }, [assignmentId, studentId])

  async function loadData() {
    setIsLoading(true)
    const [asgn, sub, std] = await Promise.all([
      getAssignmentById(assignmentId),
      getSubmissionByStudentAndAssignment(studentId, assignmentId),
      getStudentById(studentId),
    ])
    setAssignment(asgn)
    setSubmission(sub)
    setStudent(std)
    if (sub) {
      setMarks(sub.marks_obtained ?? '')
      setFeedback(sub.feedback || '')
    }
    setIsLoading(false)
  }

  async function handleAICheck() {
    if (!assignment || !submission) return
    setIsChecking(true)
    setAiError(null)
    setAiResult(null)

    try {
      const res = await fetch('/api/ai/check-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_content: assignment.instructions,
          student_answer: submission.content || 'No written answer provided',
          total_marks: assignment.total_marks,
          curriculum_level:
            (assignment.curriculum_level as { name: string } | undefined)?.name || 'A-Level',
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'AI check failed')
      }

      const data: AISubmissionCheckResponse = await res.json()
      setAiResult(data)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI check failed. Please try again.')
    } finally {
      setIsChecking(false)
    }
  }

  function acceptAISuggestion() {
    if (!aiResult) return
    setMarks(aiResult.marks_awarded)
    setFeedback(aiResult.detailed_feedback || aiResult.feedback || '')
  }

  async function handleSave(status: 'checked' | 'returned') {
    if (!submission || marks === '') return
    setIsSaving(true)

    try {
      await updateSubmissionMarking(submission.id, {
        marks_obtained: Number(marks),
        feedback,
        ai_checked: aiResult !== null,
        status,
      })
      showToast(`Submission ${status === 'returned' ? 'returned to student' : 'marked as checked'}`)
      await loadData()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save marking', 'error')
    } finally {
      setIsSaving(false)
    }
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

  const pct = marks !== '' && assignment ? Math.round((Number(marks) / assignment.total_marks) * 100) : null

  return (
    <AppShell>
      <Header
        title={`Review: ${student?.full_name || 'Student'}`}
        subtitle={assignment?.title || 'Submission'}
        actions={
          <Link href={`/assignments/${assignmentId}`} className="btn btn-ghost btn-sm">
            <ArrowLeft size={14} /> Back to Assignment
          </Link>
        }
      />

      <div className="page-body">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left: Student Submission */}
          <div className="flex flex-col gap-4">
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="font-semibold">Student Submission</h3>
                  {submission && (
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Submitted {formatDateTime(submission.submitted_at)}
                    </div>
                  )}
                </div>
                <span
                  className="badge"
                  style={{
                    background: submission?.status === 'returned' ? 'var(--success-light)' : submission?.status === 'checked' ? 'var(--accent-light)' : 'var(--warning-light)',
                    color: submission?.status === 'returned' ? 'var(--success)' : submission?.status === 'checked' ? 'var(--accent)' : 'var(--warning)',
                  }}
                >
                  {submission?.status || 'pending'}
                </span>
              </div>

              {/* Assignment Questions */}
              <div className="mb-4">
                <div className="label-sm mb-2">Questions</div>
                <div
                  className="text-sm p-3 rounded-md"
                  style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', lineHeight: 1.7 }}
                  dangerouslySetInnerHTML={{ __html: assignment?.instructions || 'No instructions' }}
                />
              </div>

              {/* Student Answer */}
              <div>
                <div className="label-sm mb-2">Student&apos;s Answer</div>
                {submission?.content ? (
                  <div
                    className="text-sm p-3 rounded-md"
                    style={{
                      background: 'white',
                      border: '1px solid var(--border-strong)',
                      lineHeight: 1.8,
                      whiteSpace: 'pre-wrap',
                      minHeight: '150px',
                    }}
                  >
                    {submission.content}
                  </div>
                ) : submission?.file_url ? (
                  <div className="p-3 rounded-md text-sm" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                    <a href={submission.file_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                      📄 View Uploaded File
                    </a>
                  </div>
                ) : (
                  <div className="empty-state py-6" style={{ background: 'var(--bg-subtle)', borderRadius: '6px' }}>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      No written answer submitted. Mark based on uploaded file or verbal assessment.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Marking Panel */}
          <div className="flex flex-col gap-4">
            {/* AI Check */}
            <div className="ai-panel">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={16} style={{ color: 'var(--accent)' }} />
                <h3 className="font-semibold text-sm" style={{ color: 'var(--accent)' }}>
                  AI Marking Assistant
                </h3>
              </div>

              <button
                className="btn btn-primary w-full mb-3"
                style={{ justifyContent: 'center' }}
                onClick={handleAICheck}
                disabled={isChecking || !submission}
              >
                {isChecking ? (
                  <>
                    <span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} />
                    Analysing submission...
                  </>
                ) : (
                  <>
                    <Zap size={14} /> Check with AI
                  </>
                )}
              </button>

              {aiError && (
                <div
                  className="p-3 rounded-md text-sm mb-3"
                  style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid var(--danger)' }}
                >
                  <AlertCircle size={13} className="inline mr-1" /> {aiError}
                </div>
              )}

              {aiResult && (
                <div className="ai-result-card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={15} style={{ color: 'var(--success)' }} />
                      <span className="font-semibold text-sm">AI Suggestion</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="badge font-mono font-bold"
                        style={{
                          background: getGradeColor(aiResult.grade).includes('success') ? 'var(--success-light)' : 'var(--warning-light)',
                          color: getGradeColor(aiResult.grade).includes('success') ? 'var(--success)' : 'var(--warning)',
                          fontSize: '1rem',
                          padding: '0.2rem 0.6rem',
                        }}
                      >
                        {aiResult.grade}
                      </span>
                      <span className="font-mono font-semibold">
                        {aiResult.marks_awarded}/{aiResult.total_marks}
                      </span>
                      <span className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
                        ({aiResult.percentage}%)
                      </span>
                    </div>
                  </div>

                  <div className="text-sm mb-3" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    {aiResult.detailed_feedback || aiResult.feedback}
                  </div>

                  {aiResult.strengths.length > 0 && (
                    <div className="mb-2">
                      <div className="label-sm mb-1" style={{ color: 'var(--success)' }}>Strengths</div>
                      <ul className="text-sm flex flex-col gap-1">
                        {aiResult.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span style={{ color: 'var(--success)', flexShrink: 0 }}>✓</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiResult.areas_to_improve.length > 0 && (
                    <div className="mb-2">
                      <div className="label-sm mb-1" style={{ color: 'var(--warning)' }}>Areas to Improve</div>
                      <ul className="text-sm flex flex-col gap-1">
                        {aiResult.areas_to_improve.map((s, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span style={{ color: 'var(--warning)', flexShrink: 0 }}>→</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiResult.misconceptions.length > 0 && (
                    <div className="mb-3">
                      <div className="label-sm mb-1" style={{ color: 'var(--danger)' }}>Misconceptions Identified</div>
                      <ul className="text-sm flex flex-col gap-1">
                        {aiResult.misconceptions.map((s, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span style={{ color: 'var(--danger)', flexShrink: 0 }}>!</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button
                    className="btn btn-secondary btn-sm w-full"
                    style={{ justifyContent: 'center' }}
                    onClick={acceptAISuggestion}
                  >
                    Accept AI Suggestion
                  </button>
                </div>
              )}
            </div>

            {/* Manual Marking */}
            <div className="card">
              <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                MARKING
              </h3>

              <div className="form-group mb-3">
                <label className="form-label">
                  Marks Awarded
                  <span className="text-sm font-normal ml-1" style={{ color: 'var(--text-muted)' }}>
                    (out of {assignment?.total_marks})
                  </span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    className="form-input"
                    min={0}
                    max={assignment?.total_marks}
                    value={marks}
                    onChange={(e) => setMarks(e.target.value === '' ? '' : Number(e.target.value))}
                    style={{ maxWidth: '120px' }}
                  />
                  {pct !== null && (
                    <span className="font-mono font-semibold" style={{ color: pct >= 70 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                      {pct}% — {getGradeFromPercentage(pct)}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-group mb-4">
                <label className="form-label">Feedback for Student</label>
                <textarea
                  className="form-input"
                  rows={6}
                  placeholder="Write detailed, constructive feedback..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <button
                  className="btn btn-secondary flex-1"
                  style={{ justifyContent: 'center' }}
                  onClick={() => handleSave('checked')}
                  disabled={isSaving || marks === ''}
                >
                  {isSaving ? <span className="spinner spinner-sm" /> : <Save size={14} />}
                  Mark as Checked
                </button>
                <button
                  className="btn btn-primary flex-1"
                  style={{ justifyContent: 'center', background: 'var(--success)', borderColor: 'var(--success)' }}
                  onClick={() => handleSave('returned')}
                  disabled={isSaving || marks === ''}
                >
                  <CheckCircle size={14} />
                  Return to Student
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast && <div className={`toast ${toast.type}`}>{toast.type === 'success' ? '✓' : '✕'} {toast.msg}</div>}
    </AppShell>
  )
}
