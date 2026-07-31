'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import SuggestionReviewPanel from '@/components/suggestions/SuggestionReviewPanel'
import { getAISuggestionById } from '@/lib/supabase/queries/suggestions'
import type { AISuggestion } from '@/lib/types'
import { ArrowLeft } from 'lucide-react'

export default function ReviewSuggestionPage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()

  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadSuggestion() {
      setIsLoading(true)
      const data = await getAISuggestionById(id)
      setSuggestion(data)
      setIsLoading(false)
    }
    loadSuggestion()
  }, [id])

  if (isLoading) {
    return (
      <AppShell>
        <Header title="Review Suggestion" />
        <div className="flex justify-center items-center py-20">
          <span className="spinner spinner-lg" />
        </div>
      </AppShell>
    )
  }

  if (!suggestion) {
    return (
      <AppShell>
        <Header title="Suggestion Not Found" />
        <div className="page-body text-center py-16 text-text-muted">
          <p>The requested AI suggestion could not be found.</p>
          <Link href="/suggestions" className="btn btn-primary btn-sm mt-4">
            Return to Suggestions Queue
          </Link>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <Header
        title={suggestion.title}
        subtitle={`AI Suggestion • Type: ${suggestion.suggestion_type.replace('_', ' ')}`}
        actions={
          <Link href="/suggestions" className="btn btn-secondary btn-sm">
            <ArrowLeft size={14} /> Back to Suggestions
          </Link>
        }
      />

      <div className="page-body max-w-5xl mx-auto">
        <SuggestionReviewPanel suggestion={suggestion} onApproved={() => router.push('/suggestions')} />
      </div>
    </AppShell>
  )
}
