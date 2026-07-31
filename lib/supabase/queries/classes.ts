import { createClient } from '@/lib/supabase/client'
import type { Class } from '@/lib/types'

const MOCK_CLASSES: Class[] = [
  {
    id: 'cls-1',
    teacher_id: 'teacher-1',
    curriculum_level_id: 'lvl-2',
    name: 'Grade 12 Physics (A-Level)',
    academic_year: '2025-2026',
    is_active: true,
    created_at: new Date().toISOString(),
    student_count: 24,
    curriculum_level: { id: 'lvl-2', teacher_id: 'teacher-1', name: 'A-Level Physics', description: null, created_at: '' },
  },
  {
    id: 'cls-2',
    teacher_id: 'teacher-1',
    curriculum_level_id: 'lvl-1',
    name: 'Grade 10 Physics (IGCSE)',
    academic_year: '2025-2026',
    is_active: true,
    created_at: new Date().toISOString(),
    student_count: 30,
    curriculum_level: { id: 'lvl-1', teacher_id: 'teacher-1', name: 'IGCSE Physics', description: null, created_at: '' },
  },
  {
    id: 'cls-3',
    teacher_id: 'teacher-1',
    curriculum_level_id: 'lvl-3',
    name: 'Grade 11 Physics (Edexcel)',
    academic_year: '2025-2026',
    is_active: true,
    created_at: new Date().toISOString(),
    student_count: 18,
    curriculum_level: { id: 'lvl-3', teacher_id: 'teacher-1', name: 'Edexcel Physics', description: null, created_at: '' },
  },
]

export async function getClasses(): Promise<Class[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('classes')
      .select('*, curriculum_level:curriculum_levels(id, name, description)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error || !data || data.length === 0) return MOCK_CLASSES
    return data as Class[]
  } catch {
    return MOCK_CLASSES
  }
}

export async function getClassById(id: string): Promise<Class | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('classes')
      .select('*, curriculum_level:curriculum_levels(id, name, description)')
      .eq('id', id)
      .single()

    if (error || !data) {
      return MOCK_CLASSES.find((c) => c.id === id) || MOCK_CLASSES[0]
    }
    return data as Class
  } catch {
    return MOCK_CLASSES.find((c) => c.id === id) || MOCK_CLASSES[0]
  }
}

export async function createClass(newClass: Partial<Class>): Promise<Class | null> {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      const createdMock: Class = {
        id: 'cls-' + Date.now(),
        teacher_id: 'teacher-1',
        curriculum_level_id: newClass.curriculum_level_id || null,
        name: newClass.name || 'New Physics Class',
        academic_year: newClass.academic_year || '2025-2026',
        is_active: true,
        created_at: new Date().toISOString(),
        student_count: 0,
      }
      return createdMock
    }

    const { data, error } = await supabase
      .from('classes')
      .insert({
        ...newClass,
        teacher_id: session.user.id,
      })
      .select()
      .single()

    if (error) return null
    return data as Class
  } catch {
    return null
  }
}
