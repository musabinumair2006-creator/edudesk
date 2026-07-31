'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import ReportViewer from '@/components/reports/ReportViewer'
import { getReports } from '@/lib/supabase/queries/reports'
import { getStudents } from '@/lib/supabase/queries/students'
import { getClasses } from '@/lib/supabase/queries/classes'
import type { Report, Student, Class } from '@/lib/types'
import { BarChart2, Sparkles, Download, CheckCircle } from 'lucide-react'

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [activeTab, setActiveTab] = useState<'student' | 'class'>('student')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [period, setPeriod] = useState('monthly')

  const [isGenerating, setIsGenerating] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [viewingReport, setViewingReport] = useState<Report | null>(null)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      const [rData, sData, cData] = await Promise.all([
        getReports(),
        getStudents(),
        getClasses(),
      ])
      setReports(rData)
      setStudents(sData)
      setClasses(cData)
      if (sData.length > 0) setSelectedStudentId(sData[0].id)
      if (cData.length > 0) setSelectedClassId(cData[0].id)
      setIsLoading(false)
    }
    loadData()
  }, [])

  async function handleGenerateReport(e: React.FormEvent) {
    e.preventDefault()
    setIsGenerating(true)
    setSuccessMsg(null)

    try {
      const res = await fetch('/api/ai/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_type: activeTab,
          student_id: activeTab === 'student' ? selectedStudentId : null,
          class_id: activeTab === 'class' ? selectedClassId : null,
          period_type: period,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setSuccessMsg('Academic report generated and sent to Pending Suggestions queue for teacher review!')
      }
    } catch {
      setSuccessMsg('Error calling report generator.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <AppShell>
      <Header
        title="Physics Performance Reports"
        subtitle="AI-written academic performance reports for students and Centaurus Academy classes"
      />

      <div className="page-body flex flex-col gap-6">
        {/* Report Generator Card */}
        <div className="card p-6">
          <div className="tabs mb-4">
            <button
              className={`tab ${activeTab === 'student' ? 'active' : ''}`}
              onClick={() => setActiveTab('student')}
            >
              Student Performance Report
            </button>
            <button
              className={`tab ${activeTab === 'class' ? 'active' : ''}`}
              onClick={() => setActiveTab('class')}
            >
              Class-Wide Performance Report
            </button>
          </div>

          {successMsg && (
            <div className="p-3.5 mb-4 rounded bg-success-light text-success border border-success text-xs font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} />
                <span>{successMsg}</span>
              </div>
              <Link href="/suggestions" className="underline font-bold">
                Review in Suggestions Queue
              </Link>
            </div>
          )}

          <form onSubmit={handleGenerateReport} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {activeTab === 'student' ? (
              <div className="form-group">
                <label className="form-label">Select Student</label>
                <select
                  className="form-input form-select"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.roll_number || 'PHY-N/A'})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Select Class</label>
                <select
                  className="form-input form-select"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Report Period</label>
              <select
                className="form-input form-select capitalize"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option value="weekly">Last Week</option>
                <option value="monthly">Last Month</option>
                <option value="midterm">Mid-Term Assessment</option>
                <option value="final">End of Term</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary justify-center py-2.5" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Generate Formal Report
                </>
              )}
            </button>
          </form>
        </div>

        {/* Report List */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-sm">Approved Reports Log</h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <span className="spinner spinner-lg" />
            </div>
          ) : reports.length === 0 ? (
            <div className="empty-state py-12 text-xs">No approved reports generated yet.</div>
          ) : (
            <div className="flex flex-col gap-4 p-4">
              {reports.map((rep) => (
                <div key={rep.id} className="p-4 rounded-lg border border-border bg-bg-surface flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-text-primary capitalize">
                        {rep.report_type} Report — {rep.student?.full_name || rep.class?.name || 'Centaurus Academy'}
                      </div>
                      <div className="text-xs text-text-muted mt-0.5">
                        Generated: {new Date(rep.generated_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="badge bg-accent-light text-accent font-semibold">
                      Rating: {rep.content.overall_rating}
                    </span>
                  </div>

                  <ReportViewer report={rep} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
