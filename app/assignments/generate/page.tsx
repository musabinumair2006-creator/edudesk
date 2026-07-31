'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { PHYSICS_CURRICULUM } from '@/lib/ai/physics-curriculum'
import { getClasses } from '@/lib/supabase/queries/classes'
import { getCurriculumLevels } from '@/lib/supabase/queries/teachers'
import type { Class, CurriculumLevel } from '@/lib/types'
import { Sparkles, ArrowLeft, CheckCircle, FileText } from 'lucide-react'

export default function GenerateAssignmentPage() {
  const router = useRouter()
  const [curriculumLevel, setCurriculumLevel] = useState('A-Level')
  const [topic, setTopic] = useState('')
  const [assignmentType, setAssignmentType] = useState('assignment')
  const [numQuestions, setNumQuestions] = useState<number>(5)
  const [totalMarks, setTotalMarks] = useState<number>(50)
  const [difficulty, setDifficulty] = useState('standard')
  const [classId, setClassId] = useState('')
  const [dueDate, setDueDate] = useState('')

  const [classes, setClasses] = useState<Class[]>([])
  const [levels, setLevels] = useState<CurriculumLevel[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPreview, setGeneratedPreview] = useState<any | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [suggestionId, setSuggestionId] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      const [clss, lvls] = await Promise.all([getClasses(), getCurriculumLevels()])
      setClasses(clss)
      setLevels(lvls)
      if (clss.length > 0) setClassId(clss[0].id)
    }
    loadData()
  }, [])

  const availableTopics = PHYSICS_CURRICULUM[curriculumLevel]?.topics || [
    'Kinematics',
    'Dynamics',
    'Electricity',
    'Magnetism',
    'Thermal Physics',
  ]

  useEffect(() => {
    if (availableTopics.length > 0) {
      setTopic(availableTopics[0])
    }
  }, [curriculumLevel])

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setIsGenerating(true)
    setErrorMsg(null)
    setGeneratedPreview(null)

    try {
      const res = await fetch('/api/ai/generate-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curriculum_level: curriculumLevel,
          topic,
          assignment_type: assignmentType,
          num_questions: numQuestions,
          total_marks: totalMarks,
          difficulty,
          class_id: classId,
          due_date: dueDate || null,
        }),
      })

      const data = await res.json()
      if (data.error) {
        setErrorMsg(data.error)
      } else {
        setGeneratedPreview(data.content)
        setSuggestionId(data.suggestion_id)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Generation failed.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <AppShell>
      <Header
        title="AI Physics Assignment Generator"
        subtitle="Calibrated for IGCSE, A-Level, and Edexcel Physics syllabi"
        actions={
          <Link href="/assignments" className="btn btn-secondary btn-sm">
            <ArrowLeft size={14} /> Back to Assignments
          </Link>
        }
      />

      <div className="page-body grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Form Panel */}
        <div className="card p-6">
          <h2 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
            <Sparkles className="text-accent" size={18} /> Assignment Parameters
          </h2>

          {errorMsg && (
            <div className="p-3 mb-4 rounded-md bg-danger-light text-danger text-xs">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleGenerate} className="flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label">Curriculum Level</label>
              <select
                className="form-input form-select"
                value={curriculumLevel}
                onChange={(e) => setCurriculumLevel(e.target.value)}
              >
                <option value="IGCSE">IGCSE Physics (CIE 0625)</option>
                <option value="A-Level">A-Level Physics (CIE 9702)</option>
                <option value="Edexcel">Edexcel International A-Level</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Physics Topic</label>
              <select
                className="form-input form-select"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              >
                {availableTopics.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Assignment Type</label>
                <select
                  className="form-input form-select capitalize"
                  value={assignmentType}
                  onChange={(e) => setAssignmentType(e.target.value)}
                >
                  <option value="assignment">Assignment</option>
                  <option value="quiz">Quiz</option>
                  <option value="classwork">Classwork</option>
                  <option value="midterm">Mid-Term</option>
                  <option value="finalterm">Final Term</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Difficulty</label>
                <select
                  className="form-input form-select capitalize"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option value="foundation">Foundation</option>
                  <option value="standard">Standard</option>
                  <option value="challenging">Challenging</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Number of Questions (1-30)</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  className="form-input"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(parseInt(e.target.value) || 5)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Total Marks</label>
                <input
                  type="number"
                  min={5}
                  max={200}
                  className="form-input"
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(parseInt(e.target.value) || 50)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Target Class</label>
                <select
                  className="form-input form-select"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary py-2.5 justify-center mt-2"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} />
                  Generating physics assignment... (takes ~15s)
                </>
              ) : (
                'Generate Syllabus Assignment 🚀'
              )}
            </button>
          </form>
        </div>

        {/* Right Preview Panel */}
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-text-primary mb-3">Live Generated Preview</h2>

            {!generatedPreview && !isGenerating && (
              <div className="empty-state py-16 text-xs text-text-muted">
                Configure your parameters on the left and click Generate to preview syllabus questions.
              </div>
            )}

            {isGenerating && (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                <span className="spinner spinner-lg" />
                <p className="text-xs text-text-secondary">
                  Gemini AI is crafting syllabus-calibrated Physics questions and answer key...
                </p>
              </div>
            )}

            {generatedPreview && (
              <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2">
                <div className="p-3.5 rounded-lg bg-bg-subtle border border-border">
                  <div className="font-bold text-base text-text-primary">{generatedPreview.title}</div>
                  <div className="text-xs text-text-muted mt-1">
                    {generatedPreview.curriculum_level} • {generatedPreview.topic} • {generatedPreview.total_marks} Marks
                  </div>
                </div>

                <div className="text-xs text-text-secondary leading-relaxed">
                  <strong>Instructions:</strong> {generatedPreview.instructions}
                </div>

                {generatedPreview.sections?.map((section: any, idx: number) => (
                  <div key={idx} className="flex flex-col gap-2">
                    <h3 className="font-bold text-xs uppercase text-accent">{section.section_label}: {section.section_title}</h3>
                    {section.questions?.map((q: any) => (
                      <div key={q.number} className="p-3 rounded border border-border text-xs flex flex-col gap-1">
                        <div className="font-medium text-text-primary">
                          {q.number}. {q.question} <span className="text-text-muted font-mono">[{q.marks} marks]</span>
                        </div>
                        {q.options && (
                          <div className="grid grid-cols-2 gap-1 mt-1 pl-2 text-text-secondary">
                            {q.options.map((opt: string, i: number) => (
                              <span key={i}>{opt}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {generatedPreview && suggestionId && (
            <div className="pt-4 border-t border-border flex items-center justify-between mt-4">
              <span className="text-xs text-success font-medium flex items-center gap-1">
                <CheckCircle size={14} /> Added to Pending Suggestions
              </span>
              <Link href={`/suggestions/${suggestionId}`} className="btn btn-primary btn-sm">
                Review & Approve in Suggestions →
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
