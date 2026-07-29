import { createClient } from '@/lib/supabase/client'
import type { Attendance, AttendanceSummary, AttendanceStatus } from '@/lib/types'

export async function getAttendanceForSession(
  classId: string,
  date: string
): Promise<Attendance[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('attendance')
    .select('*, student:students(*)')
    .eq('class_id', classId)
    .eq('session_date', date)

  if (error) throw error
  return (data || []) as Attendance[]
}

export async function upsertAttendance(
  records: Array<{
    class_id: string
    student_id: string
    session_date: string
    session_label?: string
    status: AttendanceStatus
    note?: string
  }>
): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const rows = records.map((r) => ({ ...r, teacher_id: user.id }))

  const { error } = await supabase
    .from('attendance')
    .upsert(rows, { onConflict: 'student_id,class_id,session_date' })

  if (error) throw error
}

export async function getAttendanceByStudentAndClass(
  studentId: string,
  classId: string
): Promise<Attendance[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('student_id', studentId)
    .eq('class_id', classId)
    .order('session_date', { ascending: false })

  if (error) throw error
  return (data || []) as Attendance[]
}

export async function getAttendanceSummaryForStudent(
  studentId: string,
  classId?: string
): Promise<AttendanceSummary> {
  const supabase = createClient()
  let query = supabase.from('attendance').select('status').eq('student_id', studentId)
  if (classId) query = query.eq('class_id', classId)

  const { data, error } = await query
  if (error) throw error

  const records = data || []
  const total = records.length
  const present = records.filter((r) => r.status === 'present').length
  const absent = records.filter((r) => r.status === 'absent').length
  const late = records.filter((r) => r.status === 'late').length
  const excused = records.filter((r) => r.status === 'excused').length
  const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0

  return { total, present, absent, late, excused, percentage }
}

export async function getAttendanceSummaryForClass(
  classId: string,
  startDate?: string,
  endDate?: string
): Promise<{ student_id: string; summary: AttendanceSummary }[]> {
  const supabase = createClient()
  let query = supabase
    .from('attendance')
    .select('student_id, status')
    .eq('class_id', classId)

  if (startDate) query = query.gte('session_date', startDate)
  if (endDate) query = query.lte('session_date', endDate)

  const { data, error } = await query
  if (error) throw error

  // Group by student
  const grouped: Record<string, Attendance[]> = {}
  ;(data || []).forEach((r) => {
    if (!grouped[r.student_id]) grouped[r.student_id] = []
    grouped[r.student_id].push(r as Attendance)
  })

  return Object.entries(grouped).map(([student_id, records]) => {
    const total = records.length
    const present = records.filter((r) => r.status === 'present').length
    const absent = records.filter((r) => r.status === 'absent').length
    const late = records.filter((r) => r.status === 'late').length
    const excused = records.filter((r) => r.status === 'excused').length
    const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0
    return { student_id, summary: { total, present, absent, late, excused, percentage } }
  })
}

export async function getSessionDatesForClass(classId: string): Promise<string[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('attendance')
    .select('session_date')
    .eq('class_id', classId)
    .order('session_date', { ascending: false })

  if (error) throw error

  // Deduplicate dates
  const dates = Array.from(new Set((data || []).map((r) => r.session_date)))
  return dates
}

export async function getAttendanceForPeriod(
  classId: string,
  startDate: string,
  endDate: string
): Promise<Attendance[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('attendance')
    .select('*, student:students(*)')
    .eq('class_id', classId)
    .gte('session_date', startDate)
    .lte('session_date', endDate)
    .order('session_date', { ascending: false })

  if (error) throw error
  return (data || []) as Attendance[]
}

export async function getStudentAttendanceAllClasses(
  studentId: string
): Promise<Attendance[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('student_id', studentId)
    .order('session_date', { ascending: false })

  if (error) throw error
  return (data || []) as Attendance[]
}
