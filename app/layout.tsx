import type { Metadata } from 'next'
import '../styles/globals.css'
import { AppProvider } from '@/context/AppContext'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'PhysicsDesk — Centaurus Academy Physics Assistant',
  description: 'AI-Powered Exam & Assignment Creator, Past Paper Indexer, and Question Bank Manager for Physics Teachers.',
  keywords: 'physics, physicsdesk, centaurus academy, IGCSE, A-Level, Edexcel, exam creator, question bank',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  )
}
