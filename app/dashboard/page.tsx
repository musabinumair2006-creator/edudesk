'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useApp } from '@/context/AppContext'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { createClient } from '@/lib/supabase/client'
import {
  BookOpen,
  Users,
  ClipboardCheck,
  Calendar,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react'
import {
  getGreeting,
  formatDate,
  formatTimeAgo,
  formatSchedule,
  getAssignmentTypeLabel,
} from '@/lib/utils'
import type { DashboardStats, PendingSubmission } from '@/lib/types'

interface TodayClassRow {
  id: string
  name: string
  curriculum_level: string
  time: string
  student_count: number
}

export default function DashboardPage() {
  const { profile } = useApp()
  const supabase = createClient()

  const [stats, setStats] = useState<DashboardStats>({
    classes_today: 0,
    total_students: 0,
    pending_submissions: 0,
    assignments_due_this_week: 0,
  })
  const [todayClasses, setTodayClasses] = useState<TodayClassRow[]>([])
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadDashboard() {
    setIsLoading(true)
    const today = new Date()
    const dayName = today.toLocaleDateString('en-US', { weekday: 'short' })
    const weekEnd = new Date(today)
    weekEnd.setDate(today.getDate() + 7)

    // Fetch all classes
    const { data: allClasses } = await supabase
      .from('classes')
      .select(`*, curriculum_level:curriculum_levels(name)`)
      .eq('is_active', true)

    // Filter today's classes
    const todayClassesRaw = (allClasses || []).filter((c) => {
      const sched = c.schedule as { days?: string[]; time?: string }
      return sched?.days?.includes(dayName)
    })

    // Get enrollment counts
    const classIds = todayClassesRaw.map((c) => c.id)
    const countMap: Record<string, number> = {}
    if (classIds.length > 0) {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('class_id')
        .in('class_id', classIds)
      ;(enrollments || []).forEach((e) => {
        countMap[e.class_id] = (countMap[e.class_id] || 0) + 1
      })
    }

    const todayClassesFormatted: TodayClassRow[] = todayClassesRaw.map((c) => ({
      id: c.id,
      name: c.name,
      curriculum_level: (c.curriculum_level as { name: string } | null)?.name || 'N/A',
      time: (c.schedule as { days?: string[]; time?: string })?.time || '',
      student_count: countMap[c.id] || 0,
    }))

    // Total students
    const { count: studentCount } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Pending submissions
    const { data: pendingSubs, count: pendingCount } = await supabase
      .from('submissions')
      .select(`
        id, submitted_at, assignment_id, student_id,
        student:students(full_name),
        assignment:assignments(title, class:classes(name))
      `, { count: 'exact' })
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: false })
      .limit(10)

    // Assignments due this week
    const { count: dueCount } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true })
      .gte('due_date', today.toISOString())
      .lte('due_date', weekEnd.toISOString())

    // Format pending submissions
    const formattedPending: PendingSubmission[] = (pendingSubs || []).map((s: any) => {
      const studentObj = Array.isArray(s.student) ? s.student[0] : s.student
      const assignmentObj = Array.isArray(s.assignment) ? s.assignment[0] : s.assignment
      const classObj = assignmentObj && Array.isArray(assignmentObj.class) ? assignmentObj.class[0] : assignmentObj?.class

      return {
        id: s.id,
        student_name: studentObj?.full_name || 'Unknown',
        assignment_title: assignmentObj?.title || '',
        class_name: classObj?.name || '',
        submitted_at: s.submitted_at,
        assignment_id: s.assignment_id,
        student_id: s.student_id,
      }
    })

    setStats({
      classes_today: todayClassesFormatted.length,
      total_students: studentCount || 0,
      pending_submissions: pendingCount || 0,
      assignments_due_this_week: dueCount || 0,
    })
    setTodayClasses(todayClassesFormatted)
    setPendingSubmissions(formattedPending)
    setIsLoading(false)
  }

  const STAT_CARDS = [
    {
      label: 'Classes Today',
      value: stats.classes_today,
      icon: Calendar,
      color: 'var(--accent)',
      bg: 'var(--accent-light)',
    },
    {
      label: 'Total Students',
      value: stats.total_students,
      icon: Users,
      color: 'var(--success)',
      bg: 'var(--success-light)',
    },
    {
      label: 'Pending Submissions',
      value: stats.pending_submissions,
      icon: ClipboardCheck,
      color: 'var(--warning)',
      bg: 'var(--warning-light)',
    },
    {
      label: 'Due This Week',
      value: stats.assignments_due_this_week,
      icon: BookOpen,
      color: 'var(--danger)',
      bg: 'var(--danger-light)',
    },
  ]

  return (
    <AppShell>
      <Header
        title={`${getGreeting()}, ${profile?.full_name?.split(' ')[0] || 'Teacher'}`}
        subtitle={profile?.academy_name || 'Physics Academy'}
      />

      <div className="page-body">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner spinner-lg" />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Stats Row */}
            <div className="grid-4">
              {STAT_CARDS.map((stat) => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} className="stat-card">
                    <div className="flex items-center justify-between">
                      <div
                        className="p-2 rounded-md"
                        style={{ background: stat.bg }}
                      >
                        <Icon size={18} style={{ color: stat.color }} />
                      </div>
                    </div>
                    <div className="stat-value font-mono">{stat.value}</div>
                    <div
                      className="text-sm font-medium"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {stat.label}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Today's Classes */}
              <div className="card">
                <div className="card-header">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} style={{ color: 'var(--accent)' }} />
                    <h2 className="font-semibold text-sm">Today&apos;s Classes</h2>
                  </div>
                  <Link href="/classes" className="btn btn-ghost btn-sm">
                    All classes <ChevronRight size={13} />
                  </Link>
                </div>

                {todayClasses.length === 0 ? (
                  <div className="empty-state py-8">
                    <Calendar size={32} />
                    <div>
                      <p className="font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>
                        No classes scheduled for today
                      </p>
                      <p className="text-xs mt-1">Enjoy your day off, or check your schedule.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {todayClasses.map((cls) => (
                      <div
                        key={cls.id}
                        className="flex items-center gap-3 p-3 rounded-md"
                        style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}
                      >
                        <div
                          className="w-1 self-stretch rounded-full flex-shrink-0"
                          style={{ background: 'var(--accent)', minHeight: '36px' }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{cls.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className="badge"
                              style={{
                                background: 'var(--accent-light)',
                                color: 'var(--accent)',
                                fontSize: '11px',
                              }}
                            >
                              {cls.curriculum_level}
                            </span>
                            {cls.time && (
                              <span
                                className="text-xs font-mono"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                {cls.time}
                              </span>
                            )}
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              · {cls.student_count} student{cls.student_count !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <Link
                          href={`/classes/${cls.id}/attendance`}
                          className="btn btn-secondary btn-sm flex-shrink-0"
                        >
                          Attendance
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pending Submissions */}
              <div className="card">
                <div className="card-header">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck size={16} style={{ color: 'var(--warning)' }} />
                    <h2 className="font-semibold text-sm">Pending Reviews</h2>
                    {stats.pending_submissions > 0 && (
                      <span
                        className="badge font-mono"
                        style={{
                          background: 'var(--warning-light)',
                          color: 'var(--warning)',
                          fontSize: '11px',
                        }}
                      >
                        {stats.pending_submissions}
                      </span>
                    )}
                  </div>
                  <Link href="/assignments" className="btn btn-ghost btn-sm">
                    All assignments <ChevronRight size={13} />
                  </Link>
                </div>

                {pendingSubmissions.length === 0 ? (
                  <div className="empty-state py-8">
                    <CheckCircle size={32} style={{ color: 'var(--success)' }} />
                    <div>
                      <p className="font-medium text-sm" style={{ color: 'var(--success)' }}>
                        All caught up!
                      </p>
                      <p className="text-xs mt-1">All submissions are checked.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {pendingSubmissions.slice(0, 6).map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center gap-3 p-3 rounded-md"
                        style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}
                      >
                        <Clock size={14} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {sub.student_name}
                          </div>
                          <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                            {sub.assignment_title} · {sub.class_name}
                          </div>
                          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {formatTimeAgo(sub.submitted_at)}
                          </div>
                        </div>
                        <Link
                          href={`/assignments/${sub.assignment_id}/submissions/${sub.student_id}`}
                          className="btn btn-secondary btn-sm flex-shrink-0"
                        >
                          Review
                        </Link>
                      </div>
                    ))}
                    {stats.pending_submissions > 6 && (
                      <Link
                        href="/assignments"
                        className="text-center text-sm py-2"
                        style={{ color: 'var(--accent)' }}
                      >
                        + {stats.pending_submissions - 6} more pending
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <div className="card-header">
                <h2 className="font-semibold text-sm">Quick Actions</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Add Student', href: '/students/new', icon: Users, color: 'var(--success)' },
                  { label: 'New Class', href: '/classes/new', icon: BookOpen, color: 'var(--accent)' },
                  { label: 'Create Assignment', href: '/assignments/new', icon: ClipboardCheck, color: 'var(--warning)' },
                  { label: 'Generate Paper', href: '/papers/generate', icon: AlertCircle, color: 'var(--danger)' },
                ].map((action) => {
                  const Icon = action.icon
                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="flex flex-col items-center gap-2 p-4 rounded-md text-center transition-all"
                      style={{
                        border: '1px solid var(--border)',
                        color: 'var(--text-secondary)',
                        background: 'var(--bg-surface)',
                      }}
                    >
                      <Icon size={20} style={{ color: action.color }} />
                      <span className="text-sm font-medium">{action.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
