import { createClient } from '@/lib/supabase/client'
import type { Class, CurriculumLevel } from '@/lib/types'

export async function getClasses(): Promise<Class[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('classes')
    .select(`
      *,
      curriculum_level:curriculum_levels(*)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Get enrollment counts
  const classIds = (data || []).map((c) => c.id)
  const counts: Record<string, number> = {}

  if (classIds.length > 0) {
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('class_id')
      .in('class_id', classIds)

    ;(enrollments || []).forEach((e) => {
      counts[e.class_id] = (counts[e.class_id] || 0) + 1
    })
  }

  return (data || []).map((c) => ({
    ...c,
    enrollment_count: counts[c.id] || 0,
  })) as Class[]
}

export async function getClassById(id: string): Promise<Class | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('classes')
    .select(`*, curriculum_level:curriculum_levels(*)`)
    .eq('id', id)
    .single()

  if (error) return null

  const { count } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('class_id', id)

  return { ...data, enrollment_count: count || 0 } as Class
}

export async function createClass(classData: {
  name: string
  curriculum_level_id: string
  academic_year: string
  subject: string
  schedule: { days: string[]; time: string }
}): Promise<Class> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('classes')
    .insert({ ...classData, teacher_id: user.id })
    .select(`*, curriculum_level:curriculum_levels(*)`)
    .single()

  if (error) throw error
  return data as Class
}

export async function updateClass(id: string, updates: Partial<Class>): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('classes').update(updates).eq('id', id)
  if (error) throw error
}

export async function toggleClassActive(id: string, is_active: boolean): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('classes').update({ is_active }).eq('id', id)
  if (error) throw error
}

export async function getCurriculumLevels(): Promise<CurriculumLevel[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('curriculum_levels')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data || []) as CurriculumLevel[]
}

export async function createCurriculumLevel(level: {
  name: string
  description?: string
}): Promise<CurriculumLevel> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('curriculum_levels')
    .insert({ ...level, teacher_id: user.id })
    .select()
    .single()

  if (error) throw error
  return data as CurriculumLevel
}

export async function updateCurriculumLevel(
  id: string,
  updates: { name?: string; description?: string }
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('curriculum_levels').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteCurriculumLevel(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('curriculum_levels').delete().eq('id', id)
  if (error) throw error
}

export async function getClassesScheduledToday(): Promise<Class[]> {
  const supabase = createClient()
  const today = new Date()
  const dayName = today.toLocaleDateString('en-US', { weekday: 'short' }) // Mon, Tue, etc.

  const { data, error } = await supabase
    .from('classes')
    .select(`*, curriculum_level:curriculum_levels(*)`)
    .eq('is_active', true)

  if (error) throw error

  // Filter classes that have today in their schedule
  const todayClasses = (data || []).filter((c) => {
    const schedule = c.schedule as { days?: string[]; time?: string }
    return schedule?.days?.includes(dayName)
  })

  // Get enrollment counts
  const counts: Record<string, number> = {}
  if (todayClasses.length > 0) {
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('class_id')
      .in('class_id', todayClasses.map((c) => c.id))
    ;(enrollments || []).forEach((e) => {
      counts[e.class_id] = (counts[e.class_id] || 0) + 1
    })
  }

  return todayClasses.map((c) => ({
    ...c,
    enrollment_count: counts[c.id] || 0,
  })) as Class[]
}
