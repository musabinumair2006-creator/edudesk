'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Student, AttendanceStatus } from '@/lib/types'
import { Check, Calendar, CheckCircle2, Save, Download } from 'lucide-react'
import { downloadBlob } from '@/lib/utils'

export function AttendanceSheet({
  classId,
  students,
}: {
  classId: string
  students: Student[]
}) {
  const todayIso = new Date().toISOString().split('T')[0]
  const [sessionDate, setSessionDate] = useState(todayIso)
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>({})
  const [focusedIndex, setFocusedIndex] = useState<number>(0)
  const [isSaving, setIsSaving] = useState(false)
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'sheet' | 'summary'>('sheet')

  // Initialize all students as 'present' by default
  useEffect(() => {
    loadAttendanceForDate(sessionDate)
  }, [sessionDate, students])

  async function loadAttendanceForDate(dateStr: string) {
    try {
      const { data } = await supabase
        .from('attendance')
        .select('*')
        .eq('class_id', classId)
        .eq('session_date', dateStr)

      const initial: Record<string, AttendanceStatus> = {}
      students.forEach((s) => {
        initial[s.id] = 'present'
      })

      if (data && data.length > 0) {
        data.forEach((rec) => {
          initial[rec.student_id] = rec.status as AttendanceStatus
        })
      }

      setRecords(initial)
    } catch (err) {
      console.warn('Attendance fetch error:', err)
    }
  }

  // Keyboard shortcut handler for instant row marking (P, A, L, E keys)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (['input', 'textarea', 'select'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        return
      }

      const key = e.key.toUpperCase()
      const student = students[focusedIndex]
      if (!student) return

      if (key === 'P') {
        e.preventDefault()
        markStatus(student.id, 'present')
        setFocusedIndex((prev) => Math.min(prev + 1, students.length - 1))
      } else if (key === 'A') {
        e.preventDefault()
        markStatus(student.id, 'absent')
        setFocusedIndex((prev) => Math.min(prev + 1, students.length - 1))
      } else if (key === 'L') {
        e.preventDefault()
        markStatus(student.id, 'late')
        setFocusedIndex((prev) => Math.min(prev + 1, students.length - 1))
      } else if (key === 'E') {
        e.preventDefault()
        markStatus(student.id, 'excused')
        setFocusedIndex((prev) => Math.min(prev + 1, students.length - 1))
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusedIndex((prev) => Math.min(prev + 1, students.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusedIndex((prev) => Math.max(prev - 1, 0))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [focusedIndex, students])

  function markStatus(studentId: string, status: AttendanceStatus) {
    setRecords((prev) => ({ ...prev, [studentId]: status }))
  }

  function handleMarkAllPresent() {
    const allPresent: Record<string, AttendanceStatus> = {}
    students.forEach((s) => (allPresent[s.id] = 'present'))
    setRecords(allPresent)
  }

  async function handleSaveAttendance() {
    setIsSaving(true)
    setSavedSuccessMsg(null)
    try {
      const rows = students.map((s) => ({
        teacher_id: 'demo-teacher',
        class_id: classId,
        student_id: s.id,
        session_date: sessionDate,
        status: records[s.id] || 'present',
      }))

      await supabase.from('attendance').upsert(rows, { onConflict: 'student_id,class_id,session_date' })

      setSavedSuccessMsg(`Attendance saved — ${students.length} students marked for ${sessionDate}`)
      setTimeout(() => setSavedSuccessMsg(null), 4000)
    } catch (err) {
      console.warn('Save attendance error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  // Running counters
  const presentCount = Object.values(records).filter((s) => s === 'present').length
  const absentCount = Object.values(records).filter((s) => s === 'absent').length
  const lateCount = Object.values(records).filter((s) => s === 'late').length
  const excusedCount = Object.values(records).filter((s) => s === 'excused').length

  function handleExportCSV() {
    let csvContent = 'Roll Number,Student Name,Date,Status\n'
    students.forEach((s) => {
      csvContent += `"${s.roll_number || ''}","${s.full_name}","${sessionDate}","${records[s.id] || 'present'}"\n`
    })
    const blob = new Blob([csvContent], { type: 'text/csv' })
    downloadBlob(blob, `Attendance_${sessionDate}.csv`)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-border">
        <div className="flex items-center gap-3">
          <Calendar size={18} className="text-accent" />
          <input
            type="date"
            className="form-input text-xs py-1.5 px-3 font-mono-numbers w-auto"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
          />
          <button type="button" className="btn btn-secondary text-xs py-1.5" onClick={handleMarkAllPresent}>
            <Check size={14} /> Mark All Present
          </button>
        </div>

        {/* Counter Badges */}
        <div className="flex items-center gap-2 text-xs font-mono-numbers font-bold">
          <span className="badge badge-success px-2.5 py-1">{presentCount} Present</span>
          <span className="badge badge-danger px-2.5 py-1">{absentCount} Absent</span>
          <span className="badge badge-warning px-2.5 py-1">{lateCount} Late</span>
          <span className="badge badge-subtle px-2.5 py-1">{excusedCount} Excused</span>
        </div>
      </div>

      {savedSuccessMsg && (
        <div className="p-3 bg-success-light text-success border border-success/30 rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} /> {savedSuccessMsg}
        </div>
      )}

      {/* Keyboard Shortcut Tip */}
      <div className="p-2.5 rounded-lg bg-accent-light/50 border border-accent/20 text-xs text-accent flex items-center justify-between">
        <span>
          ⚡ <strong>Keyboard Shortcuts Active:</strong> Focus row & press <kbd className="bg-white px-1.5 py-0.5 rounded border text-[10px] font-bold">P</kbd> Present, <kbd className="bg-white px-1.5 py-0.5 rounded border text-[10px] font-bold">A</kbd> Absent, <kbd className="bg-white px-1.5 py-0.5 rounded border text-[10px] font-bold">L</kbd> Late, <kbd className="bg-white px-1.5 py-0.5 rounded border text-[10px] font-bold">E</kbd> Excused, or <kbd className="bg-white px-1.5 py-0.5 rounded border text-[10px] font-bold">↑/↓</kbd> arrows.
        </span>
        <button type="button" className="text-[11px] font-bold text-accent underline ml-2" onClick={handleExportCSV}>
          <Download size={12} className="inline mr-1" /> Export CSV
        </button>
      </div>

      {/* Attendance Table */}
      <div className="card bg-white p-0 border border-border overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border bg-bg-subtle text-text-secondary uppercase font-semibold">
              <th className="p-3.5 w-24 font-mono-numbers">Roll No</th>
              <th className="p-3.5">Student Name</th>
              <th className="p-3.5 text-center">P</th>
              <th className="p-3.5 text-center">A</th>
              <th className="p-3.5 text-center">L</th>
              <th className="p-3.5 text-center">E</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {students.map((student, index) => {
              const currentStatus = records[student.id] || 'present'
              const isFocused = focusedIndex === index

              return (
                <tr
                  key={student.id}
                  className={`transition-colors cursor-pointer ${
                    isFocused ? 'bg-accent-light/60 ring-1 ring-accent inset-0' : 'hover:bg-bg-subtle/50'
                  }`}
                  onClick={() => setFocusedIndex(index)}
                >
                  <td className="p-3.5 font-mono-numbers font-bold text-text-muted">{student.roll_number || `P-${index + 101}`}</td>
                  <td className="p-3.5 font-semibold text-text-primary">{student.full_name}</td>

                  {/* Present Button */}
                  <td className="p-3.5 text-center">
                    <button
                      type="button"
                      className={`w-8 h-8 rounded-full font-bold text-xs transition-all ${
                        currentStatus === 'present'
                          ? 'bg-success text-white ring-2 ring-success/30 scale-105'
                          : 'bg-bg-subtle text-text-muted hover:bg-border'
                      }`}
                      onClick={() => markStatus(student.id, 'present')}
                    >
                      P
                    </button>
                  </td>

                  {/* Absent Button */}
                  <td className="p-3.5 text-center">
                    <button
                      type="button"
                      className={`w-8 h-8 rounded-full font-bold text-xs transition-all ${
                        currentStatus === 'absent'
                          ? 'bg-danger text-white ring-2 ring-danger/30 scale-105'
                          : 'bg-bg-subtle text-text-muted hover:bg-border'
                      }`}
                      onClick={() => markStatus(student.id, 'absent')}
                    >
                      A
                    </button>
                  </td>

                  {/* Late Button */}
                  <td className="p-3.5 text-center">
                    <button
                      type="button"
                      className={`w-8 h-8 rounded-full font-bold text-xs transition-all ${
                        currentStatus === 'late'
                          ? 'bg-warning text-white ring-2 ring-warning/30 scale-105'
                          : 'bg-bg-subtle text-text-muted hover:bg-border'
                      }`}
                      onClick={() => markStatus(student.id, 'late')}
                    >
                      L
                    </button>
                  </td>

                  {/* Excused Button */}
                  <td className="p-3.5 text-center">
                    <button
                      type="button"
                      className={`w-8 h-8 rounded-full font-bold text-xs transition-all ${
                        currentStatus === 'excused'
                          ? 'bg-slate-700 text-white ring-2 ring-slate-400 scale-105'
                          : 'bg-bg-subtle text-text-muted hover:bg-border'
                      }`}
                      onClick={() => markStatus(student.id, 'excused')}
                    >
                      E
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        className="btn btn-primary py-2.5 justify-center shadow-md text-xs font-bold"
        onClick={handleSaveAttendance}
        disabled={isSaving}
      >
        <Save size={16} /> {isSaving ? 'Saving Attendance...' : `Save Attendance Register for ${sessionDate}`}
      </button>
    </div>
  )
}
