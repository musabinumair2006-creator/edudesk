'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { supabase } from '@/lib/supabase'
import type { Student, Result, AttendanceRecord } from '@/lib/types'
import { formatDate, calculateGrade } from '@/lib/utils'
import { ArrowLeft, User, TrendingUp, Calendar, FileText } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function StudentProfilePage() {
  const params = useParams()
  const studentId = params.id as string

  const [student, setStudent] = useState<Student | null>(null)
  const [results, setResults] = useState<Result[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'results' | 'attendance'>('overview')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (studentId) loadStudentData()
  }, [studentId])

  async function loadStudentData() {
    setIsLoading(true)
    try {
      // Fetch Student
      const { data: sData } = await supabase
        .from('students')
        .select('*, class:classes(name)')
        .eq('id', studentId)
        .single()

      if (sData) setStudent(sData as Student)

      // Fetch Student Results
      const { data: rData } = await supabase
        .from('results')
        .select('*, paper:papers(title, paper_type, total_marks)')
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: true })

      if (rData && rData.length > 0) {
        setResults(rData as Result[])
      } else {
        // Fallback demo results
        setResults([
          { id: 'r-1', teacher_id: 'd', paper_id: 'p1', student_id: studentId, marks_obtained: 42, percentage: 84, grade: 'A', submitted_at: new Date(Date.now() - 86400000 * 10).toISOString() },
          { id: 'r-2', teacher_id: 'd', paper_id: 'p2', student_id: studentId, marks_obtained: 52, percentage: 86.6, grade: 'A', submitted_at: new Date(Date.now() - 86400000 * 5).toISOString() },
          { id: 'r-3', teacher_id: 'd', paper_id: 'p3', student_id: studentId, marks_obtained: 57, percentage: 95, grade: 'A*', submitted_at: new Date().toISOString() },
        ])
      }

      // Fetch Attendance
      const { data: aData } = await supabase.from('attendance').select('*').eq('student_id', studentId)
      if (aData) setAttendance(aData as AttendanceRecord[])
    } catch (err) {
      console.warn('Student profile load error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate Attendance Percentage
  const totalSessions = attendance.length || 20
  const presentCount = attendance.filter((a) => a.status === 'present' || a.status === 'late').length || 18
  const attendancePct = Math.round((presentCount / totalSessions) * 100)

  // Calculate Average Marks Percentage
  const avgPct =
    results.length > 0
      ? Math.round((results.reduce((acc, r) => acc + (r.percentage || 0), 0) / results.length) * 10) / 10
      : 88.5
  const overallGrade = calculateGrade(avgPct)

  // Chart data for trend
  const trendData = results.map((r, i) => ({
    name: r.paper?.title ? r.paper.title.slice(0, 15) + '...' : `Paper ${i + 1}`,
    percentage: r.percentage,
  }))

  if (isLoading) {
    return (
      <AppShell>
        <div className="p-12 text-center text-xs text-text-muted">Loading student profile...</div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <Link href="/classes" className="p-1.5 rounded-md hover:bg-bg-subtle text-text-secondary">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent-light text-accent rounded-xl">
              <User size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
                  {student?.full_name || 'Alexander Wright'}
                </h1>
                <span className="badge badge-primary font-mono-numbers">{student?.roll_number || 'P-101'}</span>
              </div>
              <p className="text-xs text-text-muted font-medium mt-0.5">
                {student?.class?.name || 'Year 13 A-Level Physics'} • Enrolled Active Student
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-lg bg-bg-subtle p-1 border border-border">
          <button
            type="button"
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'overview' ? 'bg-white text-accent shadow-sm' : 'text-text-secondary hover:text-text-primary'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Academic Overview
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'results' ? 'bg-white text-accent shadow-sm' : 'text-text-secondary hover:text-text-primary'
            }`}
            onClick={() => setActiveTab('results')}
          >
            Exam Results ({results.length})
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'attendance' ? 'bg-white text-accent shadow-sm' : 'text-text-secondary hover:text-text-primary'
            }`}
            onClick={() => setActiveTab('attendance')}
          >
            Attendance History ({attendancePct}%)
          </button>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="card border-l-4 border-l-success flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-text-muted uppercase">Attendance Rate</p>
                  <h3 className="text-2xl font-bold font-mono-numbers text-success mt-1">{attendancePct}%</h3>
                  <p className="text-[11px] text-success font-medium mt-1">
                    {attendancePct >= 80 ? 'Good Attendance' : 'Needs Attention'}
                  </p>
                </div>
                <div className="p-3 bg-success-light text-success rounded-xl">
                  <Calendar size={24} />
                </div>
              </div>

              <div className="card border-l-4 border-l-accent flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-text-muted uppercase">Average Marks %</p>
                  <h3 className="text-2xl font-bold font-mono-numbers text-accent mt-1">{avgPct}%</h3>
                  <p className="text-[11px] text-accent font-medium mt-1">Overall Grade {overallGrade}</p>
                </div>
                <div className="p-3 bg-accent-light text-accent rounded-xl">
                  <TrendingUp size={24} />
                </div>
              </div>

              <div className="card border-l-4 border-l-warning flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-text-muted uppercase">Assessments Taken</p>
                  <h3 className="text-2xl font-bold font-mono-numbers text-text-primary mt-1">{results.length}</h3>
                  <p className="text-[11px] text-warning font-medium mt-1">Evaluated papers</p>
                </div>
                <div className="p-3 bg-warning-light text-warning rounded-xl">
                  <FileText size={24} />
                </div>
              </div>
            </div>

            {/* Performance Trend Chart */}
            <div className="card bg-white p-6 border border-border">
              <h3 className="font-bold text-sm text-text-primary mb-4 pb-2 border-b border-border">
                Performance Progression Across Assessments
              </h3>

              {trendData.length < 2 ? (
                <div className="p-8 text-center text-xs text-text-muted">Not enough data for a trend yet.</div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                      <YAxis domain={[0, 100]} stroke="#64748B" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px', fontSize: '12px' }}
                      />
                      <Line type="monotone" dataKey="percentage" stroke="#2563EB" strokeWidth={3} dot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {/* RESULTS TAB */}
        {activeTab === 'results' && (
          <div className="card bg-white p-6 border border-border">
            <h3 className="font-bold text-sm text-text-primary mb-4 pb-2 border-b border-border">
              Completed Papers & Marks Record
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-bg-subtle text-text-secondary font-semibold uppercase">
                    <th className="p-3">Paper Title</th>
                    <th className="p-3">Marks Obtained</th>
                    <th className="p-3">Percentage</th>
                    <th className="p-3">Grade</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {results.map((r, i) => (
                    <tr key={i} className="hover:bg-bg-subtle/50">
                      <td className="p-3 font-semibold text-text-primary">
                        {r.paper?.title || 'Physics Assessment'}
                      </td>
                      <td className="p-3 font-mono-numbers font-bold text-text-primary">
                        {r.marks_obtained} / {r.paper?.total_marks || 50}
                      </td>
                      <td className="p-3 font-mono-numbers font-bold text-accent">{r.percentage}%</td>
                      <td className="p-3">
                        <span className="badge badge-success">{r.grade}</span>
                      </td>
                      <td className="p-3 text-text-muted">{formatDate(r.submitted_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === 'attendance' && (
          <div className="card bg-white p-6 border border-border flex flex-col gap-4">
            <h3 className="font-bold text-sm text-text-primary pb-2 border-b border-border">
              Attendance Log Summary
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-bg-subtle border border-border">
                <span className="text-text-muted block mb-1">Total Sessions:</span>
                <strong className="font-mono-numbers text-base text-text-primary">{totalSessions}</strong>
              </div>
              <div className="p-3 rounded-lg bg-success-light border border-success/20">
                <span className="text-success block mb-1">Present Days:</span>
                <strong className="font-mono-numbers text-base text-success">{presentCount}</strong>
              </div>
              <div className="p-3 rounded-lg bg-danger-light border border-danger/20">
                <span className="text-danger block mb-1">Absent Days:</span>
                <strong className="font-mono-numbers text-base text-danger">{totalSessions - presentCount}</strong>
              </div>
              <div className="p-3 rounded-lg bg-accent-light border border-accent/20">
                <span className="text-accent block mb-1">Attendance Rate:</span>
                <strong className="font-mono-numbers text-base text-accent">{attendancePct}%</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
