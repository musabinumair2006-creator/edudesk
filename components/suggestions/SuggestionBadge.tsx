'use client'

import React from 'react'
import type { AISuggestionType } from '@/lib/types'

interface SuggestionBadgeProps {
  type: AISuggestionType
}

export default function SuggestionBadge({ type }: SuggestionBadgeProps) {
  let color = 'bg-accent-light text-accent border-accent'
  let label = type.replace('_', ' ')

  switch (type) {
    case 'generated_assignment':
      color = 'bg-accent-light text-accent'
      label = 'Assignment'
      break
    case 'generated_paper':
      color = 'bg-purple-100 text-purple-800'
      label = 'Exam Paper'
      break
    case 'submission_feedback':
      color = 'bg-emerald-100 text-emerald-800'
      label = 'Feedback'
      break
    case 'student_report':
    case 'class_report':
      color = 'bg-blue-100 text-blue-800'
      label = 'Report'
      break
    case 'attendance_alert':
      color = 'bg-amber-100 text-amber-800'
      label = 'Attendance Alert'
      break
    case 'performance_flag':
      color = 'bg-red-100 text-red-800'
      label = 'Performance Flag'
      break
  }

  return <span className={`badge capitalize ${color}`}>{label}</span>
}
