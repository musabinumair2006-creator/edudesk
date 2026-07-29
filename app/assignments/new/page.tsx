'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import AssignmentEditor from '@/components/assignments/AssignmentEditor'
import { useApp } from '@/context/AppContext'
import { getClasses } from '@/lib/supabase/queries/classes'
import { createAssignment } from '@/lib/supabase/queries/assignments'
import { PHYSICS_CURRICULUM, DIFFICULTY_LEVELS, getCurriculumTopics } from '@/lib/ai/physics-curriculum'
import type { Class } from '@/lib/types'
import { ArrowLeft, Zap, Wand2, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react'

interface AIQuestion {
  number: number
  type: string
  question: string
  marks: number
  options?: string[] | null
  answer: string
}

interface AIResult {
  title: string
  instructions: string
  questions: AIQuestion[]
  total_marks: number
  estimated_time: string
  answer_key: string
}

export default function NewAssignmentPage() {
  const router = useRouter()
  const { curriculumLevels } = useApp()

  const [mode, setMode] = useState<'manual' | 'ai'>('ai')
  const [classes, setClasses] = useState<Class[]>([])

  // Manual fields
  const [title, setTitle] = useState('')
  const [classId, setClassId] = useState('')
  const [topic, setTopic] = useState('')
  const [totalMarks, setTotalMarks] = useState(50)
  const [dueDate, setDueDate] = useState('')
  const [assignmentType, setAssignmentType] = useState('assignment')
  const [instructions, setInstructions] = useState('')

  // AI fields
  const [aiLevel, setAiLevel] = useState('')
  const [aiTopic, setAiTopic] = useState('')
  const [aiType, setAiType] = useState('assignment')
  const [aiNumQ, setAiNumQ] = useState(10)
  const [aiMarks, setAiMarks] = useState(50)
  const [aiDifficulty, setAiDifficulty] = useState('standard')
  const [aiTopics, setAiTopics] = useState<string[]>([])

  const [aiResult, setAiResult] = useState<AIResult | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [showAnswerKey, setShowAnswerKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    getClasses().then((data) => {
      setClasses(data)
      if (data.length > 0) setClassId(data[0].id)
    })
    if (curriculumLevels.length > 0) {
      setAiLevel(curriculumLevels[0].name)
    }
  }, [curriculumLevels])

  useEffect(() => {
    const topics = getCurriculumTopics(aiLevel)
    setAiTopics(topics)
    if (topics.length > 0) setAiTopic(topics[0])
  }, [aiLevel])

  async function handleGenerate() {
    setIsGenerating(true)
    setGenerateError(null)
    setAiResult(null)

    try {
      const res = await fetch('/api/ai/generate-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curriculum_level: aiLevel,
          topic: aiTopic,
          assignment_type: aiType,
          num_questions: aiNumQ,
          total_marks: aiMarks,
          difficulty: aiDifficulty,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Generation failed')
      }

      const data = await res.json()
      setAiResult(data)
      // Pre-fill for saving
      setTitle(data.title)
      setTopic(aiTopic)
      setTotalMarks(data.total_marks)
      setInstructions(data.instructions)
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'AI generation failed. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleSave() {
    if (!classId || !title) return
    setIsSaving(true)
    setSaveError(null)

    try {
      const levelId = curriculumLevels.find((l) => l.name === aiLevel)?.id

      // Build instructions HTML from AI result if available
      let finalInstructions = instructions
      if (mode === 'ai' && aiResult) {
        finalInstructions = aiResult.instructions + '\n\n' + aiResult.questions
          .map(
            (q) =>
              `<p><strong>Q${q.number}. [${q.marks} marks]</strong> ${q.question}${
                q.options ? '<br/>' + q.options.join('<br/>') : ''
              }</p>`
          )
          .join('\n')
      }

      const assignment = await createAssignment({
        class_id: classId,
        title,
        instructions: finalInstructions,
        topic: topic || undefined,
        curriculum_level_id: levelId,
        total_marks: totalMarks,
        due_date: dueDate || undefined,
        assignment_type: mode === 'ai' ? aiType : assignmentType,
        ai_generated: mode === 'ai',
        answer_key: aiResult?.answer_key || undefined,
      })

      router.push(`/assignments/${assignment.id}`)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save assignment')
      setIsSaving(false)
    }
  }

  return (
    <AppShell>
      <Header
        title="New Assignment"
        subtitle="Create manually or generate with AI"
        actions={
          <Link href="/assignments" className="btn btn-ghost btn-sm">
            <ArrowLeft size={14} /> Back
          </Link>
        }
      />

      <div className="page-body flex flex-col gap-6">
        {/* Mode Toggle */}
        <div className="card" style={{ padding: '0.75rem 1rem' }}>
          <div className="flex gap-2">
            <button
              className="btn flex-1"
              style={{
                justifyContent: 'center',
                background: mode === 'manual' ? 'var(--accent)' : 'var(--bg-subtle)',
                color: mode === 'manual' ? 'white' : 'var(--text-secondary)',
                border: mode === 'manual' ? '1px solid var(--accent)' : '1px solid var(--border-strong)',
              }}
              onClick={() => setMode('manual')}
            >
              Manual Creation
            </button>
            <button
              className="btn flex-1"
              style={{
                justifyContent: 'center',
                background: mode === 'ai' ? 'var(--accent)' : 'var(--bg-subtle)',
                color: mode === 'ai' ? 'white' : 'var(--text-secondary)',
                border: mode === 'ai' ? '1px solid var(--accent)' : '1px solid var(--border-strong)',
              }}
              onClick={() => setMode('ai')}
            >
              <Zap size={14} /> Generate with AI
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: Form */}
          <div className="xl:col-span-1 flex flex-col gap-4">
            {/* Class + Assignment Settings */}
            <div className="card">
              <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                ASSIGNMENT SETTINGS
              </h3>
              <div className="flex flex-col gap-3">
                <div className="form-group">
                  <label className="form-label">Assign to Class *</label>
                  <select
                    className="form-input form-select"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    required
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
                    type="datetime-local"
                    className="form-input"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* AI or Manual config */}
            {mode === 'ai' ? (
              <div
                className="card"
                style={{ border: '1px solid rgba(37,99,235,0.3)', background: 'var(--accent-light)' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={15} style={{ color: 'var(--accent)' }} />
                  <h3 className="font-semibold text-sm" style={{ color: 'var(--accent)' }}>
                    AI GENERATION SETTINGS
                  </h3>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="form-group">
                    <label className="form-label">Curriculum Level</label>
                    <select
                      className="form-input form-select"
                      value={aiLevel}
                      onChange={(e) => setAiLevel(e.target.value)}
                    >
                      {curriculumLevels.map((l) => (
                        <option key={l.id} value={l.name}>{l.name}</option>
                      ))}
                      {curriculumLevels.length === 0 &&
                        Object.keys(PHYSICS_CURRICULUM).map((k) => (
                          <option key={k} value={k}>{k}</option>
                        ))
                      }
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Topic</label>
                    <select
                      className="form-input form-select"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                    >
                      {aiTopics.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Assignment Type</label>
                    <select
                      className="form-input form-select"
                      value={aiType}
                      onChange={(e) => setAiType(e.target.value)}
                    >
                      {[
                        { v: 'assignment', l: 'Assignment' },
                        { v: 'quiz', l: 'Quiz' },
                        { v: 'classwork', l: 'Classwork' },
                      ].map((o) => (
                        <option key={o.v} value={o.v}>{o.l}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Questions</label>
                      <input
                        type="number"
                        className="form-input"
                        min={1}
                        max={30}
                        value={aiNumQ}
                        onChange={(e) => setAiNumQ(Number(e.target.value))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Total Marks</label>
                      <input
                        type="number"
                        className="form-input"
                        min={1}
                        value={aiMarks}
                        onChange={(e) => setAiMarks(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Difficulty</label>
                    <div className="flex flex-col gap-2">
                      {DIFFICULTY_LEVELS.map((d) => (
                        <label
                          key={d.value}
                          className="flex items-start gap-2 cursor-pointer p-2 rounded-md"
                          style={{
                            background: aiDifficulty === d.value ? 'white' : 'transparent',
                            border: aiDifficulty === d.value ? '1px solid var(--accent)' : '1px solid transparent',
                          }}
                        >
                          <input
                            type="radio"
                            value={d.value}
                            checked={aiDifficulty === d.value}
                            onChange={() => setAiDifficulty(d.value)}
                            className="mt-0.5"
                          />
                          <div>
                            <div className="text-sm font-medium">{d.label}</div>
                            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {d.description}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    className="btn btn-primary w-full"
                    style={{ justifyContent: 'center' }}
                    onClick={handleGenerate}
                    disabled={isGenerating || !aiLevel || !aiTopic}
                  >
                    {isGenerating ? (
                      <>
                        <span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 size={15} /> Generate Assignment
                      </>
                    )}
                  </button>

                  {generateError && (
                    <div
                      className="p-2 rounded-md text-sm"
                      style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid var(--danger)' }}
                    >
                      {generateError}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card">
                <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                  ASSIGNMENT DETAILS
                </h3>
                <div className="flex flex-col gap-3">
                  <div className="form-group">
                    <label className="form-label">Title *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Assignment title"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Topic</label>
                    <input
                      type="text"
                      className="form-input"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. Waves and Optics"
                    />
                  </div>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Type</label>
                      <select
                        className="form-input form-select"
                        value={assignmentType}
                        onChange={(e) => setAssignmentType(e.target.value)}
                      >
                        {[
                          { v: 'assignment', l: 'Assignment' },
                          { v: 'quiz', l: 'Quiz' },
                          { v: 'classwork', l: 'Classwork' },
                          { v: 'midterm', l: 'Mid-Term' },
                          { v: 'finalterm', l: 'Final Term' },
                        ].map((o) => (
                          <option key={o.v} value={o.v}>{o.l}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Total Marks</label>
                      <input
                        type="number"
                        className="form-input"
                        value={totalMarks}
                        onChange={(e) => setTotalMarks(Number(e.target.value))}
                        min={1}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Editor / AI Result */}
          <div className="xl:col-span-2 flex flex-col gap-4">
            {mode === 'ai' && aiResult ? (
              <>
                {/* Generated Assignment Preview */}
                <div className="card">
                  <div className="card-header">
                    <div>
                      <h3 className="font-semibold">{aiResult.title}</h3>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {aiResult.total_marks} marks · {aiResult.estimated_time}
                      </div>
                    </div>
                  </div>

                  {/* Questions */}
                  <div className="flex flex-col gap-4">
                    {aiResult.questions.map((q) => (
                      <div
                        key={q.number}
                        className="p-3 rounded-md"
                        style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}
                      >
                        <div className="flex items-start gap-2 mb-1">
                          <span className="font-semibold text-sm flex-shrink-0">Q{q.number}.</span>
                          <span
                            className="badge flex-shrink-0"
                            style={{ background: 'var(--accent-light)', color: 'var(--accent)', fontSize: '11px' }}
                          >
                            {q.type}
                          </span>
                          <span
                            className="badge flex-shrink-0 font-mono"
                            style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)', fontSize: '11px', border: '1px solid var(--border)' }}
                          >
                            {q.marks} mk{q.marks !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className="text-sm" style={{ marginLeft: '1.25rem' }}>{q.question}</p>
                        {q.options && (
                          <ul className="mt-2 text-sm flex flex-col gap-1" style={{ marginLeft: '1.25rem' }}>
                            {q.options.map((opt, i) => (
                              <li key={i} style={{ color: 'var(--text-secondary)' }}>{opt}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Answer Key Toggle */}
                  <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setShowAnswerKey(!showAnswerKey)}
                      style={{ color: 'var(--warning)' }}
                    >
                      {showAnswerKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      {showAnswerKey ? 'Hide' : 'Show'} Answer Key
                    </button>
                    {showAnswerKey && (
                      <div
                        className="mt-3 p-3 rounded-md text-sm"
                        style={{ background: 'var(--warning-light)', border: '1px solid var(--warning)', whiteSpace: 'pre-wrap' }}
                        dangerouslySetInnerHTML={{ __html: aiResult.answer_key || '' }}
                      />
                    )}
                  </div>
                </div>

                {/* Save */}
                {saveError && (
                  <div
                    className="p-3 rounded-md text-sm"
                    style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid var(--danger)' }}
                  >
                    {saveError}
                  </div>
                )}
                <div className="flex gap-3 justify-end">
                  <button className="btn btn-secondary" onClick={() => setAiResult(null)}>
                    Regenerate
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={isSaving || !classId}
                  >
                    {isSaving ? (
                      <>
                        <span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} />
                        Saving...
                      </>
                    ) : (
                      'Save Assignment'
                    )}
                  </button>
                </div>
              </>
            ) : mode === 'ai' ? (
              <div className="card">
                <div className="empty-state py-16">
                  <Wand2 size={48} style={{ color: 'var(--border-strong)' }} />
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Configure and generate
                    </p>
                    <p className="text-xs mt-1">
                      Fill in the settings on the left and click &quot;Generate Assignment&quot;.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // Manual mode editor
              <div className="card">
                <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                  ASSIGNMENT INSTRUCTIONS & QUESTIONS
                </h3>
                <AssignmentEditor
                  content={instructions}
                  onChange={setInstructions}
                  placeholder="Write instructions, questions, and any required information here..."
                  minHeight={400}
                />

                {saveError && (
                  <div
                    className="mt-4 p-3 rounded-md text-sm"
                    style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid var(--danger)' }}
                  >
                    {saveError}
                  </div>
                )}

                <div className="flex gap-3 justify-end mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                  <Link href="/assignments" className="btn btn-secondary">Cancel</Link>
                  <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={isSaving || !classId || !title}
                  >
                    {isSaving ? (
                      <>
                        <span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} />
                        Saving...
                      </>
                    ) : (
                      'Save Assignment'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
