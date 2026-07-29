// EduDesk — Complete TypeScript Type Definitions

export interface TeacherProfile {
  id: string
  full_name: string
  email: string
  academy_name: string | null
  created_at: string
}

export interface CurriculumLevel {
  id: string
  teacher_id: string
  name: string
  description: string | null
  created_at: string
}

export interface Class {
  id: string
  teacher_id: string
  curriculum_level_id: string | null
  name: string
  subject: string
  academic_year: string | null
  schedule: ClassSchedule
  is_active: boolean
  created_at: string
  // Joined
  curriculum_level?: CurriculumLevel
  enrollment_count?: number
}

export interface ClassSchedule {
  days: string[]
  time: string
}

export interface Student {
  id: string
  teacher_id: string
  full_name: string
  roll_number: string | null
  email: string | null
  phone: string | null
  parent_phone: string | null
  date_of_birth: string | null
  enrolled_at: string
  is_active: boolean
  // Joined
  enrollments?: Enrollment[]
  attendance_summary?: AttendanceSummary
}

export interface Enrollment {
  id: string
  student_id: string
  class_id: string
  teacher_id: string
  enrolled_at: string
  // Joined
  student?: Student
  class?: Class
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

export interface Attendance {
  id: string
  teacher_id: string
  class_id: string
  student_id: string
  session_date: string
  session_label: string | null
  status: AttendanceStatus
  note: string | null
  marked_at: string
  // Joined
  student?: Student
}

export interface AttendanceSummary {
  total: number
  present: number
  absent: number
  late: number
  excused: number
  percentage: number
}

export type AssignmentType = 'assignment' | 'quiz' | 'midterm' | 'finalterm' | 'classwork'

export interface Assignment {
  id: string
  teacher_id: string
  class_id: string
  title: string
  instructions: string
  topic: string | null
  curriculum_level_id: string | null
  total_marks: number
  due_date: string | null
  assignment_type: AssignmentType
  ai_generated: boolean
  answer_key: string | null
  created_at: string
  // Joined
  class?: Class
  curriculum_level?: CurriculumLevel
  submission_count?: number
  checked_count?: number
}

export type SubmissionStatus = 'submitted' | 'checked' | 'returned'

export interface Submission {
  id: string
  teacher_id: string
  assignment_id: string
  student_id: string
  content: string | null
  file_url: string | null
  submitted_at: string
  marks_obtained: number | null
  feedback: string | null
  ai_checked: boolean
  status: SubmissionStatus
  // Joined
  student?: Student
  assignment?: Assignment
}

export type ReportType = 'weekly' | 'monthly' | 'midterm' | 'final' | 'student' | 'class'

export interface Report {
  id: string
  teacher_id: string
  report_type: ReportType
  class_id: string | null
  student_id: string | null
  period_start: string | null
  period_end: string | null
  content: ReportContent
  generated_at: string
  // Joined
  student?: Student
  class?: Class
}

export interface ReportContent {
  summary: string
  performance_rating: 'Excellent' | 'Good' | 'Satisfactory' | 'Needs Improvement' | string
  highlights: string[]
  concerns: string[]
  recommendations: string[]
  next_steps: string[]
  data?: ReportData
}

export interface ReportData {
  attendance_summary?: AttendanceSummary
  average_marks?: number
  submission_rate?: number
  assignments?: Array<{ title: string; marks: number; total: number; date: string }>
  top_performers?: Array<{ name: string; average: number }>
  students_needing_attention?: Array<{ name: string; issue: string }>
}

export interface Paper {
  id: string
  teacher_id: string
  title: string
  paper_type: 'midterm' | 'finalterm'
  curriculum_level_id: string | null
  topics: string[]
  total_marks: number | null
  time_allowed: string | null
  content: PaperContent
  created_at: string
  curriculum_level?: CurriculumLevel
}

export interface PaperContent {
  cover_page: {
    subject: string
    level: string
    paper_type: string
    total_marks: number
    time_allowed: string
    instructions: string[]
  }
  sections: PaperSection[]
  mark_scheme: MarkSchemeItem[]
}

export interface PaperSection {
  label: string
  title: string
  instructions: string
  questions: PaperQuestion[]
}

export interface PaperQuestion {
  number: number
  question: string
  marks: number
  sub_questions?: Array<{ label: string; question: string; marks: number }>
}

export interface MarkSchemeItem {
  question_number: number
  answer: string
  marks: number
  marking_points?: string[]
}

// AI Types
export interface AIAssignmentRequest {
  curriculum_level: string
  topic: string
  assignment_type: string
  num_questions: number
  total_marks: number
  difficulty: 'foundation' | 'standard' | 'challenging'
}

export interface AIAssignmentResponse {
  title: string
  instructions: string
  questions: AIQuestion[]
  total_marks: number
  estimated_time: string
  answer_key: string
}

export interface AIQuestion {
  number: number
  type: 'mcq' | 'short' | 'structured' | 'calculation'
  question: string
  marks: number
  answer: string
  options?: string[]
}

export interface AISubmissionCheckRequest {
  question_content: string
  student_answer: string
  total_marks: number
  curriculum_level: string
}

export interface AISubmissionCheckResponse {
  marks_awarded: number
  total_marks: number
  percentage: number
  grade: string
  feedback: string
  strengths: string[]
  areas_to_improve: string[]
  misconceptions: string[]
  topics_to_review: string[]
}

export interface AIPaperRequest {
  paper_type: 'midterm' | 'finalterm'
  curriculum_level: string
  topics: string[]
  total_marks: number
  time_allowed: string
  num_sections: number
  instructions: string
}

export interface AIReportRequest {
  report_type: ReportType
  student_id?: string
  class_id?: string
  period_start: string
  period_end: string
}

// Dashboard Types
export interface DashboardStats {
  classes_today: number
  total_students: number
  pending_submissions: number
  assignments_due_this_week: number
}

export interface TodayClass {
  id: string
  name: string
  curriculum_level: string
  time: string
  student_count: number
}

export interface PendingSubmission {
  id: string
  student_name: string
  assignment_title: string
  class_name: string
  submitted_at: string
  assignment_id: string
  student_id: string
}

export interface RecentActivity {
  id: string
  type: 'attendance' | 'assignment' | 'submission' | 'report'
  description: string
  timestamp: string
  link?: string
}
