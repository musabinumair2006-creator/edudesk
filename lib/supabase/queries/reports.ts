import { createClient } from '@/lib/supabase/client'
import type { Report } from '@/lib/types'

const MOCK_REPORTS: Report[] = [
  {
    id: 'rep-1',
    teacher_id: 'teacher-1',
    report_type: 'monthly',
    class_id: 'cls-1',
    student_id: null,
    period_start: '2026-07-01',
    period_end: '2026-07-30',
    generated_at: new Date().toISOString(),
    content: {
      executive_summary: 'Grade 12 Physics class has demonstrated high conceptual mastery in Electromagnetism and Kinematics.',
      attendance_analysis: 'Class attendance averaged 88.5% across 12 sessions during July.',
      performance_analysis: 'Average score across 3 quizzes was 76.2%. Top performers consistently scored above 90%.',
      strengths: ['Strong quantitative derivation skills', 'High homework submission rate (92%)'],
      areas_to_improve: ['Flux linkage sign conventions', 'AC circuit impedance calculations'],
      recommendations: ['Conduct 1 revision lab session before midterm', 'Provide extra practice worksheets on Lenz law'],
      overall_rating: 'Good',
      overall_percentage: 76.2,
    },
  },
]

export async function getReports(): Promise<Report[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('reports')
      .select('*, class:classes(id, name), student:students(id, full_name)')
      .order('generated_at', { ascending: false })

    if (error || !data || data.length === 0) return MOCK_REPORTS
    return data as Report[]
  } catch {
    return MOCK_REPORTS
  }
}

export async function createReport(report: Partial<Report>): Promise<Report | null> {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      const createdMock: Report = {
        id: 'rep-' + Date.now(),
        teacher_id: 'teacher-1',
        report_type: report.report_type || 'monthly',
        class_id: report.class_id || null,
        student_id: report.student_id || null,
        period_start: report.period_start || null,
        period_end: report.period_end || null,
        content: report.content || {
          executive_summary: 'Default Report Summary',
          strengths: [],
          areas_to_improve: [],
          recommendations: [],
          overall_rating: 'Good',
        },
        generated_at: new Date().toISOString(),
      }
      return createdMock
    }

    const { data, error } = await supabase
      .from('reports')
      .insert({
        ...report,
        teacher_id: session.user.id,
      })
      .select()
      .single()

    if (error) return null
    return data as Report
  } catch {
    return null
  }
}
