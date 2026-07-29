'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { getClasses } from '@/lib/supabase/queries/classes'
import { getStudents } from '@/lib/supabase/queries/students'
import { getReports } from '@/lib/supabase/queries/reports'
import type { Class, Student, Report } from '@/lib/types'
import { formatDate, formatTimeAgo } from '@/lib/utils'
import { BarChart2, Wand2, ChevronDown, FileText } from 'lucide-react'

export default function ReportsPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [expandedReport, setExpandedReport] = useState<string | null>(null)

  // Report generation form
  const [reportType, setReportType] = useState<'weekly' | 'monthly' | 'term'>('monthly')
  const [targetType, setTargetType] = useState<'student' | 'class'>('student')
  const [studentId, setStudentId] = useState('')
  const [classId, setClassId] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')

  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    loadData()
    // Set default period (last 30 days)
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 30)
    setPeriodEnd(end.toISOString().split('T')[0])
    setPeriodStart(start.toISOString().split('T')[0])
  }, [])

  async function loadData() {
    setIsLoading(true)
    const [classData, studentData, reportData] = await Promise.all([
      getClasses(),
      getStudents(),
      getReports(),
    ])
    setClasses(classData)
    setStudents(studentData)
    setReports((reportData || []) as Report[])
    if (classData.length > 0) setClassId(classData[0].id)
    if (studentData.length > 0) setStudentId(studentData[0].id)
    setIsLoading(false)
  }

  async function handleGenerate() {
    setIsGenerating(true)
    setGenerateError(null)

    try {
      const payload = {
        report_type: reportType,
        student_id: targetType === 'student' ? studentId : undefined,
        class_id: targetType === 'class' ? classId : undefined,
        period_start: periodStart,
        period_end: periodEnd,
      }

      const res = await fetch('/api/ai/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Report generation failed')
      }

      setToast('Report generated successfully!')
      setTimeout(() => setToast(null), 3000)
      await loadData()
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Failed to generate report')
    } finally {
      setIsGenerating(false)
    }
  }

  const PERIOD_PRESETS = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 3 months', days: 90 },
  ]

  function applyPreset(days: number) {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - days)
    setPeriodEnd(end.toISOString().split('T')[0])
    setPeriodStart(start.toISOString().split('T')[0])
  }

  function getRatingColor(rating: string) {
    switch (rating?.toLowerCase()) {
      case 'excellent': return 'var(--success)'
      case 'good': return '#16A34A'
      case 'satisfactory': return 'var(--warning)'
      case 'needs improvement': return 'var(--danger)'
      default: return 'var(--text-secondary)'
    }
  }

  return (
    <AppShell>
      <Header
        title="Reports"
        subtitle="AI-generated performance reports"
      />

      <div className="page-body flex flex-col gap-6">
        {/* Generation Panel */}
        <div
          className="card"
          style={{ border: '1px solid rgba(37,99,235,0.3)', background: 'var(--accent-light)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Wand2 size={16} style={{ color: 'var(--accent)' }} />
            <h3 className="font-semibold text-sm" style={{ color: 'var(--accent)' }}>
              Generate AI Report
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Report Type */}
            <div className="form-group">
              <label className="form-label">Report Period</label>
              <div className="flex gap-1.5">
                {(['weekly', 'monthly', 'term'] as const).map((t) => (
                  <button
                    key={t}
                    className="btn btn-sm flex-1"
                    style={{
                      justifyContent: 'center',
                      background: reportType === t ? 'var(--accent)' : 'white',
                      color: reportType === t ? 'white' : 'var(--text-secondary)',
                      border: reportType === t ? '1px solid var(--accent)' : '1px solid var(--border-strong)',
                      fontSize: '12px',
                    }}
                    onClick={() => setReportType(t)}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Target */}
            <div className="form-group">
              <label className="form-label">Report For</label>
              <div className="flex gap-1.5 mb-2">
                {(['student', 'class'] as const).map((t) => (
                  <button
                    key={t}
                    className="btn btn-sm flex-1"
                    style={{
                      justifyContent: 'center',
                      background: targetType === t ? 'var(--accent)' : 'white',
                      color: targetType === t ? 'white' : 'var(--text-secondary)',
                      border: targetType === t ? '1px solid var(--accent)' : '1px solid var(--border-strong)',
                      fontSize: '12px',
                    }}
                    onClick={() => setTargetType(t)}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              {targetType === 'student' ? (
                <select
                  className="form-input form-select"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
              ) : (
                <select
                  className="form-input form-select"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Date Range */}
            <div className="form-group">
              <label className="form-label">Date Range</label>
              <div className="flex gap-1.5 mb-2">
                {PERIOD_PRESETS.map((p) => (
                  <button
                    key={p.days}
                    className="btn btn-sm"
                    style={{ fontSize: '11px', background: 'white', border: '1px solid var(--border-strong)' }}
                    onClick={() => applyPreset(p.days)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5">
                <input type="date" className="form-input" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
                <span className="self-center text-muted text-sm">to</span>
                <input type="date" className="form-input" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
              </div>
            </div>

            {/* Generate Button */}
            <div className="form-group flex flex-col justify-end">
              <button
                className="btn btn-primary btn-lg w-full"
                style={{ justifyContent: 'center', marginTop: 'auto' }}
                onClick={handleGenerate}
                disabled={isGenerating || !periodStart || !periodEnd}
              >
                {isGenerating ? (
                  <>
                    <span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 size={15} /> Generate Report
                  </>
                )}
              </button>
            </div>
          </div>

          {generateError && (
            <div
              className="mt-3 p-3 rounded-md text-sm"
              style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid var(--danger)' }}
            >
              {generateError}
            </div>
          )}
        </div>

        {/* Reports List */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <BarChart2 size={15} style={{ color: 'var(--accent)' }} />
              <h2 className="font-semibold text-sm">Generated Reports</h2>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="spinner spinner-lg" />
            </div>
          ) : reports.length === 0 ? (
            <div className="empty-state py-10">
              <FileText size={36} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                No reports generated yet. Generate your first report above.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {reports.map((report) => {
                const isExpanded = expandedReport === report.id
                const rating = report.content?.performance_rating

                return (
                  <div
                    key={report.id}
                    className="rounded-md"
                    style={{ border: '1px solid var(--border)', overflow: 'hidden' }}
                  >
                    {/* Report Header */}
                    <div
                      className="flex items-center gap-3 p-3 cursor-pointer"
                      style={{ background: 'var(--bg-subtle)' }}
                      onClick={() => setExpandedReport(isExpanded ? null : report.id)}
                    >
                      <FileText size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            {report.student?.full_name || report.class?.name || 'Report'}
                          </span>
                          <span
                            className="badge"
                            style={{ background: 'var(--accent-light)', color: 'var(--accent)', fontSize: '11px' }}
                          >
                            {report.report_type}
                          </span>
                          {rating && (
                            <span
                              className="badge"
                              style={{
                                background: getRatingColor(rating) + '20',
                                color: getRatingColor(rating),
                                fontSize: '11px',
                              }}
                            >
                              {rating}
                            </span>
                          )}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {report.period_start ? formatDate(report.period_start) : '—'} → {report.period_end ? formatDate(report.period_end) : '—'} · Generated {formatTimeAgo(report.generated_at)}
                        </div>
                      </div>
                      <ChevronDown
                        size={16}
                        style={{
                          color: 'var(--text-muted)',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                          transition: 'transform 0.2s',
                          flexShrink: 0,
                        }}
                      />
                    </div>

                    {/* Expanded Report Content */}
                    {isExpanded && report.content && (
                      <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
                        {report.content.summary && (
                          <div className="mb-4">
                            <div className="label-sm mb-2">Summary</div>
                            <p className="text-sm" style={{ lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                              {report.content.summary}
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {report.content.highlights?.length > 0 && (
                            <div>
                              <div className="label-sm mb-2" style={{ color: 'var(--success)' }}>Highlights</div>
                              <ul className="flex flex-col gap-1">
                                {report.content.highlights.map((h, i) => (
                                  <li key={i} className="flex items-start gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    <span style={{ color: 'var(--success)', flexShrink: 0 }}>✓</span> {h}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {report.content.concerns?.length > 0 && (
                            <div>
                              <div className="label-sm mb-2" style={{ color: 'var(--danger)' }}>Concerns</div>
                              <ul className="flex flex-col gap-1">
                                {report.content.concerns.map((c, i) => (
                                  <li key={i} className="flex items-start gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    <span style={{ color: 'var(--danger)', flexShrink: 0 }}>!</span> {c}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {report.content.recommendations?.length > 0 && (
                            <div>
                              <div className="label-sm mb-2" style={{ color: 'var(--accent)' }}>Recommendations</div>
                              <ul className="flex flex-col gap-1">
                                {report.content.recommendations.map((r, i) => (
                                  <li key={i} className="flex items-start gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    <span style={{ color: 'var(--accent)', flexShrink: 0 }}>→</span> {r}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {report.content.next_steps?.length > 0 && (
                            <div>
                              <div className="label-sm mb-2" style={{ color: 'var(--warning)' }}>Next Steps</div>
                              <ul className="flex flex-col gap-1">
                                {report.content.next_steps.map((n, i) => (
                                  <li key={i} className="flex items-start gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    <span style={{ color: 'var(--warning)', flexShrink: 0 }}>◈</span> {n}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {toast && <div className="toast success">✓ {toast}</div>}
    </AppShell>
  )
}
