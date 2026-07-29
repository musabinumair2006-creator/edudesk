import { createClient } from '@/lib/supabase/client'
import type { Assignment } from '@/lib/types'

export async function getAssignments(): Promise<Assignment[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('assignments')
    .select(`
      *,
      class:classes(*, curriculum_level:curriculum_levels(*)),
      curriculum_level:curriculum_levels(*)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as Assignment[]
}

export async function getAssignmentsByClass(classId: string): Promise<Assignment[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('assignments')
    .select(`*, curriculum_level:curriculum_levels(*)`)
    .eq('class_id', classId)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Get submission counts
  const ids = (data || []).map((a) => a.id)
  const countMap: Record<string, { total: number; checked: number }> = {}

  if (ids.length > 0) {
    const { data: subs } = await supabase
      .from('submissions')
      .select('assignment_id, status')
      .in('assignment_id', ids)

    ;(subs || []).forEach((s) => {
      if (!countMap[s.assignment_id]) countMap[s.assignment_id] = { total: 0, checked: 0 }
      countMap[s.assignment_id].total++
      if (s.status === 'checked' || s.status === 'returned') countMap[s.assignment_id].checked++
    })
  }

  return (data || []).map((a) => ({
    ...a,
    submission_count: countMap[a.id]?.total || 0,
    checked_count: countMap[a.id]?.checked || 0,
  })) as Assignment[]
}

export async function getAssignmentById(id: string): Promise<Assignment | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('assignments')
    .select(`
      *,
      class:classes(*, curriculum_level:curriculum_levels(*)),
      curriculum_level:curriculum_levels(*)
    `)
    .eq('id', id)
    .single()

  if (error) return null

  const { count: subCount } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('assignment_id', id)

  const { count: checkedCount } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('assignment_id', id)
    .in('status', ['checked', 'returned'])

  return {
    ...data,
    submission_count: subCount || 0,
    checked_count: checkedCount || 0,
  } as Assignment
}

export async function createAssignment(assignmentData: {
  class_id: string
  title: string
  instructions: string
  topic?: string
  curriculum_level_id?: string
  total_marks: number
  due_date?: string
  assignment_type: string
  ai_generated?: boolean
  answer_key?: string
}): Promise<Assignment> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('assignments')
    .insert({ ...assignmentData, teacher_id: user.id })
    .select(`*, class:classes(*), curriculum_level:curriculum_levels(*)`)
    .single()

  if (error) throw error
  return data as Assignment
}

export async function updateAssignment(
  id: string,
  updates: Partial<Assignment>
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('assignments').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteAssignment(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('assignments').delete().eq('id', id)
  if (error) throw error
}

export async function getAssignmentsDueThisWeek(): Promise<number> {
  const supabase = createClient()
  const now = new Date()
  const weekEnd = new Date(now)
  weekEnd.setDate(now.getDate() + 7)

  const { count, error } = await supabase
    .from('assignments')
    .select('*', { count: 'exact', head: true })
    .gte('due_date', now.toISOString())
    .lte('due_date', weekEnd.toISOString())

  if (error) return 0
  return count || 0
}

export async function getAssignmentsForStudent(studentId: string): Promise<
  Array<Assignment & { submission?: { marks_obtained: number | null; status: string } }>
> {
  const supabase = createClient()

  // Get classes the student is enrolled in
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('class_id')
    .eq('student_id', studentId)

  const classIds = (enrollments || []).map((e) => e.class_id)
  if (classIds.length === 0) return []

  const { data, error } = await supabase
    .from('assignments')
    .select(`*, class:classes(*)`)
    .in('class_id', classIds)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Get submissions for this student
  const { data: subs } = await supabase
    .from('submissions')
    .select('assignment_id, marks_obtained, status')
    .eq('student_id', studentId)

  const subMap: Record<string, { marks_obtained: number | null; status: string }> = {}
  ;(subs || []).forEach((s) => {
    subMap[s.assignment_id] = { marks_obtained: s.marks_obtained, status: s.status }
  })

  return (data || []).map((a) => ({
    ...a,
    submission: subMap[a.id],
  })) as Array<Assignment & { submission?: { marks_obtained: number | null; status: string } }>
}
