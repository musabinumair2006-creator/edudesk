'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { getClasses } from '@/lib/supabase/queries/classes'
import type { Class } from '@/lib/types'
import { BookOpen, Plus, Users, Calendar, ArrowRight } from 'lucide-react'

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getClasses().then((data) => {
      setClasses(data)
      setIsLoading(false)
    })
  }, [])

  return (
    <AppShell>
      <Header
        title="Physics Classes"
        subtitle="Manage physics classes and course rosters for Centaurus Academy"
        actions={
          <Link href="/classes/new" className="btn btn-primary btn-sm">
            <Plus size={14} /> Add New Class
          </Link>
        }
      />

      <div className="page-body">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <span className="spinner spinner-lg" />
          </div>
        ) : classes.length === 0 ? (
          <div className="card text-center py-16 text-text-muted">
            <BookOpen size={40} className="mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-text-primary">No physics classes found</p>
            <p className="text-xs mt-1">Create your first class section to get started.</p>
            <Link href="/classes/new" className="btn btn-primary btn-sm mt-4">
              <Plus size={14} /> Create Class
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <div key={cls.id} className="card flex flex-col justify-between p-5 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="badge bg-accent-light text-accent">
                      {cls.curriculum_level?.name || 'Physics'}
                    </span>
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <Calendar size={12} /> {cls.academic_year || '2025-2026'}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-text-primary mt-1">{cls.name}</h3>

                  <div className="mt-3 flex items-center gap-3 text-xs text-text-secondary">
                    <span className="flex items-center gap-1">
                      <Users size={14} className="text-text-muted" />
                      <strong>{cls.student_count || 24}</strong> Students
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <Link href={`/classes/${cls.id}/attendance`} className="text-xs text-accent hover:underline">
                    Mark Attendance
                  </Link>
                  <Link href={`/classes/${cls.id}`} className="btn btn-secondary btn-sm flex items-center gap-1">
                    <span>View Class</span>
                    <ArrowRight size={12} />
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
