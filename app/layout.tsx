import type { Metadata } from 'next'
import './globals.css'
import { AppProvider } from '@/context/AppContext'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'EduDesk — Physics Academy Management',
  description: 'AI-powered LMS assistant for Physics teachers — IGCSE, A-Level, and Edexcel curricula management.',
  keywords: 'physics, LMS, IGCSE, A-Level, Edexcel, education, academy management',
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
