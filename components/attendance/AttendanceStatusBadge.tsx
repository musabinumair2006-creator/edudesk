import type { AttendanceStatus } from '@/lib/types'

interface Props {
  status: AttendanceStatus
  size?: 'sm' | 'md'
}

const CONFIG: Record<AttendanceStatus, { label: string; bg: string; color: string }> = {
  present: { label: 'Present', bg: 'var(--success-light)', color: 'var(--success)' },
  absent: { label: 'Absent', bg: 'var(--danger-light)', color: 'var(--danger)' },
  late: { label: 'Late', bg: 'var(--warning-light)', color: 'var(--warning)' },
  excused: { label: 'Excused', bg: 'var(--accent-light)', color: 'var(--accent)' },
}

export default function AttendanceStatusBadge({ status, size = 'md' }: Props) {
  const cfg = CONFIG[status]
  return (
    <span
      className="badge"
      style={{
        background: cfg.bg,
        color: cfg.color,
        fontSize: size === 'sm' ? '11px' : '0.75rem',
        padding: size === 'sm' ? '0.15rem 0.5rem' : '0.2rem 0.625rem',
      }}
    >
      {cfg.label}
    </span>
  )
}
