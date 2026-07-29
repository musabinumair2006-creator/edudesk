'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { getClasses, toggleClassActive } from '@/lib/supabase/queries/classes'
import type { Class } from '@/lib/types'
import { formatSchedule } from '@/lib/utils'
import {
  Plus,
  BookOpen,
  Users,
  ClipboardList,
  CalendarCheck,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
} from 'lucide-react'

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadClasses()
  }, [])

  async function loadClasses() {
    setIsLoading(true)
    try {
      const data = await getClasses()
      setClasses(data)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleToggleActive(cls: Class) {
    await toggleClassActive(cls.id, !cls.is_active)
    setClasses((prev) =>
      prev.map((c) => (c.id === cls.id ? { ...c, is_active: !c.is_active } : c))
    )
  }

  // Group by curriculum level
  const grouped = classes.reduce(
    (acc, cls) => {
      const key = cls.curriculum_level?.name || 'Uncategorised'
      if (!acc[key]) acc[key] = []
      acc[key].push(cls)
      return acc
    },
    {} as Record<string, Class[]>
  )

  const levelBadgeColors: Record<string, string> = {
    'IGCSE': 'background:var(--accent-light);color:var(--accent)',
    'A-Level': 'background:var(--success-light);color:var(--success)',
    'Edexcel': 'background:var(--warning-light);color:var(--warning)',
  }

  return (
    <AppShell>
      <Header
        title="Classes"
        subtitle="Manage all your teaching classes"
        actions={
          <Link href="/classes/new" className="btn btn-primary btn-sm">
            <Plus size={14} /> New Class
          </Link>
        }
      />

      <div className="page-body">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner spinner-lg" />
          </div>
        ) : classes.length === 0 ? (
          <div className="empty-state" style={{ paddingTop: '5rem' }}>
            <BookOpen size={48} />
            <div>
              <p className="font-semibold text-base" style={{ color: 'var(--text-secondary)' }}>
                No classes yet
              </p>
              <p className="text-sm mt-1">Create your first class to get started.</p>
            </div>
            <Link href="/classes/new" className="btn btn-primary mt-2">
              <Plus size={14} /> Create Class
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {Object.entries(grouped).map(([levelName, levelClasses]) => (
              <div key={levelName}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="font-semibold text-base">{levelName}</h2>
                  <span
                    className="badge"
                    style={{
                      background: 'var(--bg-subtle)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {levelClasses.length} class{levelClasses.length !== 1 ? 'es' : ''}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {levelClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="card"
                      style={{
                        opacity: cls.is_active ? 1 : 0.65,
                        transition: 'opacity 0.2s',
                      }}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Link
                            href={`/classes/${cls.id}`}
                            className="font-semibold hover:underline"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {cls.name}
                          </Link>
                          {cls.academic_year && (
                            <div
                              className="text-xs mt-0.5"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              {cls.academic_year}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleToggleActive(cls)}
                          title={cls.is_active ? 'Deactivate class' : 'Activate class'}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '0.25rem', color: cls.is_active ? 'var(--success)' : 'var(--text-muted)' }}
                        >
                          {cls.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                        </button>
                      </div>

                      {/* Info */}
                      <div className="flex flex-col gap-1.5 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Users size={13} style={{ color: 'var(--text-muted)' }} />
                          <span style={{ color: 'var(--text-secondary)' }}>
                            <span className="font-mono font-medium">{cls.enrollment_count || 0}</span> student
                            {(cls.enrollment_count || 0) !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {cls.schedule && Object.keys(cls.schedule).length > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <CalendarCheck size={13} style={{ color: 'var(--text-muted)' }} />
                            <span style={{ color: 'var(--text-secondary)' }}>
                              {formatSchedule(cls.schedule)}
                            </span>
                          </div>
                        )}
                        {!cls.is_active && (
                          <span
                            className="badge text-xs w-fit"
                            style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}
                          >
                            Inactive
                          </span>
                        )}
                      </div>

                      {/* Quick Links */}
                      <div
                        className="flex gap-1 pt-3"
                        style={{ borderTop: '1px solid var(--border)' }}
                      >
                        <Link
                          href={`/classes/${cls.id}/attendance`}
                          className="btn btn-ghost btn-sm flex-1"
                          style={{ justifyContent: 'center', color: 'var(--accent)', fontSize: '12px' }}
                        >
                          <CalendarCheck size={13} /> Attendance
                        </Link>
                        <Link
                          href={`/classes/${cls.id}/students`}
                          className="btn btn-ghost btn-sm flex-1"
                          style={{ justifyContent: 'center', color: 'var(--success)', fontSize: '12px' }}
                        >
                          <Users size={13} /> Students
                        </Link>
                        <Link
                          href={`/classes/${cls.id}/assignments`}
                          className="btn btn-ghost btn-sm flex-1"
                          style={{ justifyContent: 'center', color: 'var(--warning)', fontSize: '12px' }}
                        >
                          <ClipboardList size={13} /> Work
                        </Link>
                        <Link
                          href={`/classes/${cls.id}`}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '0.3rem', color: 'var(--text-muted)' }}
                        >
                          <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
