import type { Metadata } from 'next'
import './globals.css'
import { AppProvider } from '@/context/AppContext'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'PhysicsDesk — Centaurus Academy Assistant',
  description: 'AI-powered assistant for Physics teachers at Centaurus Academy — file parsing, grade analytics, AI suggestions, and report generation.',
  keywords: 'physics, physicsdesk, centaurus academy, LMS assistant, IGCSE, A-Level, Edexcel',
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
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
