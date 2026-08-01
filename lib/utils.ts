import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines Tailwind CSS class names cleanly
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculates grade based on percentage:
 * A* ≥ 90% | A ≥ 80% | B ≥ 70% | C ≥ 60% | D ≥ 50% | E ≥ 40% | U < 40%
 */
export function calculateGrade(percentage: number): string {
  if (percentage >= 90) return 'A*'
  if (percentage >= 80) return 'A'
  if (percentage >= 70) return 'B'
  if (percentage >= 60) return 'C'
  if (percentage >= 50) return 'D'
  if (percentage >= 40) return 'E'
  return 'U'
}

export const getGradeFromPercentage = calculateGrade

/**
 * Calculates percentage rounded to 1 decimal place
 */
export function calculatePercentage(obtained: number, total: number): number {
  if (!total || total <= 0) return 0
  const pct = (obtained / total) * 100
  return Math.round(pct * 10) / 10
}

/**
 * Formats ISO date string to human readable format (e.g. "01 Aug 2026")
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A'
  try {
    const d = new Date(dateString)
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}

export function formatDateTime(dateString?: string): string {
  if (!dateString) return 'N/A'
  try {
    const d = new Date(dateString)
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateString
  }
}

export function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A*':
    case 'A':
      return 'bg-success-light text-success border-success/30'
    case 'B':
    case 'C':
      return 'bg-accent-light text-accent border-accent/30'
    case 'D':
    case 'E':
      return 'bg-warning-light text-warning border-warning/30'
    default:
      return 'bg-danger-light text-danger border-danger/30'
  }
}

export function getAssignmentTypeLabel(type: string): string {
  return type ? type.toUpperCase() : 'ASSIGNMENT'
}

export function getAssignmentTypeBadgeColor(type: string): string {
  return 'badge-primary'
}

/**
 * Triggers file download in browser for Blobs or raw strings
 */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
