'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Question, PaperQuestion } from '@/lib/types'
import { Search, Plus, Database } from 'lucide-react'

export function QuestionSelector({
  onAddQuestion,
}: {
  onAddQuestion: (q: PaperQuestion) => void
}) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadBankQuestions()
  }, [])

  async function loadBankQuestions() {
    setIsLoading(true)
    try {
      const { data } = await supabase.from('questions').select('*').order('created_at', { ascending: false })
      if (data && data.length > 0) {
        setQuestions(data as Question[])
      } else {
        // Fallback bank questions
        setQuestions([
          {
            id: 'q-pull-1',
            teacher_id: 'd',
            topic: 'Kinematics',
            question_number: 'Q1',
            question_text: 'A car accelerates uniformly from 12 m/s to 28 m/s over a distance of 160 m. Calculate the acceleration.',
            question_type: 'calculation',
            marks: 3,
            difficulty: 'standard',
            year: 2023,
            has_diagram: false,
            answer: 'v² = u² + 2as => 28² = 12² + 2a(160) => 784 = 144 + 320a => a = 2.0 m/s².',
            created_at: '',
          },
          {
            id: 'q-pull-2',
            teacher_id: 'd',
            topic: 'Electricity',
            question_number: 'Q3',
            question_text: 'State Kirchhoff first and second circuit laws and state the conservation principles they represent.',
            question_type: 'structured',
            marks: 4,
            difficulty: 'standard',
            year: 2022,
            has_diagram: false,
            answer: '1st law: Sum of currents into junction = sum of currents out (conservation of charge). 2nd law: Sum of e.m.f.s = sum of p.d.s in closed loop (conservation of energy).',
            created_at: '',
          },
          {
            id: 'q-pull-3',
            teacher_id: 'd',
            topic: 'Electromagnetic Induction',
            question_number: 'Q5',
            question_text: 'A transformer has 400 turns on primary coil and 80 turns on secondary. Calculate secondary current when primary current is 1.5 A.',
            question_type: 'calculation',
            marks: 3,
            difficulty: 'standard',
            year: 2023,
            has_diagram: false,
            answer: 'Ip / Is = Ns / Np => Is = Ip × (Np / Ns) = 1.5 × (400 / 80) = 7.5 A.',
            created_at: '',
          },
        ])
      }
    } catch (err) {
      console.warn('Bank fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const topicsList = Array.from(new Set(questions.map((q) => q.topic)))

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.question_text.toLowerCase().includes(searchQuery.toLowerCase().trim())
    const matchesTopic = selectedTopic === 'all' || q.topic === selectedTopic
    return matchesSearch && matchesTopic
  })

  return (
    <div className="card bg-white p-5 flex flex-col gap-4 border border-border">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <h3 className="font-bold text-sm text-text-primary uppercase tracking-wider flex items-center gap-2">
          <Database size={16} className="text-accent" />
          Pull Questions from Bank
        </h3>
        <span className="text-xs text-text-muted font-mono-numbers">{filteredQuestions.length} Available</span>
      </div>

      {/* Compact Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2.5 top-2.5 text-text-muted" />
          <input
            type="text"
            className="form-input text-xs pl-8 py-1.5"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="form-input text-xs py-1.5 w-full sm:w-44"
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
        >
          <option value="all">All Topics</option>
          {topicsList.map((t, idx) => (
            <option key={idx} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Questions list */}
      <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-text-muted">Loading question bank...</div>
        ) : filteredQuestions.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-muted bg-bg-subtle rounded border border-border">
            No questions match current search.
          </div>
        ) : (
          filteredQuestions.map((q) => (
            <div
              key={q.id}
              className="p-3.5 rounded-lg border border-border bg-bg-base hover:border-accent/40 transition-all flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="badge badge-primary text-[10px]">{q.topic}</span>
                <span className="font-mono-numbers font-bold text-xs text-text-primary">[{q.marks} Marks]</span>
              </div>
              <p className="text-xs text-text-primary font-medium">{q.question_text}</p>
              <button
                type="button"
                className="btn btn-primary py-1 px-3 text-xs w-fit mt-1 self-end"
                onClick={() =>
                  onAddQuestion({
                    question_id: q.id,
                    question_text: q.question_text,
                    marks: q.marks,
                    order_index: 1,
                    is_ai_generated: false,
                    answer: q.answer,
                    topic: q.topic,
                    question_type: q.question_type,
                  })
                }
              >
                <Plus size={12} /> Add to Paper
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
