'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { useApp } from '@/context/AppContext'
import { getGreeting, formatFullDate, formatDate } from '@/lib/utils'
import {
  Lightbulb,
  FileText,
  Users,
  UploadCloud,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react'
import { getAISuggestions } from '@/lib/supabase/queries/suggestions'
import { getUploads } from '@/lib/supabase/queries/uploads'
import { getStudents } from '@/lib/supabase/queries/students'
import { getAssignments } from '@/lib/supabase/queries/assignments'
import type { AISuggestion, Upload, Student, Assignment } from '@/lib/types'

export default function DashboardPage() {
  const { profile } = useApp()
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [uploads, setUploads] = useState<Upload[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true)
      const [sugData, uplData, stdData, asgData] = await Promise.all([
        getAISuggestions(),
        getUploads(),
        getStudents(),
        getAssignments(),
      ])
      setSuggestions(sugData)
      setUploads(uplData)
      setStudents(stdData)
      setAssignments(asgData)
      setIsLoading(false)
    }
    loadDashboardData()
  }, [])

  const pendingSuggestions = suggestions.filter((s) => s.status === 'pending')
  const recentUploads = uploads.slice(0, 5)

  // Flagged students (automatic attendance or performance flags)
  const flaggedSuggestions = suggestions.filter(
    (s) => s.suggestion_type === 'attendance_alert' || s.suggestion_type === 'performance_flag'
  )

  return (
    <AppShell>
      <Header
        title={`${getGreeting()}, ${profile?.full_name || 'Teacher'}`}
        subtitle={`${profile?.academy_name || 'Centaurus Academy'} · Physics Command Hub`}
      />

      <div className="page-body flex flex-col gap-6">
        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between">
              <span className="label-sm">Pending AI Review</span>
              <Lightbulb size={18} className="text-amber-500" />
            </div>
            <div className="stat-value">{pendingSuggestions.length}</div>
            <div className="text-xs text-text-muted">Suggestions awaiting approval</div>
          </div>

          <div className="stat-card border-l-4 border-l-accent">
            <div className="flex items-center justify-between">
              <span className="label-sm">Assignments Created</span>
              <FileText size={18} className="text-accent" />
            </div>
            <div className="stat-value">{assignments.length}</div>
            <div className="text-xs text-text-muted">This academic term</div>
          </div>

          <div className="stat-card border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between">
              <span className="label-sm">Active Students</span>
              <Users size={18} className="text-emerald-500" />
            </div>
            <div className="stat-value">{students.length}</div>
            <div className="text-xs text-text-muted">Enrolled in Physics</div>
          </div>

          <div className="stat-card border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <span className="label-sm">LMS Files Processed</span>
              <UploadCloud size={18} className="text-purple-500" />
            </div>
            <div className="stat-value">{uploads.length}</div>
            <div className="text-xs text-text-muted">This week</div>
          </div>
        </div>

        {/* Main 2 Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Suggestions Panel */}
          <div className="card lg:col-span-2 flex flex-col justify-between">
            <div>
              <div className="card-header">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500" />
                  <h2 className="font-semibold text-sm">Pending AI Suggestions</h2>
                  {pendingSuggestions.length > 0 && (
                    <span className="badge bg-amber-100 text-amber-800 font-mono">
                      {pendingSuggestions.length}
                    </span>
                  )}
                </div>
                <Link href="/suggestions" className="text-xs text-accent hover:underline flex items-center gap-1">
                  View all suggestions <ArrowRight size={12} />
                </Link>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <span className="spinner spinner-md" />
                </div>
              ) : pendingSuggestions.length === 0 ? (
                <div className="empty-state py-8">
                  <Lightbulb size={32} />
                  <p className="text-sm font-medium text-text-secondary">
                    No suggestions waiting. Upload a file from your LMS to get started.
                  </p>
                  <Link href="/upload" className="btn btn-primary btn-sm mt-2">
                    <UploadCloud size={14} /> Upload LMS File
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {pendingSuggestions.map((sug) => (
                    <div
                      key={sug.id}
                      className="p-3.5 rounded-lg border border-border bg-bg-surface flex items-center justify-between hover:bg-bg-subtle transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
                          <Lightbulb size={18} />
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-text-primary">{sug.title}</div>
                          <div className="text-xs text-text-muted flex items-center gap-2 mt-0.5">
                            <span className="capitalize">{sug.suggestion_type.replace('_', ' ')}</span>
                            <span>•</span>
                            <span>{formatDate(sug.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      <Link href={`/suggestions/${sug.id}`} className="btn btn-secondary btn-sm">
                        Review
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent LMS Uploads Panel */}
          <div className="card flex flex-col justify-between">
            <div>
              <div className="card-header">
                <div className="flex items-center gap-2">
                  <UploadCloud size={16} className="text-accent" />
                  <h2 className="font-semibold text-sm">Recent LMS Uploads</h2>
                </div>
                <Link href="/upload" className="text-xs text-accent hover:underline">
                  Upload
                </Link>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <span className="spinner spinner-md" />
                </div>
              ) : recentUploads.length === 0 ? (
                <div className="empty-state py-6">
                  <p className="text-xs">No files uploaded yet.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {recentUploads.map((upl) => (
                    <div
                      key={upl.id}
                      className="p-2.5 rounded-md border border-border flex items-center justify-between text-xs"
                    >
                      <div className="truncate max-w-[170px]">
                        <div className="font-medium truncate text-text-primary">{upl.file_name}</div>
                        <div className="text-text-muted capitalize">{upl.detected_data_type || 'Processing'}</div>
                      </div>
                      <span
                        className={`badge ${
                          upl.parse_status === 'complete'
                            ? 'bg-success-light text-success'
                            : upl.parse_status === 'failed'
                            ? 'bg-danger-light text-danger'
                            : 'bg-warning-light text-warning'
                        }`}
                      >
                        {upl.parse_status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Flagged Students Panel (Automatic Flags) */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-danger" />
              <h2 className="font-semibold text-sm">Automatically Flagged Students</h2>
            </div>
            <span className="text-xs text-text-muted">No teacher approval needed to view</span>
          </div>

          {flaggedSuggestions.length === 0 ? (
            <div className="py-6 text-center text-xs text-text-muted">
              No students currently flagged for attendance or performance concerns.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {flaggedSuggestions.map((flag) => (
                <div
                  key={flag.id}
                  className="p-3.5 rounded-lg border border-danger/30 bg-danger-light/30 flex flex-col justify-between gap-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-sm text-text-primary">{flag.title}</div>
                      <div className="text-xs text-text-muted mt-0.5">
                        {flag.content.student_name || 'Student'} • {flag.content.class_name || 'Physics'}
                      </div>
                    </div>
                    <span className="badge bg-danger text-white text-[10px]">
                      {flag.suggestion_type === 'attendance_alert' ? 'Attendance' : 'Performance'}
                    </span>
                  </div>

                  <p className="text-xs text-text-secondary line-clamp-2">
                    {flag.content.recommended_action || flag.content.suggested_message}
                  </p>

                  <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                    <span className="text-[10px] text-text-muted">{formatDate(flag.created_at)}</span>
                    <Link href={`/suggestions/${flag.id}`} className="btn btn-secondary btn-sm text-[11px]">
                      Review Action
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
