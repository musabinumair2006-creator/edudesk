'use client'

import React from 'react'
import { Sidebar } from './Sidebar'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-base flex text-text-primary">
      <Sidebar />
      <main className="flex-1 ml-60 p-8 min-h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

export default AppShell
