'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import {
  Sparkles,
  ArrowLeft,
  CheckCircle,
  BookOpen,
  Clock,
  FlaskConical,
  GraduationCap,
  Layers,
} from 'lucide-react'

export default function GenerateLessonPage() {
  const [topic, setTopic] = useState('')
  const [curriculumLevel, setCurriculumLevel] = useState('A-Level Physics')
  const [durationMinutes, setDurationMinutes] = useState<number>(60)
  const [includePractical, setIncludePractical] = useState(true)
  const [difficulty, setDifficulty] = useState<'standard' | 'advanced'>('standard')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!topic.trim()) {
      showToast('Please enter a physics topic', 'error')
      return
    }

    setIsGenerating(true)
    try {
      // Step 1: Call AI Route
      const aiRes = await fetch('/api/ai/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          curriculum_level: curriculumLevel,
          duration_minutes: durationMinutes,
          include_practical: includePractical,
          difficulty,
          special_instructions: specialInstructions || undefined,
        }),
      })

      const aiData = await aiRes.json()
      if (aiData.error) {
        showToast(aiData.error, 'error')
        setIsGenerating(false)
        return
      }

      // Step 2: Save generated plan to database/API
      const saveRes = await fetch('/api/curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: aiData.title,
          topic: aiData.topic,
          duration_minutes: aiData.duration_minutes,
          target_audience: curriculumLevel,
          content: aiData.content,
        }),
      })

      const saveData = await saveRes.json()
      showToast('Lesson Plan generated successfully!')

      // Redirect to view plan
      if (saveData.lesson_plan?.id) {
        window.location.href = `/curriculum/${saveData.lesson_plan.id}`
      } else {
        window.location.href = '/curriculum'
      }
    } catch (err) {
      showToast('Failed to generate lesson plan', 'error')
      setIsGenerating(false)
    }
  }

  const SUGGESTED_TOPICS = [
    'Electromagnetic Induction',
    'Simple Harmonic Motion',
    'Quantum Photoelectric Effect',
    'Thermodynamic Ideal Gases',
    'Gravitational Fields & Orbits',
    'Wave Interference & Diffraction',
  ]

  return (
    <AppShell>
      <Header
        title="Generate AI Lesson Plan"
        subtitle="Create structured physics lesson plans & practical lab guides in seconds"
        actions={
          <Link href="/curriculum" className="btn btn-secondary btn-sm">
            <ArrowLeft size={14} /> Back to Library
          </Link>
        }
      />

      <div className="page-body max-w-3xl mx-auto flex flex-col gap-6">
        <div className="card border-purple-500/30 p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
            <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">AI Physics Lesson Generator</h2>
              <p className="text-xs text-slate-400">
                AI will compose learning objectives, key formulas, step-by-step timeline, misconceptions, and practical guides.
              </p>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="flex flex-col gap-5">
            {/* Topic Input */}
            <div className="form-group">
              <label className="form-label text-sm font-semibold">Physics Topic *</label>
              <input
                type="text"
                className="form-input text-sm"
                placeholder="e.g. Electromagnetic Induction, Projectile Motion, Photoelectric Effect"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
              />
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                <span className="text-[11px] text-slate-400">Suggestions:</span>
                {SUGGESTED_TOPICS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTopic(t)}
                    className="text-[11px] bg-slate-800 hover:bg-slate-700 text-blue-300 px-2 py-0.5 rounded transition-all"
                  >
                    + {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Curriculum Level & Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label text-sm font-semibold">Curriculum Standard</label>
                <select
                  className="form-input text-sm"
                  value={curriculumLevel}
                  onChange={(e) => setCurriculumLevel(e.target.value)}
                >
                  <option value="IGCSE Physics (CIE 0625)">IGCSE Physics (CIE 0625)</option>
                  <option value="A-Level Physics (CIE 9702)">A-Level Physics (CIE 9702)</option>
                  <option value="Edexcel International A-Level">Edexcel International A-Level</option>
                  <option value="AP Physics 1 / C">AP Physics 1 / C</option>
                  <option value="IB Physics (HL/SL)">IB Physics (HL/SL)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label text-sm font-semibold">Lesson Duration</label>
                <select
                  className="form-input text-sm"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                >
                  <option value={30}>30 Minutes (Short Period)</option>
                  <option value={45}>45 Minutes (Standard Class)</option>
                  <option value={60}>60 Minutes (Full Hour)</option>
                  <option value={90}>90 Minutes (Double Block)</option>
                </select>
              </div>
            </div>

            {/* Options & Difficulty */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label text-sm font-semibold">Include Hands-on Practical Lab</label>
                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                    <input
                      type="radio"
                      name="practical"
                      checked={includePractical}
                      onChange={() => setIncludePractical(true)}
                    />
                    <span>Yes (Add Lab Experiment)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                    <input
                      type="radio"
                      name="practical"
                      checked={!includePractical}
                      onChange={() => setIncludePractical(false)}
                    />
                    <span>No (Theory Only)</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label text-sm font-semibold">Rigor & Difficulty</label>
                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                    <input
                      type="radio"
                      name="difficulty"
                      checked={difficulty === 'standard'}
                      onChange={() => setDifficulty('standard')}
                    />
                    <span>Standard Core</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                    <input
                      type="radio"
                      name="difficulty"
                      checked={difficulty === 'advanced'}
                      onChange={() => setDifficulty('advanced')}
                    />
                    <span>Advanced / Honors</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            <div className="form-group">
              <label className="form-label text-sm font-semibold">Special Focus / Notes (Optional)</label>
              <textarea
                className="form-input text-sm h-20"
                placeholder="e.g. Focus heavily on Lenz's law direction calculations and oscilloscope readings."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                className="btn btn-primary text-sm px-6 py-2.5 flex items-center gap-2"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} />
                    Generating Lesson Plan...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Generate Lesson Plan
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}
    </AppShell>
  )
}
