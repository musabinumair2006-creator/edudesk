'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useApp } from '@/context/AppContext'
import { Zap, CheckCircle, Plus, Trash2, ChevronRight } from 'lucide-react'

interface LevelDraft {
  name: string
  description: string
}

const DEFAULT_LEVELS: LevelDraft[] = [
  { name: 'IGCSE', description: 'Cambridge International General Certificate of Secondary Education' },
  { name: 'A-Level', description: 'Cambridge International A Level' },
  { name: 'Edexcel', description: 'Pearson Edexcel International Advanced Level' },
]

export default function SetupPage() {
  const router = useRouter()
  const supabase = createClient()
  const { refreshProfile, refreshCurriculumLevels } = useApp()

  const [step, setStep] = useState(1)
  const [academyName, setAcademyName] = useState('')
  const [levels, setLevels] = useState<LevelDraft[]>(DEFAULT_LEVELS)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addLevel() {
    setLevels([...levels, { name: '', description: '' }])
  }

  function removeLevel(idx: number) {
    setLevels(levels.filter((_, i) => i !== idx))
  }

  function updateLevel(idx: number, field: keyof LevelDraft, value: string) {
    const updated = [...levels]
    updated[idx][field] = value
    setLevels(updated)
  }

  async function handleComplete() {
    setIsLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    // Update teacher profile with academy name
    const { error: profileError } = await supabase
      .from('teacher_profile')
      .update({ academy_name: academyName.trim() })
      .eq('id', user.id)

    if (profileError) {
      setError('Failed to save academy name: ' + profileError.message)
      setIsLoading(false)
      return
    }

    // Insert curriculum levels
    const validLevels = levels.filter((l) => l.name.trim())
    if (validLevels.length > 0) {
      const { error: levelError } = await supabase.from('curriculum_levels').insert(
        validLevels.map((l) => ({
          teacher_id: user.id,
          name: l.name.trim(),
          description: l.description.trim() || null,
        }))
      )
      if (levelError) {
        setError('Failed to save curriculum levels: ' + levelError.message)
        setIsLoading(false)
        return
      }
    }

    await Promise.all([refreshProfile(), refreshCurriculumLevels()])
    router.push('/dashboard')
  }

  const steps = [
    { n: 1, label: 'Academy Name' },
    { n: 2, label: 'Curriculum Levels' },
    { n: 3, label: 'Confirm' },
  ]

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg-base)' }}
    >
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2" style={{ color: 'var(--accent)' }}>
            <Zap size={24} fill="currentColor" />
            <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              EduDesk
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Let&apos;s set up your academy
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-6 justify-center">
          {steps.map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div
                className="flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold transition-all"
                style={{
                  background: step > s.n ? 'var(--success)' : step === s.n ? 'var(--accent)' : 'var(--bg-subtle)',
                  color: step >= s.n ? 'white' : 'var(--text-muted)',
                  fontSize: '0.75rem',
                }}
              >
                {step > s.n ? <CheckCircle size={14} /> : s.n}
              </div>
              <span
                className="text-sm hidden sm:block"
                style={{ color: step === s.n ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: step === s.n ? 600 : 400 }}
              >
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div className="w-8 h-px" style={{ background: 'var(--border-strong)' }} />
              )}
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          {/* Step 1: Academy Name */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold mb-1">What is your academy&apos;s name?</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                This will appear on reports, papers, and documents.
              </p>
              <div className="form-group">
                <label className="form-label">Academy Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Bright Minds Physics Academy"
                  value={academyName}
                  onChange={(e) => setAcademyName(e.target.value)}
                  autoFocus
                />
              </div>
              <button
                className="btn btn-primary w-full mt-6"
                style={{ justifyContent: 'center' }}
                disabled={!academyName.trim()}
                onClick={() => setStep(2)}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Step 2: Curriculum Levels */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-semibold mb-1">Curriculum Levels</h2>
              <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
                These are the programmes you teach. You can add more anytime in Settings.
              </p>
              <div className="flex flex-col gap-3 mb-4">
                {levels.map((level, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Level name (e.g. IGCSE)"
                        value={level.name}
                        onChange={(e) => updateLevel(idx, 'name', e.target.value)}
                        style={{ flex: '0 0 140px' }}
                      />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Description (optional)"
                        value={level.description}
                        onChange={(e) => updateLevel(idx, 'description', e.target.value)}
                      />
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => removeLevel(idx)}
                      type="button"
                      style={{ color: 'var(--danger)', padding: '0.5rem', flexShrink: 0 }}
                      title="Remove level"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
              <button className="btn btn-secondary btn-sm" onClick={addLevel} type="button">
                <Plus size={14} /> Add Level
              </button>
              <div className="flex gap-3 mt-6">
                <button className="btn btn-secondary" onClick={() => setStep(1)}>
                  Back
                </button>
                <button
                  className="btn btn-primary flex-1"
                  style={{ justifyContent: 'center' }}
                  disabled={levels.filter((l) => l.name.trim()).length === 0}
                  onClick={() => setStep(3)}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div>
              <h2 className="text-lg font-semibold mb-1">All set! Ready to begin.</h2>
              <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
                Review your setup before we create your EduDesk account.
              </p>

              <div
                className="rounded-md p-3 mb-3"
                style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}
              >
                <div className="label-sm mb-1">Academy</div>
                <div className="font-semibold">{academyName}</div>
              </div>

              <div
                className="rounded-md p-3 mb-5"
                style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}
              >
                <div className="label-sm mb-2">Curriculum Levels ({levels.filter(l => l.name.trim()).length})</div>
                <div className="flex flex-col gap-1">
                  {levels.filter((l) => l.name.trim()).map((l, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle size={13} style={{ color: 'var(--success)', flexShrink: 0 }} />
                      <span className="font-medium text-sm">{l.name}</span>
                      {l.description && (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          — {l.description}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div
                  className="p-3 rounded-md mb-4 text-sm"
                  style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid var(--danger)' }}
                >
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button className="btn btn-secondary" onClick={() => setStep(2)}>
                  Back
                </button>
                <button
                  className="btn btn-primary flex-1"
                  style={{ justifyContent: 'center' }}
                  onClick={handleComplete}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} />
                      Setting up...
                    </>
                  ) : (
                    '⚡ Start using EduDesk'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
