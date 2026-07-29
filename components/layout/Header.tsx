'use client'

import { formatFullDate } from '@/lib/utils'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className="page-header">
      <div className="flex-1">
        <h1 className="text-base font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
      <div
        className="text-xs ml-4 hidden md:block"
        style={{ color: 'var(--text-muted)', flexShrink: 0 }}
      >
        {formatFullDate()}
      </div>
    </header>
  )
}
