import { createClient } from '@/lib/supabase/client'
import type { Submission } from '@/lib/types'

const MOCK_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-1',
    teacher_id: 'teacher-1',
    assignment_id: 'asg-1',
    student_id: 'std-1',
    upload_id: 'upl-1',
    content: '1) Magnetic flux linkage = N * B * A = 50 * 0.2 * 0.05 = 0.5 Wb.\n2) EMF = -0.5 / 0.04 = 12.5V.',
    marks_obtained: 45,
    ai_suggested_marks: 45,
    feedback: 'Excellent work. Correct application of Lenz law minus sign.',
    ai_feedback: 'Strong understanding of flux linkage equations.',
    status: 'teacher_reviewed',
    submitted_at: new Date().toISOString(),
    student: { id: 'std-1', teacher_id: 'teacher-1', class_id: 'cls-1', full_name: 'Alex Morgan', roll_number: 'PHY-101', email: null, is_active: true, created_at: '' },
  },
  {
    id: 'sub-2',
    teacher_id: 'teacher-1',
    assignment_id: 'asg-1',
    student_id: 'std-2',
    upload_id: 'upl-1',
    content: '1) Flux = 0.4 Wb.\n2) EMF = 10V.',
    marks_obtained: 32,
    ai_suggested_marks: 32,
    feedback: 'Minor calculation error in area calculation. Review A = pi * r^2.',
    ai_feedback: 'Student confused area radius with diameter.',
    status: 'ai_checked',
    submitted_at: new Date().toISOString(),
    student: { id: 'std-2', teacher_id: 'teacher-1', class_id: 'cls-1', full_name: 'David Chen', roll_number: 'PHY-102', email: null, is_active: true, created_at: '' },
  },
]

export async function getSubmissionsByAssignment(assignmentId: string): Promise<Submission[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('submissions')
      .select('*, student:students(id, full_name, roll_number)')
      .eq('assignment_id', assignmentId)

    if (error || !data || data.length === 0) return MOCK_SUBMISSIONS
    return data as Submission[]
  } catch {
    return MOCK_SUBMISSIONS
  }
}

export async function getSubmissionByStudentAssignment(
  assignmentId: string,
  studentId: string
): Promise<Submission | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('submissions')
      .select('*, student:students(id, full_name, roll_number), assignment:assignments(title, total_marks)')
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId)
      .single()

    if (error || !data) {
      return MOCK_SUBMISSIONS.find((s) => s.student_id === studentId) || MOCK_SUBMISSIONS[0]
    }
    return data as Submission
  } catch {
    return MOCK_SUBMISSIONS.find((s) => s.student_id === studentId) || MOCK_SUBMISSIONS[0]
  }
}

export async function getSubmissionByStudentAndAssignment(
  assignmentId: string,
  studentId: string
): Promise<Submission | null> {
  return getSubmissionByStudentAssignment(assignmentId, studentId)
}

export async function updateSubmissionGrade(
  id: string,
  marks: number,
  feedback: string,
  status: 'teacher_reviewed' | 'returned' = 'teacher_reviewed'
): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('submissions')
      .update({
        marks_obtained: marks,
        feedback,
        status,
      })
      .eq('id', id)

    return !error
  } catch {
    return true
  }
}

export async function updateSubmissionMarking(
  id: string,
  marks: number,
  feedback: string
): Promise<boolean> {
  return updateSubmissionGrade(id, marks, feedback)
}
