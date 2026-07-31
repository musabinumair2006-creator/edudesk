'use client'

import React from 'react'
import Link from 'next/link'
import type { Assignment } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { FileText, ArrowRight, Sparkles } from 'lucide-react'

interface AssignmentCardProps {
  assignment: Assignment
}

export default function AssignmentCard({ assignment }: AssignmentCardProps) {
  return (
    <div className="card flex flex-col justify-between p-4 gap-3">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="badge bg-accent-light text-accent capitalize">{assignment.assignment_type}</span>
          {assignment.ai_generated && (
            <span className="badge bg-amber-100 text-amber-800 flex items-center gap-1">
              <Sparkles size={10} /> AI Calibrated
            </span>
          )}
        </div>

        <h3 className="font-bold text-sm text-text-primary mt-1">{assignment.title}</h3>

        <div className="text-xs text-text-secondary line-clamp-2">{assignment.content}</div>
      </div>

      <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
        <span className="font-mono text-text-muted">{assignment.total_marks} Marks</span>
        <Link href={`/assignments/${assignment.id}`} className="btn btn-secondary btn-sm flex items-center gap-1">
          <span>View Details</span>
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  )
}
