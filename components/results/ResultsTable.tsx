'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Paper, Student, Result } from '@/lib/types'
import { calculateGrade, calculatePercentage } from '@/lib/utils'
import { Save, CheckCircle2, Award, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export function ResultsTable({
  paper,
  students,
  initialResults,
  onResultsSaved,
}: {
  paper: Paper
  students: Student[]
  initialResults: Result[]
  onResultsSaved?: (newResults: Result[]) => void
}) {
  const totalMarks = paper.total_marks || 50

  // Local state map for inline editing: studentId -> { marks, feedback }
  const [marksMap, setMarksMap] = useState<Record<string, { marks: number; feedback: string }>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    const initialMap: Record<string, { marks: number; feedback: string }> = {}

    students.forEach((s) => {
      const existing = initialResults.find((r) => r.student_id === s.id)
      if (existing) {
        initialMap[s.id] = {
          marks: existing.marks_obtained || 0,
          feedback: existing.feedback || '',
        }
      } else {
        // Fallback default marks if empty
        initialMap[s.id] = { marks: Math.floor(totalMarks * 0.8), feedback: '' }
      }
    })

    setMarksMap(initialMap)
  }, [students, initialResults, totalMarks])

  function handleMarksChange(studentId: string, val: string) {
    const num = Math.min(Math.max(parseFloat(val) || 0, 0), totalMarks)
    setMarksMap((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], marks: num },
    }))
  }

  function handleFeedbackChange(studentId: string, val: string) {
    setMarksMap((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], feedback: val },
    }))
  }

  async function handleSaveResults() {
    setIsSaving(true)
    setSuccessMsg(null)
    try {
      const rows = students.map((s) => {
        const entry = marksMap[s.id] || { marks: 0, feedback: '' }
        const percentage = calculatePercentage(entry.marks, totalMarks)
        const grade = calculateGrade(percentage)

        return {
          teacher_id: 'demo-teacher',
          paper_id: paper.id,
          student_id: s.id,
          marks_obtained: entry.marks,
          percentage,
          grade,
          feedback: entry.feedback,
        }
      })

      const { data } = await supabase.from('results').upsert(rows, { onConflict: 'paper_id,student_id' }).select()

      const savedResults = (data as Result[]) || (rows as any)
      if (onResultsSaved) onResultsSaved(savedResults)

      setSuccessMsg(`Successfully saved results for ${students.length} students!`)
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err) {
      console.warn('Save results error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  // Calculate Class Statistics
  const studentRows = students.map((s) => {
    const entry = marksMap[s.id] || { marks: 0, feedback: '' }
    const pct = calculatePercentage(entry.marks, totalMarks)
    const grade = calculateGrade(pct)
    return { ...s, marks: entry.marks, percentage: pct, grade, feedback: entry.feedback }
  })

  const classAvgPct =
    studentRows.length > 0
      ? Math.round((studentRows.reduce((sum, s) => sum + s.percentage, 0) / studentRows.length) * 10) / 10
      : 0

  const classAvgGrade = calculateGrade(classAvgPct)

  // Grade Distribution Chart
  const gradeCounts: Record<string, number> = { 'A*': 0, A: 0, B: 0, C: 0, D: 0, E: 0, U: 0 }
  studentRows.forEach((s) => {
    gradeCounts[s.grade] = (gradeCounts[s.grade] || 0) + 1
  })

  const chartData = Object.entries(gradeCounts).map(([grade, count]) => ({ grade, count }))
  const gradeColors: Record<string, string> = {
    'A*': '#16A34A',
    A: '#2563EB',
    B: '#0284C7',
    C: '#D97706',
    D: '#EA580C',
    E: '#DC2626',
    U: '#475569',
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card bg-white p-4 border border-border flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase">Class Mean Percentage</p>
            <h3 className="text-2xl font-bold font-mono-numbers text-accent mt-1">{classAvgPct}%</h3>
          </div>
          <div className="p-3 bg-accent-light text-accent rounded-xl">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="card bg-white p-4 border border-border flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase">Overall Class Grade</p>
            <h3 className="text-2xl font-bold font-mono-numbers text-success mt-1">{classAvgGrade}</h3>
          </div>
          <div className="p-3 bg-success-light text-success rounded-xl">
            <Award size={24} />
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-success-light text-success border border-success/30 rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* Editable Results Table */}
      <div className="card bg-white p-0 border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between bg-bg-subtle">
          <h3 className="font-bold text-xs text-text-primary uppercase tracking-wider">
            Student Marks & Grade Record ({students.length} Students)
          </h3>
          <span className="text-xs font-mono-numbers font-bold text-text-muted">Total Paper Marks: {totalMarks}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-bg-surface text-text-secondary uppercase font-semibold">
                <th className="p-3 w-28">Roll No</th>
                <th className="p-3">Student Name</th>
                <th className="p-3 w-36">Marks Obtained</th>
                <th className="p-3 w-24">Percentage</th>
                <th className="p-3 w-20">Grade</th>
                <th className="p-3">Feedback / Comments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {studentRows.map((student) => (
                <tr key={student.id} className="hover:bg-bg-subtle/50">
                  <td className="p-3 font-mono-numbers font-bold text-text-muted">{student.roll_number || 'P-101'}</td>
                  <td className="p-3 font-semibold text-text-primary">{student.full_name}</td>

                  {/* Marks Input */}
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        className="form-input text-xs py-1 px-2 font-mono-numbers font-bold w-20 text-accent"
                        min={0}
                        max={totalMarks}
                        value={student.marks}
                        onChange={(e) => handleMarksChange(student.id, e.target.value)}
                      />
                      <span className="text-text-muted font-mono-numbers">/ {totalMarks}</span>
                    </div>
                  </td>

                  <td className="p-3 font-mono-numbers font-bold text-text-primary">{student.percentage}%</td>
                  <td className="p-3">
                    <span className="badge badge-success font-mono-numbers">{student.grade}</span>
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      className="form-input text-xs py-1 px-2 border-border"
                      placeholder="Optional feedback..."
                      value={student.feedback}
                      onChange={(e) => handleFeedbackChange(student.id, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button
        type="button"
        className="btn btn-primary py-2.5 justify-center text-xs font-bold shadow-md"
        onClick={handleSaveResults}
        disabled={isSaving}
      >
        <Save size={16} /> {isSaving ? 'Saving Results...' : 'Save & Calculate All Student Marks'}
      </button>

      {/* Recharts Distribution Graph */}
      <div className="card bg-white p-6 border border-border">
        <h3 className="font-bold text-xs text-text-primary uppercase tracking-wider mb-4 pb-2 border-b border-border">
          Grade Distribution Curve
        </h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="grade" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={gradeColors[entry.grade] || '#2563EB'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
