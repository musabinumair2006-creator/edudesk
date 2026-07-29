'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Session, User } from '@supabase/supabase-js'
import type { TeacherProfile, CurriculumLevel, Class } from '@/lib/types'

interface AppContextType {
  session: Session | null
  user: User | null
  profile: TeacherProfile | null
  curriculumLevels: CurriculumLevel[]
  activeClass: Class | null
  isLoading: boolean
  setActiveClass: (cls: Class | null) => void
  refreshProfile: () => Promise<void>
  refreshCurriculumLevels: () => Promise<void>
  signOut: () => Promise<void>
}

const AppContext = createContext<AppContextType>({
  session: null,
  user: null,
  profile: null,
  curriculumLevels: [],
  activeClass: null,
  isLoading: true,
  setActiveClass: () => {},
  refreshProfile: async () => {},
  refreshCurriculumLevels: async () => {},
  signOut: async () => {},
})

export function AppProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<TeacherProfile | null>(null)
  const [curriculumLevels, setCurriculumLevels] = useState<CurriculumLevel[]>([])
  const [activeClass, setActiveClass] = useState<Class | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('teacher_profile')
      .select('*')
      .eq('id', userId)
      .single()

    if (!error && data) {
      setProfile(data as TeacherProfile)
    }
  }, [supabase])

  const fetchCurriculumLevels = useCallback(async () => {
    const { data, error } = await supabase
      .from('curriculum_levels')
      .select('*')
      .order('created_at', { ascending: true })

    if (!error && data) {
      setCurriculumLevels(data as CurriculumLevel[])
    }
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id)
  }, [user, fetchProfile])

  const refreshCurriculumLevels = useCallback(async () => {
    await fetchCurriculumLevels()
  }, [fetchCurriculumLevels])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    setProfile(null)
    setCurriculumLevels([])
    setActiveClass(null)
  }, [supabase])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        Promise.all([
          fetchProfile(session.user.id),
          fetchCurriculumLevels(),
        ]).finally(() => setIsLoading(false))
      } else {
        setIsLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await Promise.all([
            fetchProfile(session.user.id),
            fetchCurriculumLevels(),
          ])
        } else {
          setProfile(null)
          setCurriculumLevels([])
          setActiveClass(null)
        }
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AppContext.Provider
      value={{
        session,
        user,
        profile,
        curriculumLevels,
        activeClass,
        isLoading,
        setActiveClass,
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
