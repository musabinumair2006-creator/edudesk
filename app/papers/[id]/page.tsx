'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { ResultsTable } from '@/components/results/ResultsTable'
import { supabase } from '@/lib/supabase'
import type { Paper, Student, Result } from '@/lib/types'
import { exportPaper, exportMarkScheme } from '@/lib/pdf-export'
import { downloadBlob, formatDate } from '@/lib/utils'
import {
  FileText,
  CheckCircle,
  Download,
  ArrowLeft,
  Edit3,
  Send,
  Printer,
  Sparkles,
} from 'lucide-react'

export default function SinglePaperPage() {
  const params = useParams()
  const router = useRouter()
  const paperId = params.id as string

  const [paper, setPaper] = useState<Paper | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [results, setResults] = useState<Result[]>([])
  const [activeTab, setActiveTab] = useState<'paper' | 'mark_scheme' | 'results' | 'export'>('paper')
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    if (paperId) loadPaperDetails()
  }, [paperId])

  async function loadPaperDetails() {
    setIsLoading(true)
    try {
      // Fetch paper
      const { data: pData } = await supabase
        .from('papers')
        .select('*, class:classes(name), curriculum_level:curriculum_levels(name)')
        .eq('id', paperId)
        .single()

      if (pData) {
        setPaper(pData as Paper)

        // Fetch students of the assigned class if class_id is set
        if (pData.class_id) {
          const { data: sData } = await supabase
            .from('students')
            .select('*')
            .eq('class_id', pData.class_id)
            .eq('is_active', true)
          if (sData) setStudents(sData as Student[])
        } else {
          // Default class students
          const { data: sData } = await supabase.from('students').select('*').limit(10)
          if (sData) setStudents(sData as Student[])
        }

        // Fetch existing results
        const { data: rData } = await supabase.from('results').select('*').eq('paper_id', paperId)
        if (rData) setResults(rData as Result[])
      } else {
        // Fallback mock paper if ID is a demo ID
        const mockPaper: Paper = {
          id: paperId,
          teacher_id: 'demo',
          title: 'A-Level Physics Midterm Examination 2025',
          paper_type: 'midterm',
          total_marks: 60,
          time_allowed: '1 Hour 30 Minutes',
          instructions: 'Answer all questions in Section A and Section B. Take g = 9.81 m/s². Show all working.',
          status: 'final',
          creation_mode: 'mixed',
          content: {
            sections: [
              {
                label: 'SECTION A — Core Mechanics & Fields',
                questions: [
                  {
                    question_text: 'A flat circular coil of 150 turns and radius 4.0 cm is placed in a uniform magnetic field of 0.25 T. The field drops to zero in 0.05 s. Calculate the magnitude of the induced e.m.f.',
                    marks: 4,
                    order_index: 1,
                    is_ai_generated: false,
                    answer: 'e.m.f. = 3.76 V',
                  },
                  {
                    question_text: 'Explain the principle of superposition as applied to two coherent light waves arriving at a point on a screen.',
                    marks: 3,
                    order_index: 2,
                    is_ai_generated: true,
                    answer: 'When two waves meet, the resultant displacement is the vector sum of individual displacements.',
                  },
                ],
              },
              {
                label: 'SECTION B — Quantum & Nuclear Physics',
                questions: [
                  {
                    question_text: 'Explain why the photoelectric effect provides evidence for the photon model of light rather than wave theory.',
                    marks: 5,
                    order_index: 3,
                    is_ai_generated: false,
                    answer: 'Instantaneous emission and existence of threshold frequency.',
                  },
                ],
              },
            ],
          },
          created_at: new Date().toISOString(),
        }
        setPaper(mockPaper)

        setStudents([
          { id: 'st-1', teacher_id: 'demo', full_name: 'Alexander Wright', roll_number: 'P-101', is_active: true, created_at: '' },
          { id: 'st-2', teacher_id: 'demo', full_name: 'Beatrice Chen', roll_number: 'P-102', is_active: true, created_at: '' },
          { id: 'st-3', teacher_id: 'demo', full_name: 'Carlos Mendez', roll_number: 'P-103', is_active: true, created_at: '' },
          { id: 'st-4', teacher_id: 'demo', full_name: 'Dina Patel', roll_number: 'P-104', is_active: true, created_at: '' },
        ])

        setResults([
          { id: 'r-1', teacher_id: 'demo', paper_id: paperId, student_id: 'st-1', marks_obtained: 54, percentage: 90, grade: 'A*', submitted_at: '' },
          { id: 'r-2', teacher_id: 'demo', paper_id: paperId, student_id: 'st-2', marks_obtained: 48, percentage: 80, grade: 'A', submitted_at: '' },
          { id: 'r-3', teacher_id: 'demo', paper_id: paperId, student_id: 'st-3', marks_obtained: 38, percentage: 63.3, grade: 'C', submitted_at: '' },
        ])
      }
    } catch (err) {
      console.warn('Paper details load error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleMarkDistributed() {
    if (!paper) return
    try {
      await supabase.from('papers').update({ status: 'distributed' }).eq('id', paper.id)
      setPaper({ ...paper, status: 'distributed' })
    } catch (err) {
      console.warn('Update status error:', err)
    }
  }

  async function handleDownloadPDF(type: 'paper' | 'mark_scheme') {
    if (!paper) return
    setIsExporting(true)
    try {
      const blob = type === 'paper' ? await exportPaper(paper) : await exportMarkScheme(paper)
      const filename = `${paper.title.replace(/\s+/g, '_')}_${type === 'paper' ? 'EXAM' : 'MARK_SCHEME'}.pdf`
      downloadBlob(blob, filename)
    } catch (err) {
      console.warn('PDF export error:', err)
    } finally {
      setIsExporting(false)
    }
  }

  function handleExportCSV() {
    if (!paper || results.length === 0) return
    let csvContent = 'Student Name,Roll Number,Marks Obtained,Total Marks,Percentage,Grade,Feedback\n'
    results.forEach((r) => {
      const studentName = students.find((s) => s.id === r.student_id)?.full_name || 'Student'
      const rollNumber = students.find((s) => s.id === r.student_id)?.roll_number || 'N/A'
      csvContent += `"${studentName}","${rollNumber}",${r.marks_obtained},${paper.total_marks},${r.percentage}%,${r.grade},"${r.feedback || ''}"\n`
    })

    const blob = new Blob([csvContent], { type: 'text/csv' })
    downloadBlob(blob, `${paper.title.replace(/\s+/g, '_')}_RESULTS.csv`)
  }

  if (isLoading || !paper) {
    return (
      <AppShell>
        <div className="p-12 text-center text-xs text-text-muted">Loading paper details...</div>
      </AppShell>
    )
  }

  const sections = paper.content?.sections || []
  let globalQNum = 1

  return (
    <AppShell>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        {/* Top Header Navigation */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Link href="/papers" className="p-1.5 rounded-md hover:bg-bg-subtle text-text-secondary">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">{paper.title}</h1>
                <span
                  className={`badge ${
                    paper.status === 'distributed'
                      ? 'badge-success'
                      : paper.status === 'final'
                      ? 'badge-primary'
                      : 'badge-subtle'
                  }`}
                >
                  {paper.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-text-muted mt-1 font-medium">
                {paper.curriculum_level?.name || 'A-Level Physics'} • {paper.paper_type.toUpperCase()} •{' '}
                <span className="font-mono-numbers">{paper.total_marks} Marks</span> • Created {formatDate(paper.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {paper.status === 'draft' && (
              <Link href={`/papers/create?edit=${paper.id}`} className="btn btn-outline text-xs">
                <Edit3 size={14} /> Edit Paper
              </Link>
            )}
            {paper.status === 'final' && (
              <button type="button" className="btn btn-secondary text-xs text-success" onClick={handleMarkDistributed}>
                <Send size={14} /> Mark as Distributed
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary text-xs"
              onClick={() => handleDownloadPDF('paper')}
              disabled={isExporting}
            >
              <Download size={14} /> {isExporting ? 'Exporting PDF...' : 'Download Paper PDF'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex rounded-lg bg-bg-subtle p-1 border border-border">
          <button
            type="button"
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'paper' ? 'bg-white text-accent shadow-sm' : 'text-text-secondary hover:text-text-primary'
            }`}
            onClick={() => setActiveTab('paper')}
          >
            Exam Paper
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'mark_scheme' ? 'bg-white text-accent shadow-sm' : 'text-text-secondary hover:text-text-primary'
            }`}
            onClick={() => setActiveTab('mark_scheme')}
          >
            Official Mark Scheme
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'results' ? 'bg-white text-accent shadow-sm' : 'text-text-secondary hover:text-text-primary'
            }`}
            onClick={() => setActiveTab('results')}
          >
            Student Results ({results.length})
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'export' ? 'bg-white text-accent shadow-sm' : 'text-text-secondary hover:text-text-primary'
            }`}
            onClick={() => setActiveTab('export')}
          >
            Exports & Reports
          </button>
        </div>

        {/* TAB 1: RENDERED EXAM PAPER */}
        {activeTab === 'paper' && (
          <div className="card bg-white p-8 border border-border shadow-sm flex flex-col gap-6">
            {/* Cover Page Card */}
            <div className="p-8 rounded-xl border-2 border-text-primary bg-bg-base text-center flex flex-col items-center gap-3">
              <h2 className="text-xl font-extrabold text-text-primary uppercase tracking-wider">CENTAURUS ACADEMY</h2>
              <p className="text-xs font-bold text-text-muted">DEPARTMENT OF PHYSICS</p>

              <div className="my-3 p-4 border border-text-primary w-full max-w-md bg-white">
                <h3 className="text-lg font-bold text-text-primary">{paper.title}</h3>
                <span className="text-xs font-bold text-accent mt-1 block">
                  {paper.curriculum_level?.name || 'A-Level Physics'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-medium text-text-secondary w-full max-w-md bg-white p-3 border border-border rounded-lg">
                <div>Total Marks: <strong className="font-mono-numbers text-text-primary">{paper.total_marks}</strong></div>
                <div>Time Allowed: <strong className="text-text-primary">{paper.time_allowed || '1.5 Hours'}</strong></div>
              </div>

              <div className="p-3 bg-white border border-border rounded-lg text-left text-xs w-full max-w-md">
                <strong className="block text-text-primary mb-1">INSTRUCTIONS:</strong>
                <p className="text-text-secondary leading-relaxed">
                  {paper.instructions || 'Answer all questions. Show all working for calculations. Take g = 9.81 m/s².'}
                </p>
              </div>
            </div>

            {/* Questions Body */}
            <div className="flex flex-col gap-6 mt-4">
              {sections.map((sec, secIdx) => (
                <div key={secIdx} className="flex flex-col gap-4">
                  <h3 className="font-bold text-sm bg-bg-subtle p-2.5 rounded border-l-4 border-l-accent text-text-primary">
                    {sec.label || `SECTION ${secIdx + 1}`}
                  </h3>

                  {sec.questions.map((q, qIdx) => {
                    const currentNum = globalQNum++
                    return (
                      <div key={qIdx} className="p-4 rounded-lg border border-border bg-white flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-text-primary">Question {currentNum}</span>
                          <span className="badge badge-primary font-mono-numbers">[{q.marks} Marks]</span>
                        </div>
                        <p className="text-xs text-text-primary leading-relaxed">{q.question_text}</p>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: MARK SCHEME */}
        {activeTab === 'mark_scheme' && (
          <div className="card bg-white p-8 border border-border flex flex-col gap-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h2 className="font-extrabold text-lg text-text-primary">Official Mark Scheme</h2>
                <p className="text-xs text-text-muted">Worked solutions and marking guidance per question</p>
              </div>
              <button
                type="button"
                className="btn btn-secondary text-xs"
                onClick={() => handleDownloadPDF('mark_scheme')}
                disabled={isExporting}
              >
                <Printer size={14} /> Download Mark Scheme PDF
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {sections.flatMap((s) => s.questions).map((q, idx) => (
                <div key={idx} className="p-4 rounded-lg border border-border bg-bg-base flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-text-primary">Question {idx + 1} ({q.marks} Marks)</span>
                    <span className="text-[11px] text-text-muted font-medium">{q.topic || 'Physics'}</span>
                  </div>
                  <p className="text-xs text-text-secondary">{q.question_text}</p>
                  <div className="p-3 bg-success-light border border-success/20 rounded-md mt-1">
                    <span className="text-[11px] font-bold text-success block mb-1">Mark Scheme Solution:</span>
                    <p className="text-xs text-success-dark font-mono-numbers">
                      {q.answer || '1 mark for correct formula, 1 mark for substitution, 1 mark for correct answer with units.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: RESULTS TABLE */}
        {activeTab === 'results' && (
          <ResultsTable
            paper={paper}
            students={students}
            initialResults={results}
            onResultsSaved={(newResults) => setResults(newResults)}
          />
        )}

        {/* TAB 4: EXPORTS & REPORTS */}
        {activeTab === 'export' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6 flex flex-col gap-3">
              <div className="p-3 rounded-lg bg-accent-light text-accent w-fit">
                <FileText size={24} />
              </div>
              <h3 className="font-bold text-base text-text-primary">Exam Paper PDF</h3>
              <p className="text-xs text-text-muted">Print-ready PDF with cover page and instructions.</p>
              <button
                type="button"
                className="btn btn-primary text-xs mt-2 justify-center"
                onClick={() => handleDownloadPDF('paper')}
                disabled={isExporting}
              >
                <Download size={14} /> Download Paper PDF
              </button>
            </div>

            <div className="card p-6 flex flex-col gap-3">
              <div className="p-3 rounded-lg bg-success-light text-success w-fit">
                <CheckCircle size={24} />
              </div>
              <h3 className="font-bold text-base text-text-primary">Mark Scheme PDF</h3>
              <p className="text-xs text-text-muted">Official marking scheme and worked solutions PDF.</p>
              <button
                type="button"
                className="btn btn-secondary text-xs mt-2 justify-center border-success text-success hover:bg-success-light"
                onClick={() => handleDownloadPDF('mark_scheme')}
                disabled={isExporting}
              >
                <Download size={14} /> Download Mark Scheme PDF
              </button>
            </div>

            <div className="card p-6 flex flex-col gap-3">
              <div className="p-3 rounded-lg bg-warning-light text-warning w-fit">
                <Sparkles size={24} />
              </div>
              <h3 className="font-bold text-base text-text-primary">Results CSV Export</h3>
              <p className="text-xs text-text-muted">Export student marks, percentages, and grades as CSV.</p>
              <button
                type="button"
                className="btn btn-outline text-xs mt-2 justify-center"
                onClick={handleExportCSV}
                disabled={results.length === 0}
              >
                <Download size={14} /> Download Results CSV
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
