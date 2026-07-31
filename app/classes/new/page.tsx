'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { getCurriculumLevels } from '@/lib/supabase/queries/teachers'
import { createClass } from '@/lib/supabase/queries/classes'
import type { CurriculumLevel } from '@/lib/types'
import { ArrowLeft, CheckCircle } from 'lucide-react'

export default function NewClassPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [academicYear, setAcademicYear] = useState('2025-2026')
  const [curriculumLevelId, setCurriculumLevelId] = useState('')
  const [levels, setLevels] = useState<CurriculumLevel[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    getCurriculumLevels().then((lvls) => {
      setLevels(lvls)
      if (lvls.length > 0) setCurriculumLevelId(lvls[0].id)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    const newCls = await createClass({
      name: name.trim(),
      academic_year: academicYear,
      curriculum_level_id: curriculumLevelId || null,
    })

    if (newCls) {
      router.push(`/classes/${newCls.id}`)
    } else {
      router.push('/classes')
    }
  }

  return (
    <AppShell>
      <Header
        title="Create New Physics Class"
        actions={
          <Link href="/classes" className="btn btn-secondary btn-sm">
            <ArrowLeft size={14} /> Back to Classes
          </Link>
        }
      />

      <div className="page-body max-w-xl mx-auto">
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label">Class Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Grade 12 Physics (A-Level)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Curriculum Level</label>
              <select
                className="form-input form-select"
                value={curriculumLevelId}
                onChange={(e) => setCurriculumLevelId(e.target.value)}
              >
                {levels.map((lvl) => (
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
                className="form-input"
                placeholder="2025-2026"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border">
              <Link href="/classes" className="btn btn-ghost">
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Class'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  )
}
