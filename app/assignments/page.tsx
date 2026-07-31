'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import AssignmentCard from '@/components/assignments/AssignmentCard'
import { getAssignments } from '@/lib/supabase/queries/assignments'
import type { Assignment } from '@/lib/types'
import { FileText, Sparkles, Plus } from 'lucide-react'

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getAssignments().then((data) => {
      setAssignments(data)
      setIsLoading(false)
    })
  }, [])

  return (
    <AppShell>
      <Header
        title="Physics Assignments & Exams"
        subtitle="Manage, draft, and AI-generate syllabus-calibrated physics tests for Centaurus Academy"
        actions={
          <Link href="/assignments/generate" className="btn btn-primary btn-sm">
            <Sparkles size={14} /> AI Generate Assignment
          </Link>
        }
      />

      <div className="page-body">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <span className="spinner spinner-lg" />
          </div>
        ) : assignments.length === 0 ? (
          <div className="card text-center py-16 text-text-muted">
            <FileText size={40} className="mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-text-primary">No assignments found</p>
            <p className="text-xs mt-1">Generate an AI assignment or create one manually.</p>
            <Link href="/assignments/generate" className="btn btn-primary btn-sm mt-4">
              <Sparkles size={14} /> AI Generator
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.map((assignment) => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
