'use client'

import { useState } from 'react'
import type { PaperQuestion } from '@/lib/types'
import { Sparkles, Plus, RefreshCw, Check } from 'lucide-react'

export function AIGeneratePanel({
  onAddGeneratedQuestions,
}: {
  onAddGeneratedQuestions: (qs: PaperQuestion[]) => void
}) {
  const [numQuestions, setNumQuestions] = useState(3)
  const [totalMarks, setTotalMarks] = useState(15)
  const [difficulty, setDifficulty] = useState<'foundation' | 'standard' | 'challenging'>('standard')
  const [selectedTopic, setSelectedTopic] = useState('Electromagnetic Induction & Faraday Laws')

  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedItems, setGeneratedItems] = useState<PaperQuestion[]>([])

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setIsGenerating(true)
    setGeneratedItems([])

    try {
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'new',
          num_questions: numQuestions,
          total_marks: totalMarks,
          difficulty,
          topics: [selectedTopic],
          question_types: ['structured', 'calculation'],
        }),
      })

      const data = await res.json()

      if (data.questions && Array.isArray(data.questions)) {
        const formatted: PaperQuestion[] = data.questions.map((q: any, i: number) => ({
          question_text: q.question_text,
          marks: q.marks || 4,
          order_index: i + 1,
          is_ai_generated: true,
          answer: q.answer,
          topic: q.topic || selectedTopic,
        }))
        setGeneratedItems(formatted)
      }
    } catch (err) {
      console.warn('AI Generate error:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  function handleAddAll() {
    onAddGeneratedQuestions(generatedItems)
    setGeneratedItems([])
  }

  return (
    <div className="card bg-white p-5 flex flex-col gap-4 border border-border">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <h3 className="font-bold text-sm text-text-primary uppercase tracking-wider flex items-center gap-2">
          <Sparkles size={16} className="text-accent" />
          AI Past Paper Question Generator
        </h3>
        <span className="badge badge-primary text-[10px]">Gemini 1.5 Flash</span>
      </div>

      <form onSubmit={handleGenerate} className="flex flex-col gap-3">
        <div className="form-group">
          <label className="form-label">Physics Syllabus Topic</label>
          <input
            type="text"
            className="form-input text-xs"
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            placeholder="e.g. Electromagnetic Induction, Kinematics, Waves"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="form-group">
            <label className="form-label">Questions Count</label>
            <input
              type="number"
              className="form-input text-xs font-mono-numbers"
              min={1}
              max={10}
              value={numQuestions}
              onChange={(e) => setNumQuestions(parseInt(e.target.value, 10) || 1)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Target Total Marks</label>
            <input
              type="number"
              className="form-input text-xs font-mono-numbers"
              min={2}
              max={50}
              value={totalMarks}
              onChange={(e) => setTotalMarks(parseInt(e.target.value, 10) || 2)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Difficulty Level</label>
          <div className="flex gap-2">
            {(['foundation', 'standard', 'challenging'] as const).map((d) => (
              <button
                key={d}
                type="button"
                className={`flex-1 py-1.5 text-xs font-semibold rounded border capitalize transition-all ${
                  difficulty === d
                    ? 'bg-accent text-white border-accent'
                    : 'bg-bg-subtle text-text-secondary border-border hover:bg-border'
                }`}
                onClick={() => setDifficulty(d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary text-xs justify-center py-2 shadow-sm mt-1"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating Physics Questions... (~15s)
            </>
          ) : (
            <>
              <Sparkles size={14} /> Generate {numQuestions} Questions with AI
            </>
          )}
        </button>
      </form>

      {/* Generated Questions Review List */}
      {generatedItems.length > 0 && (
        <div className="flex flex-col gap-3 pt-3 border-t border-border mt-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-text-primary">AI Generated Drafts ({generatedItems.length})</span>
            <button
              type="button"
              className="btn btn-primary py-1 px-3 text-xs"
              onClick={handleAddAll}
            >
              <Check size={12} /> Add All to Paper Builder
            </button>
          </div>

          {generatedItems.map((item, idx) => (
            <div key={idx} className="p-3 rounded-lg border border-accent/30 bg-accent-light/20 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="badge badge-primary text-[10px]">AI Draft Q{idx + 1}</span>
                <span className="font-mono-numbers font-bold text-xs text-accent">[{item.marks} Marks]</span>
              </div>
              <textarea
                className="form-input text-xs h-16 bg-white border-border"
                value={item.question_text}
                onChange={(e) => {
                  const val = e.target.value
                  setGeneratedItems((prev) => {
                    const copy = [...prev]
                    copy[idx].question_text = val
                    return copy
                  })
                }}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="btn btn-secondary py-1 px-2.5 text-[11px]"
                  onClick={() => onAddGeneratedQuestions([item])}
                >
                  <Plus size={12} /> Add This Question
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
