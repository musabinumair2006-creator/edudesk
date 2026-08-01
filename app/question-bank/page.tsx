'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { QuestionCard } from '@/components/question-bank/QuestionCard'
import { QuestionFilters } from '@/components/question-bank/QuestionFilters'
import { useApp } from '@/context/AppContext'
import { supabase } from '@/lib/supabase'
import type { Question, QuestionType, Difficulty } from '@/lib/types'
import { Database, Upload, FilePlus, Sparkles } from 'lucide-react'

export default function QuestionBankPage() {
  const { activePaperQuestions, addQuestionToPaper, curriculumLevels } = useApp()

  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLevels, setSelectedLevels] = useState<string[]>([])
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([])
  const [selectedDifficulties, setSelectedDifficulties] = useState<Difficulty[]>([])
  const [minMarks, setMinMarks] = useState<number>(1)
  const [maxMarks, setMaxMarks] = useState<number>(20)
  const [hasDiagramOnly, setHasDiagramOnly] = useState<boolean>(false)
  const [sortOrder, setSortOrder] = useState<string>('relevance')

  // Similar Question Modal state
  const [similarSourceQuestion, setSimilarSourceQuestion] = useState<Question | null>(null)
  const [similarQuestions, setSimilarQuestions] = useState<any[]>([])
  const [isGeneratingSimilar, setIsGeneratingSimilar] = useState(false)

  useEffect(() => {
    loadQuestions()
  }, [])

  async function loadQuestions() {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*, source:paper_sources(title), curriculum_level:curriculum_levels(name)')
        .order('created_at', { ascending: false })

      if (!error && data && data.length > 0) {
        setQuestions(data as Question[])
      } else {
        // Fallback demo questions if DB has not been indexed yet
        setQuestions([
          {
            id: 'q-1',
            teacher_id: 'demo',
            topic: 'Electromagnetic Induction',
            subtopic: 'Faraday & Lenz Laws',
            question_number: 'Q3(b)',
            question_text: 'A flat circular coil of 150 turns and radius 4.0 cm is placed in a uniform magnetic field of 0.25 T. The magnetic field drops to zero in 0.05 s. Calculate the magnitude of the induced electromotive force (e.m.f.) across the coil.',
            question_type: 'calculation',
            marks: 4,
            difficulty: 'standard',
            year: 2023,
            has_diagram: false,
            answer: 'e.m.f. = -N(dΦ/dt). Area A = πr² = 5.03 × 10⁻³ m². Initial flux linkage = 150 × 0.25 × A = 0.188 Wb-turns. e.m.f. = 0.188 / 0.05 = 3.76 V.',
            created_at: new Date().toISOString(),
          },
          {
            id: 'q-2',
            teacher_id: 'demo',
            topic: 'Kinematics',
            subtopic: 'Projectile Motion',
            question_number: 'Q1(a)',
            question_text: 'A projectile is launched from ground level at an angle of 35° to the horizontal with an initial velocity of 22 m/s. Neglecting air resistance, determine the maximum height reached and the total horizontal range.',
            question_type: 'calculation',
            marks: 5,
            difficulty: 'standard',
            year: 2022,
            has_diagram: true,
            answer: 'Vertical initial velocity vy = 22 sin(35°) = 12.62 m/s. Max height H = vy² / (2g) = (12.62)² / 19.62 = 8.12 m. Total time t = 2vy / g = 2.57 s. Horizontal range R = vx × t = (22 cos 35°) × 2.57 = 46.3 m.',
            created_at: new Date().toISOString(),
          },
          {
            id: 'q-3',
            teacher_id: 'demo',
            topic: 'Quantum Physics',
            subtopic: 'Photoelectric Effect',
            question_number: 'Q5(c)(i)',
            question_text: 'Explain why the photoelectric effect provides conclusive evidence for the particulate nature of electromagnetic radiation rather than the wave theory of light. State two specific observations.',
            question_type: 'structured',
            marks: 3,
            difficulty: 'challenging',
            year: 2023,
            has_diagram: false,
            answer: '1. Instantaneous emission of photoelectrons with no time delay regardless of intensity. 2. Existence of a threshold frequency below which no emission occurs, regardless of intensity.',
            created_at: new Date().toISOString(),
          },
          {
            id: 'q-4',
            teacher_id: 'demo',
            topic: 'Waves',
            subtopic: 'Superposition & Interference',
            question_number: 'Q2',
            question_text: 'Two coherent monochromatic light sources of wavelength 632.8 nm create an interference pattern on a screen 1.8 m away. The slit separation is 0.25 mm. Calculate the fringe spacing observed on the screen.',
            question_type: 'calculation',
            marks: 3,
            difficulty: 'foundation',
            year: 2021,
            has_diagram: false,
            answer: 'Fringe spacing x = (λD) / a = (632.8 × 10⁻⁹ × 1.8) / (0.25 × 10⁻³) = 4.56 mm.',
            created_at: new Date().toISOString(),
          },
          {
            id: 'q-5',
            teacher_id: 'demo',
            topic: 'Forces and Newton\'s Laws',
            subtopic: 'Terminal Velocity',
            question_number: 'Q4(a)',
            question_text: 'Describe and explain the variation with time of the acceleration of a skydiver falling from rest before opening their parachute. Mention drag force, weight, and terminal velocity.',
            question_type: 'essay',
            marks: 4,
            difficulty: 'standard',
            year: 2022,
            has_diagram: true,
            answer: 'At t=0, air resistance is zero, acceleration equals g (9.81 m/s²). As speed increases, drag force increases. Resultant force (Weight - Drag) decreases, so acceleration decreases. When Drag equals Weight, acceleration becomes zero and terminal velocity is reached.',
            created_at: new Date().toISOString(),
          },
        ])
      }
    } catch (err) {
      console.warn('Questions fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Filtered and Sorted Questions list
  const filteredQuestions = useMemo(() => {
    let result = [...questions]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (item) =>
          item.question_text.toLowerCase().includes(q) ||
          item.topic.toLowerCase().includes(q) ||
          (item.question_number && item.question_number.toLowerCase().includes(q))
      )
    }

    if (selectedTopics.length > 0) {
      result = result.filter((item) => selectedTopics.includes(item.topic))
    }

    if (selectedTypes.length > 0) {
      result = result.filter((item) => selectedTypes.includes(item.question_type))
    }

    if (selectedDifficulties.length > 0) {
      result = result.filter((item) => item.difficulty && selectedDifficulties.includes(item.difficulty))
    }

    if (hasDiagramOnly) {
      result = result.filter((item) => item.has_diagram)
    }

    result = result.filter((item) => item.marks >= minMarks && item.marks <= maxMarks)

    if (sortOrder === 'marks-asc') {
      result.sort((a, b) => a.marks - b.marks)
    } else if (sortOrder === 'marks-desc') {
      result.sort((a, b) => b.marks - a.marks)
    } else if (sortOrder === 'year-desc') {
      result.sort((a, b) => (b.year || 0) - (a.year || 0))
    }

    return result
  }, [questions, searchQuery, selectedTopics, selectedTypes, selectedDifficulties, minMarks, maxMarks, hasDiagramOnly, sortOrder])

  // Extract distinct topics for sidebar filter
  const allTopics = useMemo(() => {
    const set = new Set<string>()
    questions.forEach((q) => set.add(q.topic))
    return Array.from(set).sort()
  }, [questions])

  async function handleGenerateSimilar(q: Question) {
    setSimilarSourceQuestion(q)
    setIsGeneratingSimilar(true)
    setSimilarQuestions([])

    try {
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'similar',
          source_question_id: q.id,
          questionText: q.question_text,
          marks: q.marks,
          topic: q.topic,
          curriculum_level: q.curriculum_level?.name || 'A-Level Physics',
          count: 2,
        }),
      })

      const data = await res.json()
      if (data.questions) {
        setSimilarQuestions(data.questions)
      }
    } catch (err) {
      console.warn('Generate similar error:', err)
    } finally {
      setIsGeneratingSimilar(false)
    }
  }

  function clearAllFilters() {
    setSearchQuery('')
    setSelectedLevels([])
    setSelectedTopics([])
    setSelectedTypes([])
    setSelectedDifficulties([])
    setMinMarks(1)
    setMaxMarks(20)
    setHasDiagramOnly(false)
    setSortOrder('relevance')
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Page Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">Physics Question Bank</h1>
              <span className="badge badge-primary font-mono-numbers">{filteredQuestions.length} Questions</span>
            </div>
            <p className="text-xs text-text-muted mt-1 font-medium">
              Search, filter, and add real past paper questions directly into your exam papers
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/question-bank/upload" className="btn btn-outline text-xs">
              <Upload size={14} /> Upload Past Paper
            </Link>
            <Link href="/papers/create" className="btn btn-primary text-xs">
              <FilePlus size={14} /> Paper Builder ({activePaperQuestions.length})
            </Link>
          </div>
        </div>

        {/* Main 2-Column Search Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar Filters (1 col) */}
          <div className="lg:col-span-1">
            <QuestionFilters
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedTopics={selectedTopics}
              setSelectedTopics={setSelectedTopics}
              allTopics={allTopics}
              selectedTypes={selectedTypes}
              setSelectedTypes={setSelectedTypes}
              selectedDifficulties={selectedDifficulties}
              setSelectedDifficulties={setSelectedDifficulties}
              minMarks={minMarks}
              setMinMarks={setMinMarks}
              maxMarks={maxMarks}
              setMaxMarks={setMaxMarks}
              hasDiagramOnly={hasDiagramOnly}
              setHasDiagramOnly={setHasDiagramOnly}
              onClearFilters={clearAllFilters}
            />
          </div>

          {/* Right Question Results Grid (3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {/* Sort & Counter Bar */}
            <div className="flex items-center justify-between p-3 bg-white border border-border rounded-lg text-xs">
              <span className="text-text-secondary font-medium">
                Showing <strong className="text-text-primary font-mono-numbers">{filteredQuestions.length}</strong> of{' '}
                <strong className="text-text-primary font-mono-numbers">{questions.length}</strong> questions
              </span>

              <div className="flex items-center gap-2">
                <span className="text-text-muted font-medium">Sort:</span>
                <select
                  className="form-input text-xs py-1 px-2 border-border"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="relevance">Relevance</option>
                  <option value="marks-asc">Marks (Low to High)</option>
                  <option value="marks-desc">Marks (High to Low)</option>
                  <option value="year-desc">Year (Newest First)</option>
                </select>
              </div>
            </div>

            {/* Questions List */}
            {isLoading ? (
              <div className="p-12 text-center text-xs text-text-muted">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading question bank...
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="card p-12 text-center text-xs text-text-muted bg-bg-subtle border border-border">
                <Database size={32} className="mx-auto mb-3 text-text-muted" />
                <p className="font-semibold text-text-primary text-sm mb-1">No questions match your current filters</p>
                <p className="text-text-muted max-w-sm mx-auto mb-4">Try clearing filters or search query to view all available questions.</p>
                <button type="button" className="btn btn-outline py-1.5 px-3 mx-auto" onClick={clearAllFilters}>
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredQuestions.map((q) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    isAdded={activePaperQuestions.some((item) => item.id === q.id)}
                    onAddToPaper={() => addQuestionToPaper(q)}
                    onGenerateSimilar={() => handleGenerateSimilar(q)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Similar Question Generator Modal */}
      {similarSourceQuestion && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-border flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-accent" />
                <h3 className="font-bold text-base text-text-primary">AI Similar Question Generator</h3>
              </div>
              <button
                type="button"
                className="text-text-muted hover:text-text-primary text-sm font-bold p-1"
                onClick={() => setSimilarSourceQuestion(null)}
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-bg-subtle rounded-lg border border-border text-xs">
              <span className="font-semibold text-text-muted block mb-1">ORIGINAL QUESTION ({similarSourceQuestion.marks} Marks):</span>
              <p className="text-text-primary">{similarSourceQuestion.question_text}</p>
            </div>

            {isGeneratingSimilar ? (
              <div className="p-8 text-center text-xs text-accent flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <span>AI is writing similar exam-style questions (~5 seconds)...</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">AI Generated Variations:</span>
                {similarQuestions.map((sq, i) => (
                  <div key={i} className="p-4 rounded-lg border border-accent/30 bg-accent-light/20 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="badge badge-primary text-[10px]">Variation {i + 1}</span>
                      <span className="font-mono-numbers text-xs font-bold text-accent">[{sq.marks} Marks]</span>
                    </div>
                    <p className="text-xs text-text-primary font-medium">{sq.question_text}</p>
                    {sq.answer && (
                      <div className="p-2 bg-success-light rounded text-[11px] text-success border border-success/20">
                        <strong>Solution:</strong> {sq.answer}
                      </div>
                    )}
                    <button
                      type="button"
                      className="btn btn-primary py-1 px-3 text-xs w-fit mt-1"
                      onClick={() => {
                        addQuestionToPaper({
                          id: `ai-sim-${Date.now()}-${i}`,
                          teacher_id: 'demo',
                          topic: sq.topic || similarSourceQuestion.topic,
                          question_text: sq.question_text,
                          question_type: sq.question_type || 'structured',
                          marks: sq.marks || similarSourceQuestion.marks,
                          has_diagram: false,
                          answer: sq.answer,
                          created_at: new Date().toISOString(),
                        })
                        setSimilarSourceQuestion(null)
                      }}
                    >
                      + Add Variation to Paper Builder
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  )
}
