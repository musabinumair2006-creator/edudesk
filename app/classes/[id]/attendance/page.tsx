'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { AttendanceSheet } from '@/components/attendance/AttendanceSheet'
import { supabase } from '@/lib/supabase'
import type { Class, Student } from '@/lib/types'
import { ArrowLeft } from 'lucide-react'

export default function ClassAttendancePage() {
  const params = useParams()
  const classId = params.id as string

  const [cls, setCls] = useState<Class | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (classId) loadClassAndStudents()
  }, [classId])

  async function loadClassAndStudents() {
    setIsLoading(true)
    try {
      // Fetch Class
      const { data: cData } = await supabase
        .from('classes')
        .select('*, curriculum_level:curriculum_levels(name)')
        .eq('id', classId)
        .single()

      if (cData) {
        setCls(cData as Class)
      } else {
        setCls({
          id: classId,
          teacher_id: 'demo',
          name: 'Year 13 A-Level Physics Batch A',
          academic_year: '2025-2026',
          is_active: true,
          created_at: new Date().toISOString(),
        })
      }

      // Fetch Students
      const { data: sData } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', classId)
        .order('roll_number', { ascending: true })

      if (sData && sData.length > 0) {
        setStudents(sData as Student[])
      } else {
        // Fallback demo students if roster is empty
        setStudents([
          { id: 's-1', teacher_id: 'demo', class_id: classId, full_name: 'Alexander Wright', roll_number: 'P-101', is_active: true, created_at: '' },
          { id: 's-2', teacher_id: 'demo', class_id: classId, full_name: 'Beatrice Chen', roll_number: 'P-102', is_active: true, created_at: '' },
          { id: 's-3', teacher_id: 'demo', class_id: classId, full_name: 'Carlos Mendez', roll_number: 'P-103', is_active: true, created_at: '' },
          { id: 's-4', teacher_id: 'demo', class_id: classId, full_name: 'Dina Patel', roll_number: 'P-104', is_active: true, created_at: '' },
          { id: 's-5', teacher_id: 'demo', class_id: classId, full_name: 'Ethan Hunt', roll_number: 'P-105', is_active: true, created_at: '' },
          { id: 's-6', teacher_id: 'demo', class_id: classId, full_name: 'Fiona Gallagher', roll_number: 'P-106', is_active: true, created_at: '' },
        ])
      }
    } catch (err) {
      console.warn('Attendance load error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || !cls) {
    return (
      <AppShell>
        <div className="p-12 text-center text-xs text-text-muted">Loading attendance sheet...</div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <Link href="/classes" className="p-1.5 rounded-md hover:bg-bg-subtle text-text-secondary">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-text-primary tracking-tight">
              Attendance Register — {cls.name}
            </h1>
            <p className="text-xs text-text-muted">
              {cls.curriculum_level?.name || 'A-Level Physics'} • {students.length} Enrolled Students
            </p>
          </div>
        </div>

        {/* Keyboard-Friendly Attendance Component */}
        <AttendanceSheet classId={classId} students={students} />
      </div>
    </AppShell>
  )
}
