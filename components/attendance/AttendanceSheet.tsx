'use client'

import { useEffect, useState, useCallback } from 'react'
import { getStudentsByClass } from '@/lib/supabase/queries/students'
import { getAttendanceForSession, upsertAttendance, getSessionDatesForClass, getAttendanceSummaryForClass } from '@/lib/supabase/queries/attendance'
import AttendanceSummaryChart from './AttendanceSummaryChart'
import type { Student, AttendanceStatus } from '@/lib/types'
import { formatDate, formatDateForInput, getAttendancePercentageBg } from '@/lib/utils'
import { Save, CheckSquare, Calendar, BarChart2, Info } from 'lucide-react'

interface AttendanceRecord {
  student_id: string
  status: AttendanceStatus
  note: string
}

const STATUS_KEYS: Record<string, AttendanceStatus> = {
  p: 'present',
  a: 'absent',
  l: 'late',
  e: 'excused',
}

interface Props {
  classId: string
}

export default function AttendanceSheet({ classId }: Props) {
  const today = formatDateForInput(new Date())

  const [students, setStudents] = useState<Student[]>([])
  const [date, setDate] = useState(today)
  const [sessionLabel, setSessionLabel] = useState('')
  const [records, setRecords] = useState<Record<string, AttendanceRecord>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'mark' | 'history' | 'report'>('mark')
  const [sessionDates, setSessionDates] = useState<string[]>([])
  const [summaryData, setSummaryData] = useState<
    Array<{ student_id: string; name: string; summary: { total: number; present: number; absent: number; late: number; excused: number; percentage: number } }>
  >([])
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const loadStudents = useCallback(async () => {
    setIsLoading(true)
    const data = await getStudentsByClass(classId)
    setStudents(data)
    const initialRecords: Record<string, AttendanceRecord> = {}
    data.forEach((s) => {
      initialRecords[s.id] = { student_id: s.id, status: 'present', note: '' }
    })
    setRecords(initialRecords)
    setIsLoading(false)
  }, [classId])

  const loadSessionAttendance = useCallback(async (d: string) => {
    const existingData = await getAttendanceForSession(classId, d)
    if (existingData.length > 0) {
      const loaded: Record<string, AttendanceRecord> = {}
      existingData.forEach((r) => {
        loaded[r.student_id] = { student_id: r.student_id, status: r.status, note: r.note || '' }
      })
      // Fill in any students not in the session with default
      students.forEach((s) => {
        if (!loaded[s.id]) {
          loaded[s.id] = { student_id: s.id, status: 'present', note: '' }
        }
      })
      setRecords(loaded)
    }
  }, [classId, students])

  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  useEffect(() => {
    if (students.length > 0) {
      loadSessionAttendance(date)
    }
  }, [date, students.length]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab === 'history') {
      getSessionDatesForClass(classId).then(setSessionDates)
    }
    if (activeTab === 'report') {
      loadSummary()
    }
  }, [activeTab, classId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadSummary() {
    const summaries = await getAttendanceSummaryForClass(classId)
    const withNames = summaries.map((s) => ({
      ...s,
      name: students.find((st) => st.id === s.student_id)?.full_name || 'Unknown',
    }))
    setSummaryData(withNames)
  }

  function setStatus(studentId: string, status: AttendanceStatus) {
    setRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }))
  }

  function setNote(studentId: string, note: string) {
    setRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], note },
    }))
  }

  function markAllPresent() {
    const updated: Record<string, AttendanceRecord> = {}
    students.forEach((s) => {
      updated[s.id] = { student_id: s.id, status: 'present', note: records[s.id]?.note || '' }
    })
    setRecords(updated)
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      const rows = students.map((s) => ({
        class_id: classId,
        student_id: s.id,
        session_date: date,
        session_label: sessionLabel || undefined,
        status: records[s.id]?.status || 'present',
        note: records[s.id]?.note || undefined,
      }))
      await upsertAttendance(rows)
      showToast(`Attendance saved for ${formatDate(date)} — ${students.length} students marked`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save attendance', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // Keyboard shortcut handler
  useEffect(() => {
    let focusedStudentIdx = -1

    function onKeydown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      // Only activate when focused on a row (not an input)
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      if (!['p', 'a', 'l', 'e'].includes(e.key.toLowerCase())) return
      const student = students[focusedStudentIdx]
      if (!student) return
      setStatus(student.id, STATUS_KEYS[e.key.toLowerCase()])
    }

    document.addEventListener('keydown', onKeydown)
    return () => document.removeEventListener('keydown', onKeydown)
  }, [students])

  const counts = {
    present: Object.values(records).filter((r) => r.status === 'present').length,
    absent: Object.values(records).filter((r) => r.status === 'absent').length,
    late: Object.values(records).filter((r) => r.status === 'late').length,
    excused: Object.values(records).filter((r) => r.status === 'excused').length,
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="spinner spinner-lg" />
      </div>
    )
  }

  return (
    <div>
      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'mark' ? 'active' : ''}`} onClick={() => setActiveTab('mark')}>
          <span className="flex items-center gap-1.5"><CheckSquare size={13} /> Mark Attendance</span>
        </button>
        <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <span className="flex items-center gap-1.5"><Calendar size={13} /> Session History</span>
        </button>
        <button className={`tab ${activeTab === 'report' ? 'active' : ''}`} onClick={() => setActiveTab('report')}>
          <span className="flex items-center gap-1.5"><BarChart2 size={13} /> Attendance Report</span>
        </button>
      </div>

      {/* Mark Attendance Tab */}
      {activeTab === 'mark' && (
        <div>
          {/* Controls */}
          <div className="card mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="form-group">
                <label className="form-label">Session Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={today}
                />
              </div>
              <div className="form-group md:col-span-2">
                <label className="form-label">Session Label (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Morning Session, Chapter 12 Review"
                  value={sessionLabel}
                  onChange={(e) => setSessionLabel(e.target.value)}
                />
              </div>
            </div>

            {/* Summary Counts */}
            <div className="flex items-center gap-4 flex-wrap mb-4">
              {[
                { key: 'present', label: 'Present', color: 'var(--success)' },
                { key: 'absent', label: 'Absent', color: 'var(--danger)' },
                { key: 'late', label: 'Late', color: 'var(--warning)' },
                { key: 'excused', label: 'Excused', color: 'var(--accent)' },
              ].map((s) => (
                <div key={s.key} className="flex items-center gap-1.5">
                  <span className="font-mono text-lg font-semibold" style={{ color: s.color }}>
                    {counts[s.key as keyof typeof counts]}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button className="btn btn-secondary btn-sm" onClick={markAllPresent}>
                <CheckSquare size={14} /> Mark All Present
              </button>
              <div
                className="flex items-center gap-1.5 text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                <Info size={12} />
                Keyboard: P = Present, A = Absent, L = Late, E = Excused
              </div>
            </div>
          </div>

          {/* Attendance Table */}
          {students.length === 0 ? (
            <div className="empty-state py-10">
              <CheckSquare size={32} />
              <p className="text-sm">No students enrolled in this class.</p>
            </div>
          ) : (
            <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
              <table className="data-table" style={{ marginBottom: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Roll No.</th>
                    <th>Student Name</th>
                    <th style={{ width: '200px' }}>Status</th>
                    <th>Note (optional)</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const rec = records[student.id] || { status: 'present', note: '' }
                    return (
                      <tr key={student.id}>
                        <td>
                          <span className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
                            {student.roll_number || '—'}
                          </span>
                        </td>
                        <td>
                          <span className="font-medium">{student.full_name}</span>
                        </td>
                        <td>
                          <div className="flex gap-1.5">
                            {(['present', 'absent', 'late', 'excused'] as AttendanceStatus[]).map((status) => (
                              <button
                                key={status}
                                className={`att-btn ${status} ${rec.status === status ? 'active' : ''}`}
                                onClick={() => setStatus(student.id, status)}
                                title={`${status.charAt(0).toUpperCase() + status.slice(1)} (${status.charAt(0).toUpperCase()})`}
                              >
                                {status.charAt(0).toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Optional note..."
                            value={rec.note}
                            onChange={(e) => setNote(student.id, e.target.value)}
                            style={{ fontSize: '0.875rem', height: '32px', padding: '0.25rem 0.5rem' }}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Save Button */}
          {students.length > 0 && (
            <div className="mt-4 flex justify-end">
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    Save Attendance for {formatDate(date)}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="card">
          <h3 className="font-semibold text-sm mb-4">Sessions Recorded</h3>
          {sessionDates.length === 0 ? (
            <div className="empty-state py-8">
              <Calendar size={28} />
              <p className="text-sm">No attendance sessions recorded yet for this class.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {sessionDates.map((d) => (
                <button
                  key={d}
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setDate(d)
                    setActiveTab('mark')
                    loadSessionAttendance(d)
                  }}
                >
                  <Calendar size={13} />
                  {formatDate(d)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Report Tab */}
      {activeTab === 'report' && (
        <div className="flex flex-col gap-4">
          <div className="card">
            <h3 className="font-semibold text-sm mb-4">Attendance Summary — All Students</h3>
            {summaryData.length === 0 ? (
              <div className="empty-state py-8">
                <BarChart2 size={28} />
                <p className="text-sm">No attendance data recorded yet.</p>
              </div>
            ) : (
              <>
                <table className="data-table mb-6">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Total Sessions</th>
                      <th>Present</th>
                      <th>Absent</th>
                      <th>Late</th>
                      <th>Excused</th>
                      <th>Attendance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryData.map((row) => (
                      <tr key={row.student_id}>
                        <td className="font-medium">{row.name}</td>
                        <td className="font-mono">{row.summary.total}</td>
                        <td className="font-mono" style={{ color: 'var(--success)' }}>{row.summary.present}</td>
                        <td className="font-mono" style={{ color: 'var(--danger)' }}>{row.summary.absent}</td>
                        <td className="font-mono" style={{ color: 'var(--warning)' }}>{row.summary.late}</td>
                        <td className="font-mono" style={{ color: 'var(--accent)' }}>{row.summary.excused}</td>
                        <td>
                          <span
                            className={`badge font-mono font-semibold ${getAttendancePercentageBg(row.summary.percentage)}`}
                          >
                            {row.summary.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <AttendanceSummaryChart data={summaryData} />
              </>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}
    </div>
  )
}
