'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import {
  Sparkles,
  Plus,
  Search,
  BookOpen,
  Clock,
  Printer,
  Globe,
  Trash2,
  ChevronRight,
  Zap,
} from 'lucide-react'
import type { LessonPlan } from '@/lib/types'

export default function CurriculumPage() {
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('all')

  useEffect(() => {
    fetch('/api/curriculum')
      .then((res) => res.json())
      .then((data) => {
        if (data.lesson_plans) setLessonPlans(data.lesson_plans)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const TOPICS = ['all', 'Electromagnetism', 'Waves & Oscillations', 'Mechanics', 'Thermodynamics', 'Quantum & Modern']

  const filtered = lessonPlans.filter((lp) => {
    const matchSearch =
      lp.title.toLowerCase().includes(search.toLowerCase()) ||
      lp.topic.toLowerCase().includes(search.toLowerCase())
    const matchTopic = selectedTopic === 'all' || lp.topic === selectedTopic
    return matchSearch && matchTopic
  })

  return (
    <AppShell>
      <Header
        title="AI Lesson Planner"
        subtitle="Generate, manage, and publish structured physics lesson plans & lab guides"
        actions={
          <Link href="/curriculum/generate" className="btn btn-primary">
            <Sparkles size={16} /> Generate AI Lesson Plan
          </Link>
        }
      />

      <div className="page-body flex flex-col gap-6">
        {/* Banner */}
        <div className="card bg-gradient-to-r from-purple-900/40 via-blue-900/30 to-slate-900/50 border-purple-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl">
              <Sparkles size={26} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-snug">
                Pedagogical AI Lesson & Lab Plan Generator
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Generate minute-by-minute teaching timelines, common student misconceptions, hands-on experiment guides, and 1-click publish to LMS.
              </p>
            </div>
          </div>
          <Link href="/curriculum/generate" className="btn btn-secondary text-xs flex items-center gap-1.5 shrink-0">
            <Plus size={14} /> New Lesson Plan
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1" style={{ minWidth: '240px', maxWidth: '420px' }}>
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search lesson title or topic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {TOPICS.map((topic) => (
              <button
                key={topic}
                className="btn btn-sm"
                style={{
                  background: selectedTopic === topic ? 'var(--accent)' : 'var(--bg-subtle)',
                  color: selectedTopic === topic ? 'white' : 'var(--text-secondary)',
                }}
                onClick={() => setSelectedTopic(topic)}
              >
                {topic === 'all' ? 'All Topics' : topic}
              </button>
            ))}
          </div>
        </div>

        {/* Lesson Plans Grid */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <span className="spinner spinner-lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16 text-slate-400">
            <BookOpen size={42} className="mx-auto mb-2 opacity-30" />
            <p className="font-bold text-white text-base">No lesson plans found</p>
            <p className="text-xs mt-1">Generate your first AI physics lesson plan to get started.</p>
            <Link href="/curriculum/generate" className="btn btn-primary btn-sm mt-4 inline-flex items-center gap-1.5">
              <Sparkles size={14} /> Generate Plan Now
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((plan) => (
              <div
                key={plan.id}
                className="card border-slate-800 bg-slate-900/40 hover:bg-slate-800/40 transition-all flex flex-col justify-between gap-4 p-5"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-purple-500/15 text-purple-300 flex items-center gap-1">
                      <Zap size={10} /> {plan.topic}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock size={11} /> {plan.duration_minutes} mins
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-white leading-snug line-clamp-2 mt-1">
                    {plan.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-3 mt-2">
                    {plan.content.overview}
                  </p>

                  <div className="mt-3 flex items-center gap-2 flex-wrap text-[11px] text-slate-400">
                    <span className="bg-slate-800 px-2 py-0.5 rounded">
                      🎯 {plan.content.learning_objectives.length} Objectives
                    </span>
                    {plan.content.practical_experiment && (
                      <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded">
                        🔬 Hands-on Lab
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {new Date(plan.created_at).toLocaleDateString()}
                  </span>
                  <Link
                    href={`/curriculum/${plan.id}`}
                    className="btn btn-secondary btn-sm text-xs flex items-center gap-1"
                  >
                    <span>View Plan</span>
                    <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
