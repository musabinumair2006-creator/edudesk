'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import Sidebar from './Sidebar'

interface AppShellProps {
  children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const { session, isLoading } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace('/auth/login')
    }
  }, [session, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-base)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>⚡ EduDesk</div>
          <div className="spinner spinner-lg" />
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
