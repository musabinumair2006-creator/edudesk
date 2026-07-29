'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { useApp } from '@/context/AppContext'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, CheckCircle } from 'lucide-react'

interface LevelDraft {
  id?: string
  name: string
  description: string
  isNew?: boolean
}

export default function SettingsPage() {
  const { profile, curriculumLevels, refreshProfile, refreshCurriculumLevels } = useApp()
  const supabase = createClient()

  const [academyName, setAcademyName] = useState(profile?.academy_name || '')
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [levels, setLevels] = useState<LevelDraft[]>([])
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingLevels, setIsSavingLevels] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    setAcademyName(profile?.academy_name || '')
    setFullName(profile?.full_name || '')
  }, [profile])

  useEffect(() => {
    setLevels(
      curriculumLevels.map((l) => ({
        id: l.id,
        name: l.name,
        description: l.description || '',
      }))
    )
  }, [curriculumLevels])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setIsSavingProfile(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setIsSavingProfile(false); return }

    const { error } = await supabase
      .from('teacher_profile')
      .update({ academy_name: academyName, full_name: fullName })
      .eq('id', user.id)

    if (error) {
      showToast('Failed to save: ' + error.message, 'error')
    } else {
      await refreshProfile()
      showToast('Profile saved successfully')
    }
    setIsSavingProfile(false)
  }

  async function handleSaveLevels(e: React.FormEvent) {
    e.preventDefault()
    setIsSavingLevels(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setIsSavingLevels(false); return }

    try {
      for (const level of levels) {
        if (level.isNew && level.name.trim()) {
          await supabase.from('curriculum_levels').insert({
            teacher_id: user.id,
            name: level.name.trim(),
            description: level.description.trim() || null,
          })
        } else if (level.id && level.name.trim()) {
          await supabase.from('curriculum_levels').update({
            name: level.name.trim(),
            description: level.description.trim() || null,
          }).eq('id', level.id)
        }
      }
      await refreshCurriculumLevels()
      showToast('Curriculum levels saved')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save levels', 'error')
    }
    setIsSavingLevels(false)
  }

  async function handleDeleteLevel(id: string) {
    if (!confirm('Delete this curriculum level? This will also affect existing classes using it.')) return

    const { error } = await supabase.from('curriculum_levels').delete().eq('id', id)
    if (error) {
      showToast('Failed to delete level: ' + error.message, 'error')
    } else {
      setLevels((prev) => prev.filter((l) => l.id !== id))
      await refreshCurriculumLevels()
      showToast('Curriculum level deleted')
    }
  }

  function addLevel() {
    setLevels((prev) => [...prev, { name: '', description: '', isNew: true }])
  }

  function updateLevel(idx: number, field: 'name' | 'description', value: string) {
    setLevels((prev) => {
      const updated = [...prev]
      updated[idx][field] = value
      return updated
    })
  }

  function removeNewLevel(idx: number) {
    setLevels((prev) => prev.filter((_, i) => i !== idx))
  }

  return (
    <AppShell>
      <Header title="Settings" subtitle="Manage your academy configuration" />

      <div className="page-body flex flex-col gap-6" style={{ maxWidth: '700px' }}>
        {/* Profile Settings */}
        <div className="card">
          <h2
            className="font-semibold text-sm mb-4 pb-3"
            style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            ACADEMY PROFILE
          </h2>
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                style={{ maxWidth: '400px' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Academy Name</label>
              <input
                type="text"
                className="form-input"
                value={academyName}
                onChange={(e) => setAcademyName(e.target.value)}
                placeholder="Your academy name"
                style={{ maxWidth: '400px' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={profile?.email || ''}
                disabled
                style={{ maxWidth: '400px', opacity: 0.6 }}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Email cannot be changed here.
              </p>
            </div>
            <div className="flex justify-start">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSavingProfile}
              >
                {isSavingProfile ? (
                  <>
                    <span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle size={14} /> Save Profile
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Curriculum Levels */}
        <div className="card">
          <h2
            className="font-semibold text-sm mb-4 pb-3"
            style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            CURRICULUM LEVELS
          </h2>
          <form onSubmit={handleSaveLevels}>
            <div className="flex flex-col gap-3 mb-4">
              {levels.map((level, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Level name"
                      value={level.name}
                      onChange={(e) => updateLevel(idx, 'name', e.target.value)}
                      style={{ flex: '0 0 150px' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Description (optional)"
                      value={level.description}
                      onChange={(e) => updateLevel(idx, 'description', e.target.value)}
                    />
                  </div>
                  {level.id ? (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleDeleteLevel(level.id!)}
                      style={{ color: 'var(--danger)', padding: '0.5rem', flexShrink: 0 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => removeNewLevel(idx)}
                      style={{ color: 'var(--danger)', padding: '0.5rem', flexShrink: 0 }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addLevel}>
                <Plus size={14} /> Add Level
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={isSavingLevels}
              >
                {isSavingLevels ? (
                  <>
                    <span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} />
                    Saving...
                  </>
                ) : (
                  'Save Levels'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* About */}
        <div className="card">
          <h2
            className="font-semibold text-sm mb-3 pb-3"
            style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            ABOUT EDUDESK
          </h2>
          <div className="flex flex-col gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <div className="flex justify-between">
              <span>Version</span>
              <span className="font-mono">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>AI Provider</span>
              <span>Anthropic Claude</span>
            </div>
            <div className="flex justify-between">
              <span>Database</span>
              <span>Supabase (PostgreSQL)</span>
            </div>
            <div className="flex justify-between">
              <span>Curricula</span>
              <span>IGCSE, A-Level, Edexcel Physics</span>
            </div>
          </div>
        </div>
      </div>

      {toast && <div className={`toast ${toast.type}`}>{toast.type === 'success' ? '✓' : '✕'} {toast.msg}</div>}
    </AppShell>
  )
}
