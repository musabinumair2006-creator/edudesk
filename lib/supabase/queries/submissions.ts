import { createClient } from '@/lib/supabase/client'
import type { Submission } from '@/lib/types'

export async function getSubmissionsByAssignment(assignmentId: string): Promise<Submission[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('submissions')
    .select('*, student:students(*)')
    .eq('assignment_id', assignmentId)
    .order('submitted_at', { ascending: false })

  if (error) throw error
  return (data || []) as Submission[]
}

export async function getSubmissionByStudentAndAssignment(
  studentId: string,
  assignmentId: string
): Promise<Submission | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('submissions')
    .select('*, student:students(*), assignment:assignments(*)')
    .eq('student_id', studentId)
    .eq('assignment_id', assignmentId)
    .single()

  if (error) return null
  return data as Submission
}

export async function createOrUpdateSubmission(submission: {
  assignment_id: string
  student_id: string
  content?: string
  file_url?: string
}): Promise<Submission> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('submissions')
    .upsert(
      { ...submission, teacher_id: user.id },
      { onConflict: 'assignment_id,student_id' }
    )
    .select()
    .single()

  if (error) throw error
  return data as Submission
}

export async function updateSubmissionMarking(
  submissionId: string,
  updates: {
    marks_obtained: number
    feedback: string
    ai_checked?: boolean
    status: 'checked' | 'returned'
  }
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('submissions')
    .update(updates)
    .eq('id', submissionId)

  if (error) throw error
}

export async function getPendingSubmissions(): Promise<
  Array<Submission & { student: { full_name: string }; assignment: { title: string; class: { name: string } } }>
> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('submissions')
    .select(`
      *,
      student:students(full_name),
      assignment:assignments(title, class:classes(name))
    `)
    .eq('status', 'submitted')
    .order('submitted_at', { ascending: false })
    .limit(20)

  if (error) throw error
  return (data || []) as Array<
    Submission & { student: { full_name: string }; assignment: { title: string; class: { name: string } } }
  >
}

export async function getPendingSubmissionsCount(): Promise<number> {
  const supabase = createClient()
  const { count, error } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'submitted')

  if (error) return 0
  return count || 0
}

export async function getSubmissionsByStudent(
  studentId: string
): Promise<Submission[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('submissions')
    .select(`*, assignment:assignments(title, total_marks, assignment_type, due_date)`)
    .eq('student_id', studentId)
    .order('submitted_at', { ascending: false })

  if (error) throw error
  return (data || []) as Submission[]
}

export async function getStudentPerformanceTrend(
  studentId: string
): Promise<Array<{ date: string; title: string; percentage: number; marks: number; total: number }>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('submissions')
    .select(`
      marks_obtained,
      submitted_at,
      assignment:assignments(title, total_marks)
    `)
    .eq('student_id', studentId)
    .not('marks_obtained', 'is', null)
    .order('submitted_at', { ascending: true })
    .limit(20)

  if (error) throw error

  return (data || [])
    .filter((s: any) => s.assignment && s.marks_obtained !== null)
    .map((s: any) => {
      const asgn = Array.isArray(s.assignment) ? s.assignment[0] : s.assignment
      const totalMarks = asgn?.total_marks || 100
      return {
        date: s.submitted_at,
        title: asgn?.title || '',
        marks: s.marks_obtained as number,
        total: totalMarks,
        percentage: Math.round(((s.marks_obtained as number) / totalMarks) * 100),
      }
    })
}
