'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { useApp } from '@/context/AppContext'
import { getCurriculumLevels, updateTeacherProfile } from '@/lib/supabase/queries/teachers'
import { getStudents } from '@/lib/supabase/queries/students'
import { getAssignments } from '@/lib/supabase/queries/assignments'
import { getUploads } from '@/lib/supabase/queries/uploads'
import type { CurriculumLevel } from '@/lib/types'
import { downloadCSV } from '@/lib/utils'
import { Settings, Save, Plus, Download, Trash2, CheckCircle } from 'lucide-react'

export default function SettingsPage() {
  const { profile, refreshProfile } = useApp()

  // Profile Form
  const [fullName, setFullName] = useState('')
  const [academyName, setAcademyName] = useState('')
  const [subject, setSubject] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Curriculum levels
  const [levels, setLevels] = useState<CurriculumLevel[]>([])
  const [newLevelName, setNewLevelName] = useState('')
  const [newLevelDesc, setNewLevelDesc] = useState('')

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setAcademyName(profile.academy_name || '')
      setSubject(profile.subject || '')
    }
    getCurriculumLevels().then(setLevels)
  }, [profile])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setIsSavingProfile(true)
    await updateTeacherProfile({
      full_name: fullName,
      academy_name: academyName,
      subject,
    })
    await refreshProfile()
    setIsSavingProfile(false)
    setToastMsg('Profile details updated successfully!')
    setTimeout(() => setToastMsg(null), 3000)
  }

  function handleAddLevel() {
    if (!newLevelName.trim()) return
    const newLvl: CurriculumLevel = {
      id: 'lvl-' + Date.now(),
      teacher_id: profile?.id || 'teacher-1',
      name: newLevelName.trim(),
      description: newLevelDesc.trim() || null,
      created_at: new Date().toISOString(),
    }
    setLevels([...levels, newLvl])
    setNewLevelName('')
    setNewLevelDesc('')
  }

  async function exportStudentsCSV() {
    const data = await getStudents()
    const mapped = data.map((s) => ({
      RollNumber: s.roll_number || '',
      FullName: s.full_name,
      Email: s.email || '',
      Class: s.class?.name || '',
    }))
    downloadCSV(mapped, 'PhysicsDesk_Students_Export')
  }

  async function exportAssignmentsCSV() {
    const data = await getAssignments()
    const mapped = data.map((a) => ({
      Title: a.title,
      Topic: a.topic || '',
      Type: a.assignment_type,
      TotalMarks: a.total_marks,
      DueDate: a.due_date || '',
    }))
    downloadCSV(mapped, 'PhysicsDesk_Assignments_Export')
  }

  return (
    <AppShell>
      <Header
        title="PhysicsDesk Settings"
        subtitle="Teacher profile, curriculum levels, and LMS data export tools"
      />

      <div className="page-body flex flex-col gap-6 max-w-4xl">
        {toastMsg && (
          <div className="toast success">
            <CheckCircle size={18} />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Profile Section */}
        <div className="card p-6">
          <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
            <Settings size={16} className="text-accent" /> Teacher Profile & Academy Information
          </h2>

          <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="form-group">
              <label className="form-label">Teaching Subject</label>
              <input
                type="text"
                className="form-input"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div className="md:col-span-2 flex justify-end mt-2">
              <button type="submit" className="btn btn-primary" disabled={isSavingProfile}>
                <Save size={14} /> {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Curriculum Levels Manager */}
        <div className="card p-6">
          <h2 className="text-sm font-bold text-text-primary mb-4">Curriculum Levels Manager</h2>

          <div className="flex flex-col gap-3 mb-4">
            {levels.map((lvl, idx) => (
              <div key={lvl.id} className="flex items-center justify-between p-3 rounded border border-border bg-bg-subtle text-xs">
                <div>
                  <div className="font-bold text-text-primary">{lvl.name}</div>
                  <div className="text-text-muted">{lvl.description || 'No description provided.'}</div>
                </div>
                <button
                  className="btn btn-ghost btn-sm text-danger"
                  onClick={() => setLevels(levels.filter((_, i) => i !== idx))}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end pt-3 border-t border-border">
            <div className="form-group">
              <label className="form-label">New Level Name</label>
              <input
                type="text"
                className="form-input text-xs"
                placeholder="e.g. AP Physics C"
                value={newLevelName}
                onChange={(e) => setNewLevelName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Syllabus Description</label>
              <input
                type="text"
                className="form-input text-xs"
                placeholder="Description..."
                value={newLevelDesc}
                onChange={(e) => setNewLevelDesc(e.target.value)}
              />
            </div>

            <button type="button" className="btn btn-secondary text-xs py-2" onClick={handleAddLevel}>
              <Plus size={14} /> Add Curriculum Level
            </button>
          </div>
        </div>

        {/* Data Export Tools */}
        <div className="card p-6">
          <h2 className="text-sm font-bold text-text-primary mb-2">Data Export Tools for External LMS</h2>
          <p className="text-xs text-text-secondary mb-4">
            Download CSV files of student rosters and grades to import back into your academy’s LMS.
          </p>

          <div className="flex flex-wrap gap-3">
            <button className="btn btn-secondary btn-sm" onClick={exportStudentsCSV}>
              <Download size={14} /> Export All Students (CSV)
            </button>
            <button className="btn btn-secondary btn-sm" onClick={exportAssignmentsCSV}>
              <Download size={14} /> Export All Assignments (CSV)
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
