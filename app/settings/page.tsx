'use client'

import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { useApp } from '@/context/AppContext'
import { supabase } from '@/lib/supabase'
import { Settings, User, BookOpen, LogOut, Plus, Trash2, CheckCircle2 } from 'lucide-react'

export default function SettingsPage() {
  const { profile, curriculumLevels, refreshProfile, refreshCurriculumLevels, signOut } = useApp()

  // Profile Form State
  const [fullName, setFullName] = useState(profile?.full_name || 'Dr. Sarah Jenkins')
  const [academyName, setAcademyName] = useState(profile?.academy_name || 'Centaurus Academy')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileSavedMsg, setProfileSavedMsg] = useState(false)

  // Curriculum Levels State
  const [newLevelName, setNewLevelName] = useState('')

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setIsSavingProfile(true)
    setProfileSavedMsg(false)
    try {
      if (profile?.id) {
        await supabase
          .from('teachers')
          .update({
            full_name: fullName.trim(),
            academy_name: academyName.trim(),
          })
          .eq('id', profile.id)
      }
      await refreshProfile()
      setProfileSavedMsg(true)
      setTimeout(() => setProfileSavedMsg(false), 3000)
    } catch (err) {
      console.warn('Profile update error:', err)
    } finally {
      setIsSavingProfile(false)
    }
  }

  async function handleAddLevel() {
    if (!newLevelName.trim()) return
    try {
      if (profile?.id) {
        await supabase.from('curriculum_levels').insert({
          teacher_id: profile.id,
          name: newLevelName.trim(),
        })
      }
      setNewLevelName('')
      await refreshCurriculumLevels()
    } catch (err) {
      console.warn('Add level error:', err)
    }
  }

  async function handleDeleteLevel(id: string) {
    if (!confirm('Are you sure you want to delete this curriculum level?')) return
    try {
      await supabase.from('curriculum_levels').delete().eq('id', id)
      await refreshCurriculumLevels()
    } catch (err) {
      console.warn('Delete level error:', err)
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="pb-4 border-b border-border">
          <h1 className="text-2xl font-extrabold text-text-primary tracking-tight flex items-center gap-2">
            <Settings size={22} className="text-accent" /> Faculty Settings
          </h1>
          <p className="text-xs text-text-muted mt-1 font-medium">
            Manage your faculty profile, academy details, curriculum levels, and account access
          </p>
        </div>

        {/* Profile Card */}
        <div className="card bg-white p-6 border border-border">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-border">
            <User size={18} className="text-accent" />
            <h2 className="font-bold text-sm text-text-primary uppercase tracking-wider">Faculty Profile</h2>
          </div>

          <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
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
                  required
                />
              </div>
            </div>

            {profileSavedMsg && (
              <div className="p-3 bg-success-light text-success border border-success/30 rounded-md text-xs flex items-center gap-2">
                <CheckCircle2 size={16} /> Profile settings updated successfully!
              </div>
            )}

            <button type="submit" className="btn btn-primary text-xs w-fit px-5" disabled={isSavingProfile}>
              {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Curriculum Levels Card */}
        <div className="card bg-white p-6 border border-border">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-border">
            <BookOpen size={18} className="text-accent" />
            <h2 className="font-bold text-sm text-text-primary uppercase tracking-wider">Curriculum Boards & Levels</h2>
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              className="form-input text-xs"
              placeholder="Add new level (e.g. Edexcel International A-Level Physics)"
              value={newLevelName}
              onChange={(e) => setNewLevelName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLevel())}
            />
            <button type="button" className="btn btn-secondary text-xs px-4" onClick={handleAddLevel}>
              <Plus size={14} /> Add Level
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {curriculumLevels.map((lvl) => (
              <div
                key={lvl.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-bg-subtle text-xs font-medium"
              >
                <span>{lvl.name}</span>
                <button
                  type="button"
                  className="text-text-muted hover:text-danger p-1"
                  onClick={() => handleDeleteLevel(lvl.id)}
                  title="Delete level"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Account & Sign Out */}
        <div className="card bg-white p-6 border border-border flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <LogOut size={18} className="text-danger" />
            <h2 className="font-bold text-sm text-text-primary uppercase tracking-wider">Account Credentials</h2>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="text-text-muted block">Signed in as:</span>
              <strong className="text-text-primary">{profile?.email || 'sarah.jenkins@centaurus.edu'}</strong>
            </div>

            <button type="button" className="btn btn-danger text-xs px-4" onClick={signOut}>
              <LogOut size={14} /> Sign Out of PhysicsDesk
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
