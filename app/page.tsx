'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'

export default function HomePage() {
  const { session, profile, isLoading } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!session) {
      router.replace('/auth/login')
    } else if (profile && !profile.academy_name) {
      router.replace('/auth/setup')
    } else {
      router.replace('/dashboard')
    }
  }, [session, profile, isLoading, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg-base">
      <div className="flex flex-col items-center gap-4">
        <div className="text-2xl font-bold text-text-primary">⚡ PhysicsDesk</div>
        <div className="text-xs text-text-muted">Centaurus Academy Assistant</div>
        <div className="spinner spinner-lg" />
      </div>
    </div>
  )
}
