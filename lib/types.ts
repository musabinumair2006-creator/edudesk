// PhysicsDesk — Complete TypeScript Type Definitions (Centaurus Academy)

export interface TeacherProfile {
  id: string
  full_name: string
  email: string
  subject: string
  academy_name: string
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
  academic_year: string | null
  is_active: boolean
  created_at: string
  // Joined fields
  curriculum_level?: CurriculumLevel
  student_count?: number
}

export interface Student {
  id: string
  teacher_id: string
  class_id: string | null
  full_name: string
  roll_number: string | null
  email: string | null
  is_active: boolean
  created_at: string
  // Joined fields
  class?: Class
  attendance_summary?: AttendanceSummary
}

export type UploadDataType =
  | 'attendance'
  | 'attendance_records'
  | 'grades'
  | 'grade_sheet'
  | 'assignment'
  | 'assignment_submission'
  | 'student_list'
  | 'exam_results'
  | 'unknown'

export type ParseStatus = 'pending' | 'processing' | 'complete' | 'failed'

export interface Upload {
  id: string
  teacher_id: string
  file_name: string
  file_type: string
  storage_url: string
  detected_data_type: UploadDataType | null
  parsed_data: ParsedDataResult | null
  parse_status: ParseStatus
  parse_error: string | null
  uploaded_at: string
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'
export type AttendanceSource = 'manual' | 'imported'

export interface Attendance {
  id: string
  teacher_id: string
  class_id: string
  student_id: string
  session_date: string
  status: AttendanceStatus
  source: AttendanceSource
  // Joined
  student?: Student
  class?: Class
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
export type AssignmentStatus = 'draft' | 'approved' | 'distributed'

export interface Assignment {
  id: string
  teacher_id: string
  class_id: string
  title: string
  content: string
  topic: string | null
  curriculum_level_id: string | null
  total_marks: number
  due_date: string | null
  assignment_type: AssignmentType
  status: AssignmentStatus
  ai_generated: boolean
  answer_key: string | null
  instructions?: string
  created_at: string
  // Joined
  class?: Class
  curriculum_level?: CurriculumLevel
  submission_count?: number
  checked_count?: number
}

export type SubmissionStatus = 'pending' | 'ai_checked' | 'teacher_reviewed' | 'returned'

export interface Submission {
  id: string
  teacher_id: string
  assignment_id: string
  student_id: string
  upload_id: string | null
  content: string | null
  marks_obtained: number | null
  ai_suggested_marks: number | null
  feedback: string | null
  ai_feedback: string | null
  status: SubmissionStatus
  submitted_at: string
  // Joined
  student?: Student
  assignment?: Assignment
}

export type AISuggestionType =
  | 'generated_assignment'
  | 'generated_paper'
  | 'submission_feedback'
  | 'student_report'
  | 'class_report'
  | 'attendance_alert'
  | 'performance_flag'

export type AISuggestionStatus = 'pending' | 'approved' | 'rejected' | 'modified'

export interface AISuggestion {
  id: string
  teacher_id: string
  suggestion_type: AISuggestionType
  title: string
  content: any // JSON structure depending on type
  related_id: string | null
  status: AISuggestionStatus
  teacher_note: string | null
  created_at: string
  reviewed_at: string | null
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
  executive_summary: string
  attendance_analysis?: string
  performance_analysis?: string
  strengths: string[]
  areas_to_improve: string[]
  recommendations: string[]
  overall_rating: 'Excellent' | 'Good' | 'Satisfactory' | 'Needs Improvement' | string
  overall_percentage?: number
}

// Parsed Data Structures
export interface ParsedDataResult {
  detected_type: UploadDataType
  confidence: number
  class_name: string | null
  extracted_data: {
    students?: Array<{
      name: string
      roll_number?: string
      email?: string
      date?: string
      status?: AttendanceStatus
      scores?: Array<{
        assessment_name: string
        marks_obtained: number
        total_marks: number
      }>
      total_marks_obtained?: number
      total_marks?: number
      percentage?: number
      grade?: string
    }>
    [key: string]: any
  }
  warnings: string[]
  suggestions: string[]
}

// Performance Analyzer Result
export interface PerformanceAnalysisResult {
  automatic_flags: {
    low_attendance: Array<{ student_name: string; percentage: number; sessions_missed: number }>
    declining_performance: Array<{ student_name: string; last_three_scores: number[]; trend: string }>
    missing_submissions: Array<{ student_name: string; missing_count: number }>
    class_average: number
    class_average_status: 'above_threshold' | 'below_threshold'
    hardest_assessment: { name: string; class_average: number }
  }
  suggestions_for_approval: {
    intervention_messages: Array<{ student_name: string; message: string }>
    topics_to_revisit: string[]
    difficulty_recommendation: string
  }
}

// Lesson Plan Types
export interface LessonPlanContent {
  overview?: string
  objectives?: string[]
  learning_objectives?: string[]
  prerequisites?: string[]
  materials_needed?: string[]
  key_equations_and_terms?: string[]
  timeline?: any[]
  key_concepts?: Array<{ concept: string; explanation: string; example: string }>
  common_misconceptions?: Array<{ misconception: string; correction: string } | string>
  practical_experiment?: any
  formative_assessment?: string[]
  discussion_starters?: string[]
  differentiation?: { support: string; extension: string }
  homework_suggestion?: string
  homework_assignment?: any
}

export interface LessonPlan {
  id: string
  teacher_id: string
  class_id?: string
  title: string
  topic: string
  curriculum_level_id?: string
  duration_minutes: number
  target_audience?: string
  content: LessonPlanContent
  status?: 'draft' | 'published' | string
  ai_generated?: boolean
  created_at: string
}

export interface AILessonPlanRequest {
  topic: string
  curriculum_level?: string
  duration_minutes?: number
  target_audience?: string
  specific_requirements?: string
  include_practical?: boolean
  difficulty?: string
  special_instructions?: string
}

// LMS Integration Types
export type LMSProvider = 'google_classroom' | 'canvas' | 'moodle' | 'ms_teams' | 'custom'

export interface LMSConnection {
  id: string
  teacher_id: string
  provider: LMSProvider
  school_name?: string
  academy_name?: string
  portal_url: string
  account_email?: string
  is_connected?: boolean
  gradebook_url?: string
  coursework_url?: string
  attendance_url?: string
  live_class_url?: string
  notes?: string
  access_token?: string | null
  status?: string
  created_at?: string
  last_synced_at?: string
}

export interface AISubmissionCheckResponse {
  marks_awarded: number
  total_marks: number
  percentage: number
  grade: string
  feedback?: string
  detailed_feedback: string
  strengths: string[]
  areas_to_improve: string[]
  misconceptions: string[]
  topics_to_review: string[]
  [key: string]: any
}

// Dashboard Stat Counters
export interface DashboardStats {
  pending_suggestions_count: number
  assignments_this_month: number
  total_active_students: number
  files_processed_this_week: number
}
