import { createClient } from '@/lib/supabase/client'
import type { TeacherProfile, CurriculumLevel } from '@/lib/types'

const MOCK_TEACHER: TeacherProfile = {
  id: 'teacher-1',
  full_name: 'Dr. Sarah Jenkins',
  email: 'sarah.jenkins@centaurus.edu',
  subject: 'Physics',
  academy_name: 'Centaurus Academy',
  created_at: new Date().toISOString(),
}

const MOCK_LEVELS: CurriculumLevel[] = [
  { id: 'lvl-1', teacher_id: 'teacher-1', name: 'IGCSE Physics', description: 'CIE 0625 Core & Extended Syllabus', created_at: new Date().toISOString() },
  { id: 'lvl-2', teacher_id: 'teacher-1', name: 'A-Level Physics', description: 'CIE 9702 Advanced Syllabus', created_at: new Date().toISOString() },
  { id: 'lvl-3', teacher_id: 'teacher-1', name: 'Edexcel Physics', description: 'Edexcel International A-Level', created_at: new Date().toISOString() },
]

export async function getTeacherProfile(): Promise<TeacherProfile> {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return MOCK_TEACHER

    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (error || !data) return MOCK_TEACHER
    return data as TeacherProfile
  } catch {
    return MOCK_TEACHER
  }
}

export async function updateTeacherProfile(profile: Partial<TeacherProfile>): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return true

    const { error } = await supabase
      .from('teachers')
      .update(profile)
      .eq('id', session.user.id)

    return !error
  } catch {
    return false
  }
}

export async function getCurriculumLevels(): Promise<CurriculumLevel[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('curriculum_levels')
      .select('*')
      .order('created_at', { ascending: true })

    if (error || !data || data.length === 0) return MOCK_LEVELS
    return data as CurriculumLevel[]
  } catch {
    return MOCK_LEVELS
  }
}
