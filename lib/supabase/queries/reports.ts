import { createClient } from '@/lib/supabase/client'
import type { Report, ReportContent } from '@/lib/types'

export async function getReports(): Promise<Report[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('reports')
    .select(`*, student:students(full_name), class:classes(name)`)
    .order('generated_at', { ascending: false })

  if (error) throw error
  return (data || []) as Report[]
}

export async function getReportsByStudent(studentId: string): Promise<Report[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('student_id', studentId)
    .order('generated_at', { ascending: false })

  if (error) throw error
  return (data || []) as Report[]
}

export async function getReportsByClass(classId: string): Promise<Report[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('class_id', classId)
    .order('generated_at', { ascending: false })

  if (error) throw error
  return (data || []) as Report[]
}

export async function saveReport(reportData: {
  report_type: string
  class_id?: string
  student_id?: string
  period_start: string
  period_end: string
  content: ReportContent
}): Promise<Report> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('reports')
    .insert({ ...reportData, teacher_id: user.id })
    .select()
    .single()

  if (error) throw error
  return data as Report
}

export async function deleteReport(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('reports').delete().eq('id', id)
  if (error) throw error
}

export async function buildStudentReportData(
  studentId: string,
  startDate: string,
  endDate: string
) {
  const supabase = createClient()

  // Attendance
  const { data: attendance } = await supabase
    .from('attendance')
    .select('status, session_date')
    .eq('student_id', studentId)
    .gte('session_date', startDate)
    .lte('session_date', endDate)

  const attRecords = attendance || []
  const attTotal = attRecords.length
  const attPresent = attRecords.filter((r) => r.status === 'present').length
  const attAbsent = attRecords.filter((r) => r.status === 'absent').length
  const attLate = attRecords.filter((r) => r.status === 'late').length
  const attExcused = attRecords.filter((r) => r.status === 'excused').length
  const attPercentage = attTotal > 0 ? Math.round(((attPresent + attLate) / attTotal) * 100) : 0

  // Submissions in period
  const { data: submissions } = await supabase
    .from('submissions')
    .select(`marks_obtained, submitted_at, assignment:assignments(title, total_marks, assignment_type, due_date)`)
    .eq('student_id', studentId)
    .gte('submitted_at', startDate + 'T00:00:00Z')
    .lte('submitted_at', endDate + 'T23:59:59Z')

  const subRecords = (submissions || []).filter((s: any) => s.assignment)
  const markedSubs = subRecords.filter((s: any) => s.marks_obtained !== null)
  const averageMarks =
    markedSubs.length > 0
      ? Math.round(
          markedSubs.reduce((sum, s: any) => {
            const asgn = Array.isArray(s.assignment) ? s.assignment[0] : s.assignment
            const total = asgn?.total_marks || 100
            return sum + ((s.marks_obtained as number) / total) * 100
          }, 0) / markedSubs.length
        )
      : 0

  const assignments = subRecords.map((s: any) => {
    const asgn = Array.isArray(s.assignment) ? s.assignment[0] : s.assignment
    return {
      title: asgn?.title || '',
      marks: s.marks_obtained as number,
      total: asgn?.total_marks || 100,
      date: s.submitted_at,
    }
  })

  return {
    student_id: studentId,
    period: { start: startDate, end: endDate },
    attendance: {
      total: attTotal,
      present: attPresent,
      absent: attAbsent,
      late: attLate,
      excused: attExcused,
      percentage: attPercentage,
    },
    academic: {
      submissions_count: subRecords.length,
      marked_count: markedSubs.length,
      average_marks_percentage: averageMarks,
      assignments,
    },
  }
}

export async function buildClassReportData(
  classId: string,
  startDate: string,
  endDate: string
) {
  const supabase = createClient()

  // All students in class
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('student_id, student:students(full_name)')
    .eq('class_id', classId)

  const students = (enrollments || []).map((e: any) => {
    const std = Array.isArray(e.student) ? e.student[0] : e.student
    return {
      id: e.student_id,
      name: std?.full_name || 'Unknown',
    }
  })

  // Attendance for all students
  const studentIds = students.map((s) => s.id)
  const { data: attendance } = await supabase
    .from('attendance')
    .select('student_id, status')
    .eq('class_id', classId)
    .in('student_id', studentIds)
    .gte('session_date', startDate)
    .lte('session_date', endDate)

  const attByStudent: Record<string, { present: number; total: number }> = {}
  ;(attendance || []).forEach((r) => {
    if (!attByStudent[r.student_id]) attByStudent[r.student_id] = { present: 0, total: 0 }
    attByStudent[r.student_id].total++
    if (r.status === 'present' || r.status === 'late') attByStudent[r.student_id].present++
  })

  // Submissions/marks for all students
  const { data: submissions } = await supabase
    .from('submissions')
    .select(`student_id, marks_obtained, assignment:assignments(total_marks)`)
    .in('student_id', studentIds)
    .not('marks_obtained', 'is', null)
    .gte('submitted_at', startDate + 'T00:00:00Z')
    .lte('submitted_at', endDate + 'T23:59:59Z')

  const marksByStudent: Record<string, { total_pct: number; count: number }> = {}
  ;(submissions || []).forEach((s: any) => {
    const asgn = Array.isArray(s.assignment) ? s.assignment[0] : s.assignment
    const total = asgn?.total_marks || 100
    if (!marksByStudent[s.student_id]) marksByStudent[s.student_id] = { total_pct: 0, count: 0 }
    marksByStudent[s.student_id].total_pct += ((s.marks_obtained as number) / total) * 100
    marksByStudent[s.student_id].count++
  })

  const studentPerformance = students.map((s) => {
    const att = attByStudent[s.id]
    const marks = marksByStudent[s.id]
    return {
      id: s.id,
      name: s.name,
      attendance_pct: att ? Math.round((att.present / att.total) * 100) : 0,
      average_marks_pct: marks ? Math.round(marks.total_pct / marks.count) : 0,
    }
  })

  const topPerformers = [...studentPerformance]
    .sort((a, b) => b.average_marks_pct - a.average_marks_pct)
    .slice(0, 5)

  const studentsNeedingAttention = studentPerformance
    .filter((s) => s.attendance_pct < 70 || s.average_marks_pct < 50)
    .map((s) => ({
      name: s.name,
      issue:
        s.attendance_pct < 70 && s.average_marks_pct < 50
          ? 'Low attendance and low marks'
          : s.attendance_pct < 70
          ? 'Low attendance'
          : 'Low marks',
    }))

  const classAvgMarks =
    studentPerformance.length > 0
      ? Math.round(
          studentPerformance.reduce((s, p) => s + p.average_marks_pct, 0) /
            studentPerformance.length
        )
      : 0
  const classAvgAtt =
    studentPerformance.length > 0
      ? Math.round(
          studentPerformance.reduce((s, p) => s + p.attendance_pct, 0) /
            studentPerformance.length
        )
      : 0

  return {
    class_id: classId,
    period: { start: startDate, end: endDate },
    total_students: students.length,
    class_average_attendance: classAvgAtt,
    class_average_marks: classAvgMarks,
    student_performance: studentPerformance,
    top_performers: topPerformers,
    students_needing_attention: studentsNeedingAttention,
  }
}
