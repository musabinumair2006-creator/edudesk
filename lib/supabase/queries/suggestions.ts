import { createClient } from '@/lib/supabase/client'
import type { AISuggestion, AISuggestionStatus } from '@/lib/types'

const MOCK_SUGGESTIONS: AISuggestion[] = [
  {
    id: 'sug-1',
    teacher_id: 'teacher-1',
    suggestion_type: 'generated_assignment',
    title: 'Suggested Practice Quiz: Electromagnetic Induction',
    content: {
      title: 'Electromagnetic Induction Practice Quiz',
      curriculum_level: 'A-Level Physics',
      topic: 'Electromagnetism',
      total_marks: 30,
      estimated_time: '35 minutes',
      instructions: 'Answer all questions. Show working for calculations.',
      sections: [
        {
          section_label: 'Section A',
          section_title: 'Core Concepts',
          questions: [
            { number: 1, type: 'mcq', question: 'What is the SI unit of magnetic flux?', marks: 2, options: ['A. Tesla', 'B. Weber', 'C. Henry', 'D. Gauss'] },
            { number: 2, type: 'calculation', question: 'Calculate the induced EMF in a coil of 50 turns experiencing a flux change of 0.1 Wb in 0.02s.', marks: 4 },
          ],
        },
      ],
      answer_key: [{ number: 1, answer: 'B. Weber' }, { number: 2, answer: 'EMF = 50 * (0.1 / 0.02) = 250 V' }],
    },
    related_id: 'cls-1',
    status: 'pending',
    teacher_note: null,
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    reviewed_at: null,
  },
  {
    id: 'sug-2',
    teacher_id: 'teacher-1',
    suggestion_type: 'attendance_alert',
    title: 'Low Attendance Flag: David Chen (60%)',
    content: {
      student_name: 'David Chen',
      student_id: 'std-2',
      class_name: 'Grade 12 Physics (A-Level)',
      attendance_percentage: 60,
      sessions_missed: 4,
      recommended_action: 'Send academic intervention notification to student and parent.',
      suggested_message: 'Dear Parent, David Chen has missed 4 Physics sessions (60% attendance). Please ensure regular attendance to maintain academic standing.',
    },
    related_id: 'std-2',
    status: 'pending',
    teacher_note: null,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    reviewed_at: null,
  },
  {
    id: 'sug-3',
    teacher_id: 'teacher-1',
    suggestion_type: 'performance_flag',
    title: 'Declining Trend Alert: Sophia Patel',
    content: {
      student_name: 'Sophia Patel',
      student_id: 'std-5',
      last_three_scores: [85, 72, 58],
      trend: 'declining',
      recommended_action: 'Offer 1-on-1 tutoring session on Kinematics problem solving.',
    },
    related_id: 'std-5',
    status: 'pending',
    teacher_note: null,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    reviewed_at: null,
  },
]

export async function getAISuggestions(statusFilter?: AISuggestionStatus): Promise<AISuggestion[]> {
  try {
    const supabase = createClient()
    let query = supabase
      .from('ai_suggestions')
      .select('*')
      .order('created_at', { ascending: false })

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    const { data, error } = await query

    if (error || !data || data.length === 0) {
      if (statusFilter) return MOCK_SUGGESTIONS.filter((s) => s.status === statusFilter)
      return MOCK_SUGGESTIONS
    }
    return data as AISuggestion[]
  } catch {
    if (statusFilter) return MOCK_SUGGESTIONS.filter((s) => s.status === statusFilter)
    return MOCK_SUGGESTIONS
  }
}

export async function getAISuggestionById(id: string): Promise<AISuggestion | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('ai_suggestions')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return MOCK_SUGGESTIONS.find((s) => s.id === id) || MOCK_SUGGESTIONS[0]
    }
    return data as AISuggestion
  } catch {
    return MOCK_SUGGESTIONS.find((s) => s.id === id) || MOCK_SUGGESTIONS[0]
  }
}

export async function updateAISuggestionStatus(
  id: string,
  status: AISuggestionStatus,
  teacherNote?: string,
  updatedContent?: any
): Promise<boolean> {
  try {
    const supabase = createClient()
    const payload: any = {
      status,
      teacher_note: teacherNote || null,
      reviewed_at: new Date().toISOString(),
    }
    if (updatedContent) payload.content = updatedContent

    const { error } = await supabase
      .from('ai_suggestions')
      .update(payload)
      .eq('id', id)

    return !error
  } catch {
    return true
  }
}
