'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { supabase } from '@/lib/supabase'
import { Zap, Check, Plus, Trash2, ArrowRight } from 'lucide-react'

export default function SetupPage() {
  const router = useRouter()
  const { user, profile, refreshProfile, refreshCurriculumLevels } = useApp()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Step 1 State
  const [fullName, setFullName] = useState(profile?.full_name || 'Dr. Sarah Jenkins')
  const [academyName, setAcademyName] = useState(profile?.academy_name || 'Centaurus Academy')

  // Step 2 State (Curriculum Levels)
  const [levels, setLevels] = useState<string[]>([
    'Cambridge A-Level Physics (9702)',
    'Cambridge IGCSE Physics (0625)',
    'Edexcel Physics',
  ])
  const [newLevelInput, setNewLevelInput] = useState('')

  // Step 3 State (First Class)
  const [className, setClassName] = useState('Year 13 A-Level Physics')
  const [selectedLevelName, setSelectedLevelName] = useState('Cambridge A-Level Physics (9702)')
  const [academicYear, setAcademicYear] = useState('2025-2026')

  function handleAddLevel() {
    if (!newLevelInput.trim()) return
    if (!levels.includes(newLevelInput.trim())) {
      setLevels([...levels, newLevelInput.trim()])
    }
    setNewLevelInput('')
  }

  function handleRemoveLevel(index: number) {
    if (levels.length <= 1) return
    setLevels(levels.filter((_, i) => i !== index))
  }

  async function handleCompleteSetup() {
    setIsSubmitting(true)
    try {
      const teacherId = user?.id || profile?.id || 'demo-teacher'

      // Update teacher profile
      await supabase
        .from('teachers')
        .upsert({
          id: teacherId,
          full_name: fullName.trim(),
          email: user?.email || profile?.email || 'sarah.jenkins@centaurus.edu',
          academy_name: academyName.trim(),
        })

      // Create curriculum levels
      const levelRows = levels.map((lvl) => ({
        teacher_id: teacherId,
        name: lvl,
      }))

      const { data: createdLevels } = await supabase
        .from('curriculum_levels')
        .insert(levelRows)
        .select()

      const levelId = createdLevels?.[0]?.id

      // Create initial class
      await supabase.from('classes').insert({
        teacher_id: teacherId,
        curriculum_level_id: levelId,
        name: className.trim(),
        academic_year: academicYear.trim(),
        is_active: true,
      })

      await refreshProfile()
      await refreshCurriculumLevels()

      router.push('/question-bank/upload?setup=complete')
    } catch (err) {
      console.warn('Setup warning:', err)
      router.push('/question-bank/upload?setup=complete')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg-base p-4">
      <div className="card w-full max-w-xl p-8 shadow-xl bg-white border border-border">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
          <div className="p-2.5 bg-accent-light text-accent rounded-lg">
            <Zap size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-text-primary">Faculty Setup Wizard</h1>
            <p className="text-xs text-text-muted">Configure your PhysicsDesk teaching environment</p>
          </div>
        </div>

        {/* Stepper Progress Bar */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-border w-full -z-10" />
          
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
                step > i
                  ? 'bg-success text-white'
                  : step === i
                  ? 'bg-accent text-white ring-4 ring-accent-light'
                  : 'bg-bg-subtle text-text-muted border border-border'
              }`}
            >
              {step > i ? <Check size={16} /> : i}
            </div>
          ))}
        </div>

        {/* Step 1: Teacher Profile */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Step 1: Faculty Information</h2>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Sarah Jenkins"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Academy / School Name</label>
              <input
                type="text"
                className="form-input"
                value={academyName}
                onChange={(e) => setAcademyName(e.target.value)}
                placeholder="Centaurus Academy"
                required
              />
            </div>

            <button
              type="button"
              className="btn btn-primary w-full justify-center mt-4 py-2.5"
              onClick={() => setStep(2)}
            >
              Next: Curriculum Levels <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step 2: Curriculum Levels */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Step 2: Curriculum Boards & Levels</h2>
            <p className="text-xs text-text-secondary">Pre-loaded levels for Physics exam paper generation. Customize as needed.</p>

            <div className="flex gap-2">
              <input
                type="text"
                className="form-input"
                placeholder="Add level (e.g. Edexcel International A-Level)"
                value={newLevelInput}
                onChange={(e) => setNewLevelInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLevel())}
              />
              <button type="button" className="btn btn-secondary px-3" onClick={handleAddLevel}>
                <Plus size={16} /> Add
              </button>
            </div>

            <div className="flex flex-col gap-2 mt-2 max-h-48 overflow-y-auto">
              {levels.map((lvl, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border bg-bg-subtle text-xs font-medium">
                  <span>{lvl}</span>
                  {levels.length > 1 && (
                    <button
                      type="button"
                      className="text-text-muted hover:text-danger p-1"
                      onClick={() => handleRemoveLevel(idx)}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              <button type="button" className="btn btn-outline flex-1 justify-center" onClick={() => setStep(1)}>
                Back
              </button>
              <button type="button" className="btn btn-primary flex-1 justify-center" onClick={() => setStep(3)}>
                Next: First Class <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: First Class */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Step 3: Setup Initial Class Roster</h2>

            <div className="form-group">
              <label className="form-label">Class Name</label>
              <input
                type="text"
                className="form-input"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Year 13 A-Level Physics"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Curriculum Level</label>
              <select
                className="form-input"
                value={selectedLevelName}
                onChange={(e) => setSelectedLevelName(e.target.value)}
              >
                {levels.map((lvl, i) => (
                  <option key={i} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Academic Year</label>
              <input
                type="text"
                className="form-input"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2025-2026"
              />
            </div>

            <div className="flex gap-2 mt-4">
              <button type="button" className="btn btn-outline flex-1 justify-center" onClick={() => setStep(2)}>
                Back
              </button>
              <button
                type="button"
                className="btn btn-primary flex-1 justify-center py-2.5"
                onClick={handleCompleteSetup}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving setup...' : 'Complete & Start Uploading'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
