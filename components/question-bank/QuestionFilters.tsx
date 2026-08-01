'use client'

import type { QuestionType, Difficulty } from '@/lib/types'
import { Search, Filter, RotateCcw } from 'lucide-react'

export function QuestionFilters({
  searchQuery,
  setSearchQuery,
  selectedTopics,
  setSelectedTopics,
  allTopics,
  selectedTypes,
  setSelectedTypes,
  selectedDifficulties,
  setSelectedDifficulties,
  minMarks,
  setMinMarks,
  maxMarks,
  setMaxMarks,
  hasDiagramOnly,
  setHasDiagramOnly,
  onClearFilters,
}: {
  searchQuery: string
  setSearchQuery: (s: string) => void
  selectedTopics: string[]
  setSelectedTopics: (t: string[]) => void
  allTopics: string[]
  selectedTypes: QuestionType[]
  setSelectedTypes: (t: QuestionType[]) => void
  selectedDifficulties: Difficulty[]
  setSelectedDifficulties: (d: Difficulty[]) => void
  minMarks: number
  setMinMarks: (m: number) => void
  maxMarks: number
  setMaxMarks: (m: number) => void
  hasDiagramOnly: boolean
  setHasDiagramOnly: (h: boolean) => void
  onClearFilters: () => void
}) {
  function toggleTopic(topic: string) {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic))
    } else {
      setSelectedTopics([...selectedTopics, topic])
    }
  }

  function toggleType(type: QuestionType) {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type))
    } else {
      setSelectedTypes([...selectedTypes, type])
    }
  }

  function toggleDifficulty(diff: Difficulty) {
    if (selectedDifficulties.includes(diff)) {
      setSelectedDifficulties(selectedDifficulties.filter((d) => d !== diff))
    } else {
      setSelectedDifficulties([...selectedDifficulties, diff])
    }
  }

  return (
    <div className="card bg-white p-4 flex flex-col gap-5 border border-border">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2 font-bold text-xs text-text-primary uppercase tracking-wider">
          <Filter size={14} className="text-accent" />
          Filter Question Bank
        </div>
        <button
          type="button"
          className="text-xs text-accent font-semibold hover:underline flex items-center gap-1"
          onClick={onClearFilters}
        >
          <RotateCcw size={12} /> Clear
        </button>
      </div>

      {/* Search Input */}
      <div className="form-group">
        <label className="form-label">Search Query</label>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-text-muted" />
          <input
            type="text"
            className="form-input text-xs pl-8 py-1.5"
            placeholder="Search keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Question Type Checkboxes */}
      <div className="form-group">
        <label className="form-label">Question Type</label>
        <div className="flex flex-col gap-1.5 text-xs text-text-secondary">
          {[
            { id: 'mcq', label: 'Multiple Choice (MCQ)' },
            { id: 'short', label: 'Short Answer (1-3m)' },
            { id: 'structured', label: 'Structured Multi-part' },
            { id: 'calculation', label: 'Calculation' },
          ].map((typeItem) => (
            <label key={typeItem.id} className="flex items-center gap-2 cursor-pointer hover:text-text-primary">
              <input
                type="checkbox"
                checked={selectedTypes.includes(typeItem.id as QuestionType)}
                onChange={() => toggleType(typeItem.id as QuestionType)}
                className="rounded border-border"
              />
              <span>{typeItem.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Topics Checkboxes */}
      {allTopics.length > 0 && (
        <div className="form-group">
          <label className="form-label">Physics Topics</label>
          <div className="flex flex-col gap-1.5 text-xs text-text-secondary max-h-40 overflow-y-auto pr-1">
            {allTopics.map((topic, i) => (
              <label key={i} className="flex items-center gap-2 cursor-pointer hover:text-text-primary">
                <input
                  type="checkbox"
                  checked={selectedTopics.includes(topic)}
                  onChange={() => toggleTopic(topic)}
                  className="rounded border-border"
                />
                <span className="truncate">{topic}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Difficulty Level */}
      <div className="form-group">
        <label className="form-label">Difficulty</label>
        <div className="flex flex-col gap-1.5 text-xs text-text-secondary">
          {[
            { id: 'foundation', label: 'Foundation' },
            { id: 'standard', label: 'Standard' },
            { id: 'challenging', label: 'Challenging' },
          ].map((diff) => (
            <label key={diff.id} className="flex items-center gap-2 cursor-pointer hover:text-text-primary">
              <input
                type="checkbox"
                checked={selectedDifficulties.includes(diff.id as Difficulty)}
                onChange={() => toggleDifficulty(diff.id as Difficulty)}
                className="rounded border-border"
              />
              <span>{diff.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Marks Range Slider */}
      <div className="form-group">
        <label className="form-label flex justify-between">
          <span>Marks Range</span>
          <span className="font-mono-numbers text-accent font-bold">
            {minMarks} – {maxMarks} Marks
          </span>
        </label>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="range"
            min={1}
            max={20}
            value={maxMarks}
            onChange={(e) => setMaxMarks(parseInt(e.target.value, 10))}
            className="w-full accent-accent"
          />
        </div>
      </div>

      {/* Has Diagram Toggle */}
      <div className="pt-2 border-t border-border">
        <label className="flex items-center gap-2 text-xs font-semibold text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={hasDiagramOnly}
            onChange={(e) => setHasDiagramOnly(e.target.checked)}
            className="rounded border-border"
          />
          <span>Diagram-based only</span>
        </label>
      </div>
    </div>
  )
}
