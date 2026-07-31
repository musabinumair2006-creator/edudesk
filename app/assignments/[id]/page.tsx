'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { getAssignmentById } from '@/lib/supabase/queries/assignments'
import { getSubmissionsByAssignment, updateSubmissionGrade } from '@/lib/supabase/queries/submissions'
import type { Assignment, Submission } from '@/lib/types'
import { ArrowLeft, FileText, CheckCircle, Clock, Sparkles } from 'lucide-react'

export default function AssignmentDetailPage() {
  const params = useParams()
  const id = params?.id as string

  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [gradingModalSub, setGradingModalSub] = useState<Submission | null>(null)
  const [marksInput, setMarksInput] = useState<number>(0)
  const [feedbackInput, setFeedbackInput] = useState<string>('')
  const [isSavingGrade, setIsSavingGrade] = useState(false)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      const [aData, sData] = await Promise.all([
        getAssignmentById(id),
        getSubmissionsByAssignment(id),
      ])
      setAssignment(aData)
      setSubmissions(sData)
      setIsLoading(false)
    }
    loadData()
  }, [id])

  function openGradeModal(sub: Submission) {
    setGradingModalSub(sub)
    setMarksInput(sub.marks_obtained || sub.ai_suggested_marks || 0)
    setFeedbackInput(sub.feedback || sub.ai_feedback || '')
  }

  async function handleSaveGrade() {
    if (!gradingModalSub) return
    setIsSavingGrade(true)
    await updateSubmissionGrade(gradingModalSub.id, marksInput, feedbackInput)
    setIsSavingGrade(false)
    setGradingModalSub(null)

    // refresh submissions
    const sData = await getSubmissionsByAssignment(id)
    setSubmissions(sData)
  }

  if (isLoading) {
    return (
      <AppShell>
        <Header title="Assignment View" />
        <div className="flex justify-center py-20">
          <span className="spinner spinner-lg" />
        </div>
      </AppShell>
    )
  }

  if (!assignment) {
    return (
      <AppShell>
        <Header title="Assignment Not Found" />
        <div className="page-body text-center py-16 text-text-muted">
          <p>Assignment not found.</p>
          <Link href="/assignments" className="btn btn-primary btn-sm mt-4">
            Back to Assignments
          </Link>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <Header
        title={assignment.title}
        subtitle={`${assignment.topic || 'Physics'} • ${assignment.total_marks} Total Marks`}
        actions={
          <Link href="/assignments" className="btn btn-secondary btn-sm">
            <ArrowLeft size={14} /> Back to Assignments
          </Link>
        }
      />

      <div className="page-body flex flex-col gap-6">
        {/* Assignment Info Card */}
        <div className="card p-6 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <span className="badge bg-accent-light text-accent capitalize">
              {assignment.assignment_type}
            </span>
            <span className="text-xs text-text-muted">
              Class: {assignment.class?.name || 'Grade 12 Physics'}
            </span>
          </div>

          <div className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
            {assignment.content}
          </div>

          {assignment.answer_key && (
            <div className="p-3.5 rounded bg-bg-subtle border border-border text-xs mt-2">
              <strong className="text-text-primary block mb-1">Answer Key:</strong>
              <div className="text-text-secondary font-mono whitespace-pre-wrap">{assignment.answer_key}</div>
            </div>
          )}
        </div>

        {/* Submissions Section */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-sm">Student Submissions ({submissions.length})</h2>
          </div>

          {submissions.length === 0 ? (
            <div className="empty-state py-12 text-xs">No submissions recorded for this assignment yet.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Submitted Marks</th>
                  <th>AI Suggested</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr key={sub.id}>
                    <td className="font-medium">{sub.student?.full_name || 'Student'}</td>
                    <td className="font-mono text-xs">{sub.marks_obtained !== null ? `${sub.marks_obtained}/${assignment.total_marks}` : '—'}</td>
                    <td className="font-mono text-xs text-accent">{sub.ai_suggested_marks !== null ? `${sub.ai_suggested_marks}/${assignment.total_marks}` : '—'}</td>
                    <td>
                      <span className={`badge ${sub.status === 'teacher_reviewed' ? 'bg-success-light text-success' : 'bg-warning-light text-warning'}`}>
                        {sub.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => openGradeModal(sub)}>
                        Review & Mark
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Grading Modal */}
      {gradingModalSub && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="font-bold text-sm">Grade Submission: {gradingModalSub.student?.full_name}</h3>
              <button className="text-text-muted hover:text-text-primary" onClick={() => setGradingModalSub(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body flex flex-col gap-4">
              <div className="p-3 rounded bg-bg-subtle text-xs whitespace-pre-wrap font-mono">
                {gradingModalSub.content || 'No text content submitted.'}
              </div>

              <div className="form-group">
                <label className="form-label">Marks Awarded (Out of {assignment.total_marks})</label>
                <input
                  type="number"
                  className="form-input font-mono"
                  value={marksInput}
                  onChange={(e) => setMarksInput(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Feedback for Student</label>
                <textarea
                  className="form-input"
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Provide constructive feedback..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setGradingModalSub(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveGrade} disabled={isSavingGrade}>
                {isSavingGrade ? 'Saving...' : 'Save Grade & Return'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
