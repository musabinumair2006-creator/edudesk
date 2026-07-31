'use client'

import React from 'react'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className="page-header justify-between">
      <div>
        <h1 className="text-base font-bold text-text-primary tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
      </div>

      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
