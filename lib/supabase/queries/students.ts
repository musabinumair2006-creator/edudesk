import { createClient } from '@/lib/supabase/client'
import type { Student, Enrollment } from '@/lib/types'

export async function getStudents(): Promise<Student[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('full_name', { ascending: true })

  if (error) throw error
  return (data || []) as Student[]
}

export async function getStudentById(id: string): Promise<Student | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Student
}

export async function getStudentsByClass(classId: string): Promise<Student[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('enrollments')
    .select('student:students(*)')
    .eq('class_id', classId)
    .order('enrolled_at', { ascending: true })

  if (error) throw error
  return (data || [])
    .map((e: any) => (Array.isArray(e.student) ? e.student[0] : e.student))
    .filter(Boolean) as Student[]
}

export async function createStudent(studentData: {
  full_name: string
  roll_number?: string
  email?: string
  phone?: string
  parent_phone?: string
  date_of_birth?: string
}): Promise<Student> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('students')
    .insert({ ...studentData, teacher_id: user.id })
    .select()
    .single()

  if (error) throw error
  return data as Student
}

export async function updateStudent(id: string, updates: Partial<Student>): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('students').update(updates).eq('id', id)
  if (error) throw error
}

export async function toggleStudentActive(id: string, is_active: boolean): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('students').update({ is_active }).eq('id', id)
  if (error) throw error
}

export async function enrollStudentInClass(
  studentId: string,
  classId: string
): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('enrollments').insert({
    student_id: studentId,
    class_id: classId,
    teacher_id: user.id,
  })

  if (error && !error.message.includes('duplicate')) throw error
}

export async function unenrollStudentFromClass(
  studentId: string,
  classId: string
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('enrollments')
    .delete()
    .eq('student_id', studentId)
    .eq('class_id', classId)

  if (error) throw error
}

export async function getStudentEnrollments(studentId: string): Promise<Enrollment[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('enrollments')
    .select(`*, class:classes(*, curriculum_level:curriculum_levels(*))`)
    .eq('student_id', studentId)

  if (error) throw error
  return (data || []) as Enrollment[]
}

export async function getEnrollmentsByClass(classId: string): Promise<Enrollment[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('enrollments')
    .select(`*, student:students(*)`)
    .eq('class_id', classId)

  if (error) throw error
  return (data || []) as Enrollment[]
}

export async function getTotalStudentCount(): Promise<number> {
  const supabase = createClient()
  const { count, error } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  if (error) return 0
  return count || 0
}

export async function getStudentsNotInClass(classId: string): Promise<Student[]> {
  const supabase = createClient()

  // Get already enrolled student IDs
  const { data: enrolled } = await supabase
    .from('enrollments')
    .select('student_id')
    .eq('class_id', classId)

  const enrolledIds = (enrolled || []).map((e) => e.student_id)

  let query = supabase.from('students').select('*').eq('is_active', true)
  if (enrolledIds.length > 0) {
    query = query.not('id', 'in', `(${enrolledIds.join(',')})`)
  }

  const { data, error } = await query.order('full_name', { ascending: true })
  if (error) throw error
  return (data || []) as Student[]
}
