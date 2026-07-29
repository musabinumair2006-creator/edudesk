'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { useApp } from '@/context/AppContext'
import { getCurriculumTopics } from '@/lib/ai/physics-curriculum'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Wand2, FileText, CheckSquare, Save } from 'lucide-react'

interface GeneratedPaper {
  title: string
  cover_page: {
    subject: string
    level: string
    paper_type: string
    total_marks: number
    time_allowed: string
    instructions: string[]
  }
  sections: Array<{
    label: string
    title: string
    instructions: string
    questions: Array<{
      number: number
      question: string
      marks: number
      options?: string[] | null
      sub_questions?: Array<{ label: string; question: string; marks: number }> | null
    }>
  }>
  mark_scheme: Array<{
    question_number: number
    section: string
    answer: string
    marks: number
    marking_points?: string[]
  }>
}

export default function GeneratePaperPage() {
  const { curriculumLevels } = useApp()
  const supabase = createClient()

  const [paperType, setPaperType] = useState<'midterm' | 'finalterm'>('midterm')
  const [level, setLevel] = useState('')
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [totalMarks, setTotalMarks] = useState(100)
  const [timeAllowed, setTimeAllowed] = useState('2 hours')
  const [numSections, setNumSections] = useState(3)
  const [instructions, setInstructions] = useState(
    'Answer all questions. Show all working for calculation questions. Use of approved calculator is permitted.'
  )

  const [availableTopics, setAvailableTopics] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [paper, setPaper] = useState<GeneratedPaper | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showMarkScheme, setShowMarkScheme] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (curriculumLevels.length > 0 && !level) {
      setLevel(curriculumLevels[0].name)
    }
  }, [curriculumLevels])

  useEffect(() => {
    const topics = getCurriculumTopics(level)
    setAvailableTopics(topics)
    setSelectedTopics([])
  }, [level])

  function toggleTopic(topic: string) {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    )
  }

  async function handleGenerate() {
    if (selectedTopics.length === 0) {
      setGenerateError('Please select at least one topic.')
      return
    }

    setIsGenerating(true)
    setGenerateError(null)
    setPaper(null)
    setProgress(0)

    // Simulate progress while waiting
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 3, 90))
    }, 1000)

    try {
      const res = await fetch('/api/ai/generate-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paper_type: paperType,
          curriculum_level: level,
          topics: selectedTopics,
          total_marks: totalMarks,
          time_allowed: timeAllowed,
          num_sections: numSections,
          instructions,
        }),
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Generation failed')
      }

      const data = await res.json()
      setPaper(data)
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Generation failed. Please try again.')
    } finally {
      clearInterval(progressInterval)
      setIsGenerating(false)
    }
  }

  async function handleSave() {
    if (!paper) return
    setIsSaving(true)

    const levelId = curriculumLevels.find((l) => l.name === level)?.id
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setIsSaving(false); return }

    const { error } = await supabase.from('papers').insert({
      teacher_id: user.id,
      title: paper.title,
      paper_type: paperType,
      curriculum_level_id: levelId || null,
      topics: selectedTopics,
      total_marks: totalMarks,
      time_allowed: timeAllowed,
      content: {
        cover_page: paper.cover_page,
        sections: paper.sections,
        mark_scheme: paper.mark_scheme,
      },
    })

    if (error) {
      setToast('Failed to save paper: ' + error.message)
    } else {
      setToast('Paper saved successfully!')
      setTimeout(() => setToast(null), 3000)
    }
    setIsSaving(false)
  }

  return (
    <AppShell>
      <Header
        title="Generate Exam Paper"
        subtitle="AI-powered exam paper generator"
        actions={
          <Link href="/papers" className="btn btn-ghost btn-sm">
            <ArrowLeft size={14} /> All Papers
          </Link>
        }
      />

      <div className="page-body flex flex-col gap-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Config Panel */}
          <div className="xl:col-span-1 flex flex-col gap-4">
            <div className="card">
              <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                PAPER SETTINGS
              </h3>
              <div className="flex flex-col gap-3">
                <div className="form-group">
                  <label className="form-label">Paper Type</label>
                  <div className="flex gap-2">
                    {[
                      { v: 'midterm', l: 'Mid-Term' },
                      { v: 'finalterm', l: 'Final Term' },
                    ].map((t) => (
                      <button
                        key={t.v}
                        className="btn flex-1"
                        style={{
                          justifyContent: 'center',
                          background: paperType === t.v ? 'var(--danger)' : 'var(--bg-subtle)',
                          color: paperType === t.v ? 'white' : 'var(--text-secondary)',
                          border: paperType === t.v ? '1px solid var(--danger)' : '1px solid var(--border-strong)',
                        }}
                        onClick={() => setPaperType(t.v as 'midterm' | 'finalterm')}
                      >
                        {t.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Curriculum Level</label>
                  <select
                    className="form-input form-select"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                  >
                    {curriculumLevels.map((l) => (
                      <option key={l.id} value={l.name}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Total Marks</label>
                    <input
                      type="number"
                      className="form-input"
                      value={totalMarks}
                      onChange={(e) => setTotalMarks(Number(e.target.value))}
                      min={20}
                      max={300}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sections</label>
                    <input
                      type="number"
                      className="form-input"
                      value={numSections}
                      onChange={(e) => setNumSections(Number(e.target.value))}
                      min={1}
                      max={4}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Time Allowed</label>
                  <input
                    type="text"
                    className="form-input"
                    value={timeAllowed}
                    onChange={(e) => setTimeAllowed(e.target.value)}
                    placeholder="e.g. 2 hours 30 minutes"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Instructions to Candidates</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Topic Selection */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Topics to Cover</h3>
                <div className="flex gap-1">
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '11px', color: 'var(--accent)' }}
                    onClick={() => setSelectedTopics(availableTopics)}
                  >
                    All
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '11px', color: 'var(--text-muted)' }}
                    onClick={() => setSelectedTopics([])}
                  >
                    None
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
                {availableTopics.map((topic) => (
                  <label
                    key={topic}
                    className="flex items-center gap-2 text-sm cursor-pointer p-1.5 rounded hover:bg-bg-subtle"
                    style={{ transition: 'background 0.1s' }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTopics.includes(topic)}
                      onChange={() => toggleTopic(topic)}
                    />
                    <span style={{ color: selectedTopics.includes(topic) ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {topic}
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-2 pt-2 text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                {selectedTopics.length} topic{selectedTopics.length !== 1 ? 's' : ''} selected
              </div>
            </div>

            <button
              className="btn btn-primary w-full btn-lg"
              style={{ justifyContent: 'center' }}
              onClick={handleGenerate}
              disabled={isGenerating || selectedTopics.length === 0}
            >
              {isGenerating ? (
                <>
                  <span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} />
                  Generating paper...
                </>
              ) : (
                <>
                  <Wand2 size={16} /> Generate Paper
                </>
              )}
            </button>

            {isGenerating && (
              <div>
                <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                  <span>Generating exam paper...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full rounded-full" style={{ height: '4px', background: 'var(--bg-subtle)' }}>
                  <div
                    className="rounded-full"
                    style={{ height: '4px', width: `${progress}%`, background: 'var(--accent)', transition: 'width 0.5s ease' }}
                  />
                </div>
              </div>
            )}

            {generateError && (
              <div
                className="p-3 rounded-md text-sm"
                style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid var(--danger)' }}
              >
                {generateError}
              </div>
            )}
          </div>

          {/* Paper Preview */}
          <div className="xl:col-span-2">
            {!paper ? (
              <div className="card">
                <div className="empty-state py-24">
                  <FileText size={56} style={{ color: 'var(--border-strong)' }} />
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Your exam paper will appear here
                    </p>
                    <p className="text-xs mt-1">Select topics and click &quot;Generate Paper&quot; to create your exam.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Actions */}
                <div className="flex gap-3 justify-end">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowMarkScheme(!showMarkScheme)}
                  >
                    <CheckSquare size={13} />
                    {showMarkScheme ? 'Hide' : 'Show'} Mark Scheme
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? <span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} /> : <Save size={13} />}
                    Save Paper
                  </button>
                </div>

                {/* Cover Page */}
                <div className="card" style={{ border: '2px solid var(--border-strong)' }}>
                  <div className="text-center mb-4 pb-4" style={{ borderBottom: '2px solid var(--border-strong)' }}>
                    <div className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                      {paper.cover_page.subject.toUpperCase()} — {paper.cover_page.level.toUpperCase()}
                    </div>
                    <h2 className="text-xl font-bold mb-1">{paper.title}</h2>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {paper.cover_page.paper_type} · Total Marks: {paper.cover_page.total_marks} · Time: {paper.cover_page.time_allowed}
                    </div>
                  </div>
                  <div>
                    <div className="label-sm mb-2">Instructions to Candidates</div>
                    <ol className="text-sm flex flex-col gap-1" style={{ paddingLeft: '1.25rem' }}>
                      {paper.cover_page.instructions.map((inst, i) => (
                        <li key={i} style={{ color: 'var(--text-secondary)' }}>{inst}</li>
                      ))}
                    </ol>
                  </div>
                </div>

                {/* Sections */}
                {paper.sections.map((section, si) => (
                  <div key={si} className="card">
                    <div
                      className="mb-4 pb-3"
                      style={{ borderBottom: '2px solid var(--border-strong)' }}
                    >
                      <h3 className="font-bold text-base">
                        {section.label}: {section.title}
                      </h3>
                      {section.instructions && (
                        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                          {section.instructions}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-4">
                      {section.questions.map((q) => (
                        <div key={q.number}>
                          <div className="flex items-start gap-2 mb-1">
                            <span className="font-semibold flex-shrink-0">{q.number}.</span>
                            <div className="flex-1">
                              <span>{q.question}</span>
                              {q.options && (
                                <div className="flex flex-col gap-1 mt-2 ml-2">
                                  {q.options.map((opt, oi) => (
                                    <div key={oi} className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                      {opt}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {q.sub_questions && (
                                <div className="flex flex-col gap-2 mt-2 ml-4">
                                  {q.sub_questions.map((sq, sqi) => (
                                    <div key={sqi} className="flex items-start gap-2">
                                      <span className="flex-shrink-0 font-medium text-sm">({sq.label})</span>
                                      <span className="text-sm">{sq.question}</span>
                                      <span
                                        className="ml-auto flex-shrink-0 text-xs font-mono"
                                        style={{ color: 'var(--text-muted)' }}
                                      >
                                        [{sq.marks}]
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            {!q.sub_questions && (
                              <span
                                className="flex-shrink-0 text-sm font-mono"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                [{q.marks}]
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Mark Scheme */}
                {showMarkScheme && paper.mark_scheme.length > 0 && (
                  <div
                    className="card"
                    style={{ border: '1px solid var(--warning)', background: 'var(--warning-light)' }}
                  >
                    <h3 className="font-bold text-base mb-4">Mark Scheme (Teacher Only)</h3>
                    <div className="flex flex-col gap-3">
                      {paper.mark_scheme.map((ms, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-md"
                          style={{ background: 'white', border: '1px solid var(--border)' }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">Q{ms.question_number}</span>
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{ms.section}</span>
                            <span className="ml-auto font-mono text-sm font-semibold">[{ms.marks} marks]</span>
                          </div>
                          <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{ms.answer}</p>
                          {ms.marking_points && ms.marking_points.length > 0 && (
                            <ul className="text-sm flex flex-col gap-0.5">
                              {ms.marking_points.map((pt, pi) => (
                                <li key={pi} className="flex items-start gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                                  <span style={{ color: 'var(--success)', flexShrink: 0 }}>✓</span> {pt}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && <div className="toast success">✓ {toast}</div>}
    </AppShell>
  )
}
