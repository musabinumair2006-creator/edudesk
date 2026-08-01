'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { PaperBuilder } from '@/components/papers/PaperBuilder'
import { useApp } from '@/context/AppContext'
import { supabase } from '@/lib/supabase'
import type { Class } from '@/lib/types'
import { FilePlus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CreatePaperPage() {
  const router = useRouter()
  const { curriculumLevels } = useApp()
  const [classes, setClasses] = useState<Class[]>([])

  useEffect(() => {
    loadClasses()
  }, [])

  async function loadClasses() {
    try {
      const { data } = await supabase.from('classes').select('*').eq('is_active', true)
      if (data) setClasses(data as Class[])
    } catch (err) {
      console.warn('Classes fetch error:', err)
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <Link href="/papers" className="p-1.5 rounded-md hover:bg-bg-subtle text-text-secondary">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-text-primary tracking-tight flex items-center gap-2">
                <FilePlus size={20} className="text-accent" />
                Exam & Assignment Paper Builder
              </h1>
              <p className="text-xs text-text-muted">
                Create official board-style Physics papers using pulled questions or AI generation
              </p>
            </div>
          </div>
        </div>

        {/* Core 3-Panel Paper Builder Component */}
        <PaperBuilder classes={classes} curriculumLevels={curriculumLevels} />
      </div>
    </AppShell>
  )
}
