'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Session, User } from '@supabase/supabase-js'
import type { TeacherProfile, CurriculumLevel, Question } from '@/lib/types'

interface AppContextType {
  session: Session | null
  user: User | null
  profile: TeacherProfile | null
  curriculumLevels: CurriculumLevel[]
  activePaperQuestions: Question[]
  isLoading: boolean
  addQuestionToPaper: (q: Question) => void
  removeQuestionFromPaper: (qId: string) => void
  clearActivePaper: () => void
  refreshProfile: () => Promise<void>
  refreshCurriculumLevels: () => Promise<void>
  signOut: () => Promise<void>
}

const DEFAULT_PROFILE: TeacherProfile = {
  id: 'demo-teacher',
  full_name: 'Dr. Sarah Jenkins',
  email: 'sarah.jenkins@centaurus.edu',
  academy_name: 'Centaurus Academy',
  created_at: new Date().toISOString(),
}

const DEFAULT_LEVELS: CurriculumLevel[] = [
  { id: 'lvl-1', teacher_id: 'demo-teacher', name: 'Cambridge A-Level Physics (9702)', created_at: new Date().toISOString() },
  { id: 'lvl-2', teacher_id: 'demo-teacher', name: 'Cambridge IGCSE Physics (0625)', created_at: new Date().toISOString() },
  { id: 'lvl-3', teacher_id: 'demo-teacher', name: 'Edexcel Physics', created_at: new Date().toISOString() },
]

const AppContext = createContext<AppContextType>({
  session: null,
  user: null,
  profile: DEFAULT_PROFILE,
  curriculumLevels: DEFAULT_LEVELS,
  activePaperQuestions: [],
  isLoading: true,
  addQuestionToPaper: () => {},
  removeQuestionFromPaper: () => {},
  clearActivePaper: () => {},
  refreshProfile: async () => {},
  refreshCurriculumLevels: async () => {},
  signOut: async () => {},
})

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<TeacherProfile | null>(DEFAULT_PROFILE)
  const [curriculumLevels, setCurriculumLevels] = useState<CurriculumLevel[]>(DEFAULT_LEVELS)
  const [activePaperQuestions, setActivePaperQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Restore active paper questions from localStorage on client load
  useEffect(() => {
    try {
      const saved = localStorage.getItem('physicsdesk_active_paper_questions')
      if (saved) {
        setActivePaperQuestions(JSON.parse(saved))
      }
    } catch (e) {
      // Ignored
    }
  }, [])

  const saveActivePaperQuestions = (qs: Question[]) => {
    setActivePaperQuestions(qs)
    try {
      localStorage.setItem('physicsdesk_active_paper_questions', JSON.stringify(qs))
    } catch (e) {
      // Ignored
    }
  }

  const addQuestionToPaper = useCallback((q: Question) => {
    setActivePaperQuestions((prev) => {
      if (prev.some((existing) => existing.id === q.id)) return prev
      const updated = [...prev, q]
      try {
        localStorage.setItem('physicsdesk_active_paper_questions', JSON.stringify(updated))
      } catch {}
      return updated
    })
  }, [])

  const removeQuestionFromPaper = useCallback((qId: string) => {
    setActivePaperQuestions((prev) => {
      const updated = prev.filter((q) => q.id !== qId)
      try {
        localStorage.setItem('physicsdesk_active_paper_questions', JSON.stringify(updated))
      } catch {}
      return updated
    })
  }, [])

  const clearActivePaper = useCallback(() => {
    saveActivePaperQuestions([])
  }, [])

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', userId)
        .single()

      if (!error && data) {
        setProfile(data as TeacherProfile)
      } else {
        setProfile(DEFAULT_PROFILE)
      }
    } catch {
      setProfile(DEFAULT_PROFILE)
    }
  }, [])

  const fetchCurriculumLevels = useCallback(async (userId?: string) => {
    try {
      let query = supabase.from('curriculum_levels').select('*').order('created_at', { ascending: true })
      if (userId) {
        query = query.eq('teacher_id', userId)
      }
      const { data, error } = await query

      if (!error && data && data.length > 0) {
        setCurriculumLevels(data as CurriculumLevel[])
      } else {
        setCurriculumLevels(DEFAULT_LEVELS)
      }
    } catch {
      setCurriculumLevels(DEFAULT_LEVELS)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id)
  }, [user, fetchProfile])

  const refreshCurriculumLevels = useCallback(async () => {
    await fetchCurriculumLevels(user?.id)
  }, [user, fetchCurriculumLevels])

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } catch {}
    setSession(null)
    setUser(null)
    setProfile(DEFAULT_PROFILE)
    setCurriculumLevels(DEFAULT_LEVELS)
    clearActivePaper()
  }, [clearActivePaper])

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null

    async function initAuth() {
      try {
        const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }))
        const currentSession = data?.session ?? null
        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        if (currentSession?.user) {
          await Promise.all([
            fetchProfile(currentSession.user.id),
            fetchCurriculumLevels(currentSession.user.id),
          ]).catch(() => {})
        } else {
          setProfile(DEFAULT_PROFILE)
          setCurriculumLevels(DEFAULT_LEVELS)
        }
      } catch (err) {
        console.warn('Auth init warning:', err)
      } finally {
        setIsLoading(false)
      }

      try {
        const res = supabase.auth.onAuthStateChange(async (_event, newSession) => {
          setSession(newSession)
          setUser(newSession?.user ?? null)
          if (newSession?.user) {
            await Promise.all([
              fetchProfile(newSession.user.id),
              fetchCurriculumLevels(newSession.user.id),
            ]).catch(() => {})
          } else {
            setProfile(DEFAULT_PROFILE)
            setCurriculumLevels(DEFAULT_LEVELS)
          }
          setIsLoading(false)
        })
        subscription = res.data.subscription
      } catch (err) {
        console.warn('Auth listener warning:', err)
      }
    }

    initAuth()

    return () => {
      if (subscription) subscription.unsubscribe()
    }
  }, [fetchProfile, fetchCurriculumLevels])

  return (
    <AppContext.Provider
      value={{
        session,
        user,
        profile: profile || DEFAULT_PROFILE,
        curriculumLevels,
        activePaperQuestions,
        isLoading,
        addQuestionToPaper,
        removeQuestionFromPaper,
        clearActivePaper,
        refreshProfile,
        refreshCurriculumLevels,
        signOut,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
