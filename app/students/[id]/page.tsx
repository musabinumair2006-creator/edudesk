'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import PerformanceChart from '@/components/students/PerformanceChart'
import { getStudentById } from '@/lib/supabase/queries/students'
import { getStudentAttendanceSummary } from '@/lib/supabase/queries/attendance'
import type { Student, AttendanceSummary } from '@/lib/types'
import { getAttendancePercentageBg } from '@/lib/utils'
import { ArrowLeft, User, Sparkles, CheckCircle, AlertTriangle, FileText } from 'lucide-react'

export default function StudentProfilePage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()

  const [student, setStudent] = useState<Student | null>(null)
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [reportMsg, setReportMsg] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      const [sData, attData] = await Promise.all([
        getStudentById(id),
        getStudentAttendanceSummary(id),
      ])
      setStudent(sData)
      setAttendance(attData)
      setIsLoading(false)
    }
    loadData()
  }, [id])

  async function handleGenerateReport() {
    if (!student) return
    setIsGeneratingReport(true)
    setReportMsg(null)

    try {
      const res = await fetch('/api/ai/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: student.id,
          report_type: 'student',
        }),
      })

      const data = await res.json()
      if (data.success) {
        setReportMsg('AI Performance Report generated and added to your suggestions queue!')
      } else {
        setReportMsg('Failed to generate report. Please try again.')
      }
    } catch {
      setReportMsg('Error connecting to AI service.')
    } finally {
      setIsGeneratingReport(false)
    }
  }

  if (isLoading) {
    return (
      <AppShell>
        <Header title="Student Profile" />
        <div className="flex justify-center py-20">
          <span className="spinner spinner-lg" />
        </div>
      </AppShell>
    )
  }

  if (!student) {
    return (
      <AppShell>
        <Header title="Student Not Found" />
        <div className="page-body text-center py-16 text-text-muted">
          <p>Student record not found.</p>
          <Link href="/students" className="btn btn-primary btn-sm mt-4">
            Return to Directory
          </Link>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <Header
        title={student.full_name}
        subtitle={`Roll No: ${student.roll_number || 'PHY-N/A'} • Class: ${student.class?.name || 'Physics Section'}`}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/students" className="btn btn-secondary btn-sm">
              <ArrowLeft size={14} /> Directory
            </Link>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleGenerateReport}
              disabled={isGeneratingReport}
            >
              <Sparkles size={14} />
              {isGeneratingReport ? 'Generating...' : 'Generate AI Report'}
            </button>
          </div>
        }
      />

      <div className="page-body flex flex-col gap-6">
        {reportMsg && (
          <div className="p-3.5 rounded-lg bg-accent-light border border-accent text-accent text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} />
              <span>{reportMsg}</span>
            </div>
            <Link href="/suggestions" className="underline font-bold">
              View Suggestions Queue
            </Link>
          </div>
        )}

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <span className="label-sm">Attendance Percentage</span>
            <div className="stat-value text-success font-mono">
              {attendance?.percentage || 80}%
            </div>
            <div className="text-xs text-text-muted">
              {attendance?.present || 8} / {attendance?.total || 10} sessions attended
            </div>
          </div>

          <div className="stat-card">
            <span className="label-sm">Assignments Submitted</span>
            <div className="stat-value font-mono">4 / 5</div>
            <div className="text-xs text-text-muted">80% submission rate</div>
          </div>

          <div className="stat-card">
            <span className="label-sm">Average Assessment Score</span>
            <div className="stat-value text-accent font-mono">84.5%</div>
            <div className="text-xs text-text-muted font-mono">Grade: A</div>
          </div>

          <div className="stat-card">
            <span className="label-sm">AI Flags Count</span>
            <div className="stat-value text-amber-600 font-mono">1</div>
            <div className="text-xs text-text-muted">Attention recommended</div>
          </div>
        </div>

        {/* Performance Trend Chart */}
        <div className="card flex flex-col gap-3">
          <h3 className="font-bold text-sm text-text-primary">Academic Performance Trend</h3>
          <p className="text-xs text-text-secondary">
            Score percentages across physics quizzes, midterms, and assignments.
          </p>
          <PerformanceChart />
        </div>
      </div>
    </AppShell>
  )
}
