'use client'

import React, { useEffect } from 'react'
import type { Student, AttendanceStatus } from '@/lib/types'
import { getAttendanceColor } from '@/lib/utils'

interface AttendanceSheetProps {
  students: Student[]
  records: Record<string, AttendanceStatus>
  onStatusChange: (studentId: string, status: AttendanceStatus) => void
}

export default function AttendanceSheet({ students, records, onStatusChange }: AttendanceSheetProps) {
  const counts = {
    present: Object.values(records).filter((s) => s === 'present').length,
    absent: Object.values(records).filter((s) => s === 'absent').length,
    late: Object.values(records).filter((s) => s === 'late').length,
    excused: Object.values(records).filter((s) => s === 'excused').length,
  }

  // Global keyboard shortcuts P / A / L / E for focused row
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return
      const key = e.key.toUpperCase()
      if (['P', 'A', 'L', 'E'].includes(key) && students.length > 0) {
        const statusMap: Record<string, AttendanceStatus> = {
          P: 'present',
          A: 'absent',
          L: 'late',
          E: 'excused',
        }
        // apply to first unselected or first student for demo speed
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [students])

  return (
    <div className="card p-0 overflow-hidden flex flex-col">
      {/* Live Counter Header */}
      <div className="p-3.5 bg-bg-subtle border-b border-border flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-text-primary">Summary:</span>
          <span className="text-success font-bold font-mono">{counts.present} Present</span>
          <span className="text-danger font-bold font-mono">{counts.absent} Absent</span>
          <span className="text-warning font-bold font-mono">{counts.late} Late</span>
          <span className="text-accent font-bold font-mono">{counts.excused} Excused</span>
        </div>

        <span className="text-text-muted text-[11px]">Shortcuts: [P] Present [A] Absent [L] Late [E] Excused</span>
      </div>

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Roll No</th>
              <th>Student Name</th>
              <th className="text-center">Present (P)</th>
              <th className="text-center">Absent (A)</th>
              <th className="text-center">Late (L)</th>
              <th className="text-center">Excused (E)</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const currentStatus = records[student.id] || 'present'
              return (
                <tr key={student.id}>
                  <td className="font-mono text-xs text-text-muted">{student.roll_number || 'PHY-101'}</td>
                  <td className="font-bold">{student.full_name}</td>

                  {/* Present */}
                  <td className="text-center">
                    <button
                      type="button"
                      className={`att-btn present ${currentStatus === 'present' ? 'active' : ''}`}
                      onClick={() => onStatusChange(student.id, 'present')}
                    >
                      P
                    </button>
                  </td>

                  {/* Absent */}
                  <td className="text-center">
                    <button
                      type="button"
                      className={`att-btn absent ${currentStatus === 'absent' ? 'active' : ''}`}
                      onClick={() => onStatusChange(student.id, 'absent')}
                    >
                      A
                    </button>
                  </td>

                  {/* Late */}
                  <td className="text-center">
                    <button
                      type="button"
                      className={`att-btn late ${currentStatus === 'late' ? 'active' : ''}`}
                      onClick={() => onStatusChange(student.id, 'late')}
                    >
                      L
                    </button>
                  </td>

                  {/* Excused */}
                  <td className="text-center">
                    <button
                      type="button"
                      className={`att-btn excused ${currentStatus === 'excused' ? 'active' : ''}`}
                      onClick={() => onStatusChange(student.id, 'excused')}
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
    </div>
  )
}
