'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { QuestionSelector } from './QuestionSelector'
import { AIGeneratePanel } from './AIGeneratePanel'
import { PaperPreview } from './PaperPreview'
import type { Class, CurriculumLevel, PaperType, CreationMode, PaperQuestion, PaperSection } from '@/lib/types'
import { Save, FileCheck, Eye, Layers } from 'lucide-react'

export function PaperBuilder({
  classes,
  curriculumLevels,
}: {
  classes: Class[]
  curriculumLevels: CurriculumLevel[]
}) {
  const router = useRouter()
  const { activePaperQuestions, clearActivePaper } = useApp()

  // Left Panel State
  const [paperTitle, setPaperTitle] = useState('IGCSE Physics Midterm Examination 2025')
  const [paperType, setPaperType] = useState<PaperType>('midterm')
  const [curriculumLevelId, setCurriculumLevelId] = useState('')
  const [classId, setClassId] = useState('')
  const [timeAllowed, setTimeAllowed] = useState('1 Hour 30 Minutes')
  const [instructions, setInstructions] = useState(
    'Answer all questions. Write your answers clearly. Show all working for calculation questions. Take g = 9.81 m/s².'
  )
  const [creationMode, setCreationMode] = useState<CreationMode>('mixed')

  // Center/Right Panel Sections State
  const [sections, setSections] = useState<PaperSection[]>([
    {
      label: 'SECTION A — Core Questions',
      questions: [],
    },
  ])

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (curriculumLevels.length > 0 && !curriculumLevelId) {
      setCurriculumLevelId(curriculumLevels[0].id)
    }
  }, [curriculumLevels, curriculumLevelId])

  // Synchronize active questions from AppContext into Section A
  useEffect(() => {
    if (activePaperQuestions.length > 0) {
      const formatted: PaperQuestion[] = activePaperQuestions.map((q, idx) => ({
        question_id: q.id,
        question_text: q.question_text,
        marks: q.marks,
        order_index: idx + 1,
        is_ai_generated: Boolean((q as any).is_ai_generated),
        answer: q.answer,
        topic: q.topic,
        question_type: q.question_type,
        question_number: q.question_number,
      }))

      setSections((prev) => [
        {
          label: prev[0]?.label || 'SECTION A — Core Questions',
          questions: formatted,
        },
        ...prev.slice(1),
      ])
    }
  }, [activePaperQuestions])

  // Total marks calculation
  const totalMarks = sections.reduce(
    (acc, sec) => acc + sec.questions.reduce((sum, q) => sum + (q.marks || 0), 0),
    0
  )

  function handleAddQuestionToBuilder(q: PaperQuestion) {
    setSections((prev) => {
      const firstSec = prev[0] || { label: 'SECTION A — Core Questions', questions: [] }
      const updatedQuestions = [...firstSec.questions, q]
      return [{ ...firstSec, questions: updatedQuestions }, ...prev.slice(1)]
    })
  }

  function handleRemoveQuestion(secIndex: number, qIndex: number) {
    setSections((prev) => {
      const copy = [...prev]
      copy[secIndex].questions = copy[secIndex].questions.filter((_, i) => i !== qIndex)
      return copy
    })
  }

  function handleAddSection() {
    const nextChar = String.fromCharCode(65 + sections.length)
    setSections([...sections, { label: `SECTION ${nextChar} — Additional Topics`, questions: [] }])
  }

  async function handleSavePaper(status: 'draft' | 'final') {
    setIsSaving(true)
    try {
      const res = await fetch('/api/create-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: paperTitle.trim(),
          paper_type: paperType,
          curriculum_level_id: curriculumLevelId,
          class_id: classId || undefined,
          total_marks: totalMarks,
          time_allowed: timeAllowed,
          instructions,
          creation_mode: creationMode,
          sections,
          status,
        }),
      })

      const data = await res.json()
      if (data.paper_id) {
        clearActivePaper()
        router.push(`/papers/${data.paper_id}`)
      }
    } catch (err) {
      console.warn('Save paper error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT PANEL (3 cols): Paper Settings */}
      <div className="lg:col-span-3 card bg-white p-5 flex flex-col gap-4 border border-border">
        <h3 className="font-bold text-sm text-text-primary uppercase tracking-wider pb-2 border-b border-border">
          1. Paper Settings
        </h3>

        {/* Creation Mode Radio Selector */}
        <div className="form-group">
          <label className="form-label text-accent font-bold">Creation Mode</label>
          <div className="flex flex-col gap-2">
            {[
              { id: 'pull', label: 'Pull from Bank', desc: 'Select real past paper questions' },
              { id: 'generate', label: 'AI Generate', desc: 'Generate new exam questions' },
              { id: 'mixed', label: 'Mixed Mode', desc: 'Combine bank & AI questions' },
            ].map((m) => (
              <label
                key={m.id}
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  creationMode === m.id
                    ? 'border-accent bg-accent-light/50 text-accent font-bold'
                    : 'border-border bg-white text-text-secondary hover:bg-bg-subtle'
                }`}
              >
                <input
                  type="radio"
                  name="creation_mode"
                  checked={creationMode === m.id}
                  onChange={() => setCreationMode(m.id as CreationMode)}
                  className="mt-0.5"
                />
                <div className="text-xs">
                  <div className="font-semibold">{m.label}</div>
                  <div className="text-[10px] text-text-muted font-normal">{m.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Paper Title *</label>
          <input
            type="text"
            className="form-input"
            value={paperTitle}
            onChange={(e) => setPaperTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Paper Type</label>
          <select
            className="form-input text-xs"
            value={paperType}
            onChange={(e) => setPaperType(e.target.value as PaperType)}
          >
            <option value="assignment">Assignment</option>
            <option value="quiz">Quiz</option>
            <option value="classwork">Classwork</option>
            <option value="midterm">Mid-Term Exam</option>
            <option value="finalterm">Final Term Exam</option>
            <option value="practice">Practice Paper</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Curriculum Level</label>
          <select
            className="form-input text-xs"
            value={curriculumLevelId}
            onChange={(e) => setCurriculumLevelId(e.target.value)}
          >
            {curriculumLevels.map((lvl) => (
              <option key={lvl.id} value={lvl.id}>
                {lvl.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Assign to Class</label>
          <select className="form-input text-xs" value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">No specific class</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Total Marks (Auto)</label>
          <input
            type="number"
            className="form-input font-mono-numbers bg-bg-subtle font-bold text-accent"
            value={totalMarks}
            readOnly
          />
        </div>

        <div className="form-group">
          <label className="form-label">Time Allowed</label>
          <input
            type="text"
            className="form-input text-xs"
            value={timeAllowed}
            onChange={(e) => setTimeAllowed(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Instructions to Candidates</label>
          <textarea
            className="form-input text-xs h-20"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
        </div>
      </div>

      {/* CENTER PANEL (5 cols): Question Builder (changes by mode) */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        {creationMode === 'pull' && (
          <QuestionSelector onAddQuestion={(q) => handleAddQuestionToBuilder(q)} />
        )}

        {creationMode === 'generate' && (
          <AIGeneratePanel onAddGeneratedQuestions={(qs) => qs.forEach(handleAddQuestionToBuilder)} />
        )}

        {creationMode === 'mixed' && (
          <div className="flex flex-col gap-6">
            <AIGeneratePanel onAddGeneratedQuestions={(qs) => qs.forEach(handleAddQuestionToBuilder)} />
            <QuestionSelector onAddQuestion={(q) => handleAddQuestionToBuilder(q)} />
          </div>
        )}
      </div>

      {/* RIGHT PANEL (4 cols): Live Paper Structure Preview */}
      <div className="lg:col-span-4 card bg-white p-5 flex flex-col gap-4 border border-border sticky top-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h3 className="font-bold text-sm text-text-primary uppercase tracking-wider">3. Paper Structure</h3>
            <p className="text-[11px] text-text-muted">Live question sequence</p>
          </div>
          <span className="badge badge-primary font-mono-numbers text-xs font-bold">{totalMarks} Marks</span>
        </div>

        <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-1">
          {sections.map((sec, secIdx) => (
            <div key={secIdx} className="flex flex-col gap-2 p-3 rounded-lg bg-bg-subtle border border-border">
              <div className="flex items-center justify-between font-bold text-xs text-text-primary">
                <input
                  type="text"
                  className="bg-transparent border-none p-0 focus:outline-none w-full font-bold"
                  value={sec.label}
                  onChange={(e) => {
                    const val = e.target.value
                    setSections((prev) => {
                      const copy = [...prev]
                      copy[secIdx].label = val
                      return copy
                    })
                  }}
                />
              </div>

              {sec.questions.length === 0 ? (
                <div className="text-[11px] text-text-muted p-3 text-center border border-dashed border-border rounded bg-white">
                  No questions in this section yet. Pull from bank or generate with AI.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {sec.questions.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      className="p-2.5 rounded border border-border bg-white text-xs flex flex-col gap-1 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-text-primary">Q{qIdx + 1}</span>
                        <div className="flex items-center gap-2">
                          <span className="badge badge-primary font-mono-numbers text-[10px]">
                            [{q.marks} Marks]
                          </span>
                          <button
                            type="button"
                            className="text-text-muted hover:text-danger text-xs font-bold"
                            onClick={() => handleRemoveQuestion(secIdx, qIdx)}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <p className="text-text-secondary text-[11px] line-clamp-2">{q.question_text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          className="btn btn-outline text-xs justify-center py-1.5"
          onClick={handleAddSection}
        >
          <Layers size={14} /> Add Section Break
        </button>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-3 border-t border-border mt-2">
          <button
            type="button"
            className="btn btn-secondary text-xs justify-center py-2"
            onClick={() => setIsPreviewModalOpen(true)}
          >
            <Eye size={14} /> Preview & Print Layout
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-outline text-xs flex-1 justify-center py-2"
              onClick={() => handleSavePaper('draft')}
              disabled={isSaving}
            >
              <Save size={14} /> Save Draft
            </button>
            <button
              type="button"
              className="btn btn-primary text-xs flex-1 justify-center py-2 shadow-sm"
              onClick={() => handleSavePaper('final')}
              disabled={isSaving || totalMarks === 0}
            >
              <FileCheck size={14} /> Finalise Paper
            </button>
          </div>
        </div>
      </div>

      {/* Print Preview Modal */}
      {isPreviewModalOpen && (
        <PaperPreview
          paper={{
            id: 'temp-preview',
            teacher_id: 'demo',
            title: paperTitle,
            paper_type: paperType,
            total_marks: totalMarks,
            time_allowed: timeAllowed,
            instructions,
            status: 'draft',
            creation_mode: creationMode,
            content: { sections },
            created_at: new Date().toISOString(),
          }}
          onClose={() => setIsPreviewModalOpen(false)}
        />
      )}
    </div>
  )
}
