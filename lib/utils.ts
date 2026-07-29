import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isToday, isThisWeek } from 'date-fns'
import type { AttendanceStatus } from '@/lib/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date formatting
export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy')
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy, h:mm a')
}

export function formatDateForInput(date: string | Date): string {
  return format(new Date(date), 'yyyy-MM-dd')
}

export function formatTimeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function getDayOfWeek(): string {
  return format(new Date(), 'EEE') // Mon, Tue, etc.
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function formatFullDate(): string {
  return format(new Date(), 'EEEE, MMMM d, yyyy')
}

// Attendance
export function getAttendanceColor(status: AttendanceStatus): string {
  switch (status) {
    case 'present': return 'text-success bg-success-light border-success'
    case 'absent': return 'text-danger bg-danger-light border-danger'
    case 'late': return 'text-warning bg-warning-light border-warning'
    case 'excused': return 'text-accent bg-accent-light border-accent'
    default: return 'text-text-secondary bg-bg-subtle border-border'
  }
}

export function getAttendancePercentageColor(pct: number): string {
  if (pct >= 80) return 'text-success'
  if (pct >= 60) return 'text-warning'
  return 'text-danger'
}

export function getAttendancePercentageBg(pct: number): string {
  if (pct >= 80) return 'bg-success-light text-success'
  if (pct >= 60) return 'bg-warning-light text-warning'
  return 'bg-danger-light text-danger'
}

// Marks / Grades
export function getGradeFromPercentage(pct: number): string {
  if (pct >= 90) return 'A*'
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B'
  if (pct >= 60) return 'C'
  if (pct >= 50) return 'D'
  if (pct >= 40) return 'E'
  return 'U'
}

export function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A*':
    case 'A': return 'text-success bg-success-light'
    case 'B': return 'text-accent bg-accent-light'
    case 'C': return 'text-warning bg-warning-light'
    case 'D':
    case 'E': return 'text-danger bg-danger-light'
    case 'U': return 'text-text-muted bg-bg-subtle'
    default: return 'text-text-secondary bg-bg-subtle'
  }
}

export function getMarksColor(pct: number): string {
  if (pct >= 70) return 'text-success'
  if (pct >= 50) return 'text-warning'
  return 'text-danger'
}

// Assignment type display
export function getAssignmentTypeLabel(type: string): string {
  switch (type) {
    case 'assignment': return 'Assignment'
    case 'quiz': return 'Quiz'
    case 'classwork': return 'Classwork'
    case 'midterm': return 'Mid-Term'
    case 'finalterm': return 'Final Term'
    default: return type
  }
}

export function getAssignmentTypeBadgeColor(type: string): string {
  switch (type) {
    case 'assignment': return 'bg-accent-light text-accent'
    case 'quiz': return 'bg-warning-light text-warning'
    case 'classwork': return 'bg-success-light text-success'
    case 'midterm': return 'bg-danger-light text-danger'
    case 'finalterm': return 'bg-danger-light text-danger'
    default: return 'bg-bg-subtle text-text-secondary'
  }
}

// Schedule display
export function formatSchedule(schedule: { days?: string[]; time?: string }): string {
  if (!schedule?.days?.length) return 'No schedule set'
  const days = schedule.days.join(', ')
  const time = schedule.time || ''
  return time ? `${days} at ${time}` : days
}

// Status badge
export function getSubmissionStatusColor(status: string): string {
  switch (status) {
    case 'returned': return 'bg-success-light text-success'
    case 'checked': return 'bg-accent-light text-accent'
    case 'submitted': return 'bg-warning-light text-warning'
    default: return 'bg-bg-subtle text-text-secondary'
  }
}

// Report rating
export function getRatingColor(rating: string): string {
  switch (rating) {
    case 'Excellent': return 'text-success bg-success-light'
    case 'Good': return 'text-accent bg-accent-light'
    case 'Satisfactory': return 'text-warning bg-warning-light'
    case 'Needs Improvement': return 'text-danger bg-danger-light'
    default: return 'text-text-secondary bg-bg-subtle'
  }
}

// CSV export
export function downloadCSV(data: Record<string, unknown>[], filename: string): void {
  if (!data.length) return
  const headers = Object.keys(data[0])
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h]
      const str = val === null || val === undefined ? '' : String(val)
      return str.includes(',') ? `"${str}"` : str
    }).join(',')
  )
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// Truncate text
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

// Check if date is today or this week
export { isToday, isThisWeek }
