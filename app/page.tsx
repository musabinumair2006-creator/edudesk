'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'

export default function RootPage() {
  const router = useRouter()
  const { session, isLoading } = useApp()

  useEffect(() => {
    if (!isLoading) {
      if (session) {
        router.replace('/dashboard')
      } else {
        router.replace('/auth/login')
      }
    }
  }, [session, isLoading, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg-base">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-text-muted font-medium">Loading PhysicsDesk...</p>
      </div>
    </div>
  )
}
