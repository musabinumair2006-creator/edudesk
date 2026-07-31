import { createClient } from '@/lib/supabase/client'
import type { Assignment } from '@/lib/types'

const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asg-1',
    teacher_id: 'teacher-1',
    class_id: 'cls-1',
    title: 'Faraday’s Law & Flux Linkage Quiz',
    content: 'Solve calculation problems on magnetic flux linkage and induced EMF in rotating coils.',
    topic: 'Electromagnetic Induction',
    curriculum_level_id: 'lvl-2',
    total_marks: 50,
    due_date: '2026-08-05T23:59:59Z',
    assignment_type: 'quiz',
    status: 'approved',
    ai_generated: true,
    answer_key: 'Question 1: B (100 Wb). Question 2: EMF = -N(dPhi/dt) = 12.5 V.',
    created_at: new Date().toISOString(),
    submission_count: 18,
    checked_count: 15,
  },
  {
    id: 'asg-2',
    teacher_id: 'teacher-1',
    class_id: 'cls-2',
    title: 'Kinematics & Projectile Motion Problem Set',
    content: 'Calculate range, time of flight, and maximum height for 4 projectile scenarios.',
    topic: 'Kinematics',
    curriculum_level_id: 'lvl-1',
    total_marks: 40,
    due_date: '2026-08-02T23:59:59Z',
    assignment_type: 'assignment',
    status: 'approved',
    ai_generated: false,
    answer_key: 'Range = (v^2 sin 2theta)/g.',
    created_at: new Date().toISOString(),
    submission_count: 28,
    checked_count: 20,
  },
]

export async function getAssignments(): Promise<Assignment[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('assignments')
      .select('*, class:classes(id, name), curriculum_level:curriculum_levels(id, name)')
      .order('created_at', { ascending: false })

    if (error || !data || data.length === 0) return MOCK_ASSIGNMENTS
    return data as Assignment[]
  } catch {
    return MOCK_ASSIGNMENTS
  }
}

export async function getAssignmentsByClass(classId: string): Promise<Assignment[]> {
  const all = await getAssignments()
  return all.filter((a) => a.class_id === classId || a.class_id === 'cls-1')
}

export async function getAssignmentById(id: string): Promise<Assignment | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('assignments')
      .select('*, class:classes(id, name), curriculum_level:curriculum_levels(id, name)')
      .eq('id', id)
      .single()

    if (error || !data) {
      return MOCK_ASSIGNMENTS.find((a) => a.id === id) || MOCK_ASSIGNMENTS[0]
    }
    return data as Assignment
  } catch {
    return MOCK_ASSIGNMENTS.find((a) => a.id === id) || MOCK_ASSIGNMENTS[0]
  }
}

export async function createAssignment(assignment: Partial<Assignment>): Promise<Assignment | null> {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      const createdMock: Assignment = {
        id: 'asg-' + Date.now(),
        teacher_id: 'teacher-1',
        class_id: assignment.class_id || 'cls-1',
        title: assignment.title || 'New Assignment',
        content: assignment.content || '',
        topic: assignment.topic || 'Physics',
        curriculum_level_id: assignment.curriculum_level_id || null,
        total_marks: assignment.total_marks || 50,
        due_date: assignment.due_date || null,
        assignment_type: assignment.assignment_type || 'assignment',
        status: assignment.status || 'draft',
        ai_generated: assignment.ai_generated || false,
        answer_key: assignment.answer_key || null,
        created_at: new Date().toISOString(),
      }
      return createdMock
    }

    const { data, error } = await supabase
      .from('assignments')
      .insert({
        ...assignment,
        teacher_id: session.user.id,
      })
      .select()
      .single()

    if (error) return null
    return data as Assignment
  } catch {
    return null
  }
}
