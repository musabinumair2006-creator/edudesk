'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import AttendanceSheet from '@/components/attendance/AttendanceSheet'
import AttendanceChart from '@/components/attendance/AttendanceChart'
import { getClassById } from '@/lib/supabase/queries/classes'
import { getStudentsByClass } from '@/lib/supabase/queries/students'
import { getAttendanceForClassDate, saveAttendanceSheet } from '@/lib/supabase/queries/attendance'
import type { Class, Student, AttendanceStatus } from '@/lib/types'
import { formatDateForInput } from '@/lib/utils'
import { Calendar, Download, CheckCircle, ArrowLeft } from 'lucide-react'

export default function ClassAttendancePage() {
  const params = useParams()
  const classId = params?.id as string

  const [cls, setCls] = useState<Class | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(formatDateForInput(new Date()))
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceStatus>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      const [cData, sData, attData] = await Promise.all([
        getClassById(classId),
        getStudentsByClass(classId),
        getAttendanceForClassDate(classId, selectedDate),
      ])
      setCls(cData)
      setStudents(sData)

      // Map initial records
      const initialMap: Record<string, AttendanceStatus> = {}
      sData.forEach((std) => {
        const found = attData.find((a) => a.student_id === std.id)
        initialMap[std.id] = found ? found.status : 'present'
      })
      setAttendanceRecords(initialMap)
      setIsLoading(false)
    }
    loadData()
  }, [classId, selectedDate])

  function handleStatusChange(studentId: string, status: AttendanceStatus) {
    setAttendanceRecords((prev) => ({ ...prev, [studentId]: status }))
  }

  function handleMarkAll(status: AttendanceStatus) {
    const updated: Record<string, AttendanceStatus> = {}
    students.forEach((s) => {
      updated[s.id] = status
    })
    setAttendanceRecords(updated)
  }

  async function handleSaveAttendance() {
    setIsSaving(true)
    const payload = Object.entries(attendanceRecords).map(([student_id, status]) => ({
      student_id,
      status,
    }))

    const success = await saveAttendanceSheet(classId, selectedDate, payload)
    setIsSaving(false)
    if (success) {
      setToastMsg(`Attendance saved successfully for ${payload.length} students!`)
      setTimeout(() => setToastMsg(null), 3000)
    }
  }

  return (
    <AppShell>
      <Header
        title={`Attendance Sheet — ${cls?.name || 'Physics Class'}`}
        subtitle="Mark, import, and review attendance records for Centaurus Academy"
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/classes/${classId}`} className="btn btn-secondary btn-sm">
              <ArrowLeft size={14} /> Back to Class
            </Link>
            <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
              <Download size={14} /> Export Report
            </button>
          </div>
        }
      />

      <div className="page-body flex flex-col gap-6">
        {toastMsg && (
          <div className="toast success">
            <CheckCircle size={18} />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Date Selector & Toolbar */}
        <div className="card p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-accent" />
            <div className="form-group mb-0">
              <label className="text-xs font-semibold text-text-muted uppercase">Session Date</label>
              <input
                type="date"
                className="form-input text-xs py-1.5"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleMarkAll('present')}
            >
              Mark All Present
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSaveAttendance}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>

        {/* Attendance Sheet Table */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <span className="spinner spinner-lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AttendanceSheet
                students={students}
                records={attendanceRecords}
                onStatusChange={handleStatusChange}
              />
            </div>

            {/* Attendance Analytics & Trend */}
            <div className="card flex flex-col gap-4">
              <h3 className="font-bold text-sm text-text-primary">Attendance Analytics</h3>
              <p className="text-xs text-text-secondary">
                Weekly attendance percentage trend across all recorded sessions.
              </p>
              <AttendanceChart />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
