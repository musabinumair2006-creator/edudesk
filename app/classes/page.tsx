'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { useApp } from '@/context/AppContext'
import { supabase } from '@/lib/supabase'
import type { Class } from '@/lib/types'
import { BookOpen, Users, Plus, CheckCircle, ArrowRight } from 'lucide-react'

export default function ClassesPage() {
  const { curriculumLevels } = useApp()

  const [classes, setClasses] = useState<Class[]>([])
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)

  // New Class Modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [classNameInput, setClassNameInput] = useState('')
  const [levelIdInput, setLevelIdInput] = useState('')
  const [yearInput, setYearInput] = useState('2025-2026')

  useEffect(() => {
    loadClassesData()
  }, [])

  useEffect(() => {
    if (curriculumLevels.length > 0 && !levelIdInput) {
      setLevelIdInput(curriculumLevels[0].id)
    }
  }, [curriculumLevels, levelIdInput])

  async function loadClassesData() {
    setIsLoading(true)
    try {
      const { data: cData } = await supabase
        .from('classes')
        .select('*, curriculum_level:curriculum_levels(name)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (cData && cData.length > 0) {
        setClasses(cData as Class[])

        // Fetch student counts per class
        const { data: sData } = await supabase.from('students').select('class_id')
        if (sData) {
          const counts: Record<string, number> = {}
          sData.forEach((s) => {
            if (s.class_id) counts[s.class_id] = (counts[s.class_id] || 0) + 1
          })
          setStudentCounts(counts)
        }
      } else {
        // Fallback demo classes
        setClasses([
          {
            id: 'cls-1',
            teacher_id: 'demo',
            name: 'Year 13 A-Level Physics (A1)',
            academic_year: '2025-2026',
            is_active: true,
            created_at: new Date().toISOString(),
            curriculum_level: { id: 'l1', teacher_id: 'd', name: 'Cambridge A-Level Physics (9702)', created_at: '' },
          },
          {
            id: 'cls-2',
            teacher_id: 'demo',
            name: 'Year 11 IGCSE Physics Batch B',
            academic_year: '2025-2026',
            is_active: true,
            created_at: new Date().toISOString(),
            curriculum_level: { id: 'l2', teacher_id: 'd', name: 'Cambridge IGCSE Physics (0625)', created_at: '' },
          },
        ])
        setStudentCounts({ 'cls-1': 16, 'cls-2': 12 })
      }
    } catch (err) {
      console.warn('Classes load error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAddClass(e: React.FormEvent) {
    e.preventDefault()
    if (!classNameInput.trim() || !levelIdInput) return

    try {
      const { data } = await supabase
        .from('classes')
        .insert({
          name: classNameInput.trim(),
          curriculum_level_id: levelIdInput,
          academic_year: yearInput.trim(),
          is_active: true,
        })
        .select('*, curriculum_level:curriculum_levels(name)')
        .single()

      if (data) {
        setClasses([data as Class, ...classes])
      }
      setShowAddModal(false)
      setClassNameInput('')
    } catch (err) {
      console.warn('Add class error:', err)
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">Physics Classes & Batches</h1>
            <p className="text-xs text-text-muted mt-1 font-medium">
              Manage enrolled batches, mark daily attendance, and track class academic performance
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary text-xs shadow-sm"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} /> Add New Class
          </button>
        </div>

        {/* Classes Cards Grid */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-text-muted">Loading class rosters...</div>
        ) : classes.length === 0 ? (
          <div className="card p-12 text-center text-xs text-text-muted bg-bg-subtle border border-border">
            <BookOpen size={32} className="mx-auto mb-3 text-text-muted" />
            <p className="font-semibold text-text-primary text-sm mb-1">No active classes found</p>
            <p className="text-text-muted max-w-sm mx-auto mb-4">Add your first physics class batch to start marking attendance and results.</p>
            <button
              type="button"
              className="btn btn-primary text-xs py-1.5 px-4 mx-auto"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={14} /> Add Class
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {classes.map((cls) => (
              <div key={cls.id} className="card bg-white p-6 border border-border flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="badge badge-primary text-xs">{cls.curriculum_level?.name || 'A-Level Physics'}</span>
                    <span className="text-xs font-mono-numbers text-text-muted">{cls.academic_year || '2025-2026'}</span>
                  </div>

                  <h3 className="font-extrabold text-lg text-text-primary mt-1">{cls.name}</h3>

                  <div className="flex items-center gap-2 text-xs text-text-secondary mt-1">
                    <Users size={14} className="text-accent" />
                    <span className="font-mono-numbers font-bold text-text-primary">
                      {studentCounts[cls.id] || 15} Students
                    </span>
                    <span>Enrolled</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border mt-2">
                  <Link
                    href={`/classes/${cls.id}/attendance`}
                    className="btn btn-secondary text-xs justify-center py-2 border-accent/30 text-accent hover:bg-accent-light"
                  >
                    <CheckCircle size={14} /> Mark Attendance
                  </Link>

                  <Link
                    href={`/classes/${cls.id}/results`}
                    className="btn btn-outline text-xs justify-center py-2"
                  >
                    View Class Results <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Class Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-border flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base text-text-primary">Add New Physics Class</h3>
              <button
                type="button"
                className="text-text-muted hover:text-text-primary text-sm font-bold"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddClass} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Class / Batch Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Year 13 A-Level Physics Batch A"
                  value={classNameInput}
                  onChange={(e) => setClassNameInput(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Curriculum Level *</label>
                <select
                  className="form-input"
                  value={levelIdInput}
                  onChange={(e) => setLevelIdInput(e.target.value)}
                  required
                >
                  {curriculumLevels.map((lvl) => (
                    <option key={lvl.id} value={lvl.id}>
                      {lvl.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Academic Year</label>
                <input
                  type="text"
                  className="form-input font-mono-numbers"
                  placeholder="2025-2026"
                  value={yearInput}
                  onChange={(e) => setYearInput(e.target.value)}
                />
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  className="btn btn-outline flex-1 justify-center"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1 justify-center">
                  Save Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  )
}
