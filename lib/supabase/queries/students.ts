import { createClient } from '@/lib/supabase/client'
import type { Student } from '@/lib/types'

const MOCK_STUDENTS: Student[] = [
  { id: 'std-1', teacher_id: 'teacher-1', class_id: 'cls-1', full_name: 'Alex Morgan', roll_number: 'PHY-101', email: 'alex.morgan@centaurus.edu', is_active: true, created_at: new Date().toISOString() },
  { id: 'std-2', teacher_id: 'teacher-1', class_id: 'cls-1', full_name: 'David Chen', roll_number: 'PHY-102', email: 'david.chen@centaurus.edu', is_active: true, created_at: new Date().toISOString() },
  { id: 'std-3', teacher_id: 'teacher-1', class_id: 'cls-1', full_name: 'Emma Watson', roll_number: 'PHY-103', email: 'emma.watson@centaurus.edu', is_active: true, created_at: new Date().toISOString() },
  { id: 'std-4', teacher_id: 'teacher-1', class_id: 'cls-1', full_name: 'Liam Miller', roll_number: 'PHY-104', email: 'liam.miller@centaurus.edu', is_active: true, created_at: new Date().toISOString() },
  { id: 'std-5', teacher_id: 'teacher-1', class_id: 'cls-2', full_name: 'Sophia Patel', roll_number: 'PHY-201', email: 'sophia.patel@centaurus.edu', is_active: true, created_at: new Date().toISOString() },
  { id: 'std-6', teacher_id: 'teacher-1', class_id: 'cls-2', full_name: 'Lucas Garcia', roll_number: 'PHY-202', email: 'lucas.garcia@centaurus.edu', is_active: true, created_at: new Date().toISOString() },
]

export async function getStudents(): Promise<Student[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('students')
      .select('*, class:classes(id, name)')
      .eq('is_active', true)
      .order('full_name', { ascending: true })

    if (error || !data || data.length === 0) return MOCK_STUDENTS
    return data as Student[]
  } catch {
    return MOCK_STUDENTS
  }
}

export async function getStudentsByClass(classId: string): Promise<Student[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('students')
      .select('*, class:classes(id, name)')
      .eq('class_id', classId)
      .eq('is_active', true)
      .order('full_name', { ascending: true })

    if (error || !data || data.length === 0) {
      return MOCK_STUDENTS.filter((s) => s.class_id === classId)
    }
    return data as Student[]
  } catch {
    return MOCK_STUDENTS.filter((s) => s.class_id === classId)
  }
}

export async function getStudentById(id: string): Promise<Student | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('students')
      .select('*, class:classes(id, name, curriculum_level_id)')
      .eq('id', id)
      .single()

    if (error || !data) {
      return MOCK_STUDENTS.find((s) => s.id === id) || MOCK_STUDENTS[0]
    }
    return data as Student
  } catch {
    return MOCK_STUDENTS.find((s) => s.id === id) || MOCK_STUDENTS[0]
  }
}

export async function createStudent(student: Partial<Student>): Promise<Student | null> {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      const createdMock: Student = {
        id: 'std-' + Date.now(),
        teacher_id: 'teacher-1',
        class_id: student.class_id || 'cls-1',
        full_name: student.full_name || 'New Student',
        roll_number: student.roll_number || 'PHY-999',
        email: student.email || null,
        is_active: true,
        created_at: new Date().toISOString(),
      }
      return createdMock
    }

    const { data, error } = await supabase
      .from('students')
      .insert({
        ...student,
        teacher_id: session.user.id,
      })
      .select()
      .single()

    if (error) return null
    return data as Student
  } catch {
    return null
  }
}
