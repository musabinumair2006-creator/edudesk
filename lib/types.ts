// PhysicsDesk Core TypeScript Types & Interfaces

export type SourceType = 'past_paper' | 'topical' | 'custom'
export type IndexStatus = 'pending' | 'processing' | 'complete' | 'failed'
export type QuestionType = 'mcq' | 'short' | 'structured' | 'calculation' | 'essay'
export type Difficulty = 'foundation' | 'standard' | 'challenging'
export type PaperType = 'assignment' | 'quiz' | 'classwork' | 'midterm' | 'finalterm' | 'practice'
export type PaperStatus = 'draft' | 'final' | 'distributed'
export type CreationMode = 'pull' | 'generate' | 'mixed'
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

export interface TeacherProfile {
  id: string
  full_name: string
  email: string
  academy_name: string
  created_at: string
}

export interface CurriculumLevel {
  id: string
  teacher_id: string
  name: string
  created_at: string
}

export interface Class {
  id: string
  teacher_id: string
  curriculum_level_id?: string
  name: string
  academic_year?: string
  is_active: boolean
  created_at: string
  // Optional relation
  curriculum_level?: CurriculumLevel
}

export interface Student {
  id: string
  teacher_id: string
  class_id?: string
  full_name: string
  roll_number?: string
  is_active: boolean
  created_at: string
  // Optional relation
  class?: Class
}

export interface PaperSource {
  id: string
  teacher_id: string
  curriculum_level_id?: string
  title: string
  source_type: SourceType
  year?: number
  paper_number?: string
  storage_url: string
  index_status: IndexStatus
  question_count: number
  uploaded_at: string
  // Optional relation
  curriculum_level?: CurriculumLevel
}

export interface Question {
  id: string
  teacher_id: string
  source_id?: string
  curriculum_level_id?: string
  topic: string
  subtopic?: string
  question_number?: string
  question_text: string
  question_type: QuestionType
  marks: number
  difficulty?: Difficulty
  year?: number
  has_diagram: boolean
  answer?: string
  created_at: string
  // Optional relation
  source?: PaperSource
  curriculum_level?: CurriculumLevel
}

export interface PaperQuestion {
  id?: string
  paper_id?: string
  question_id?: string
  teacher_id?: string
  question_text: string
  marks: number
  section?: string
  order_index: number
  is_ai_generated: boolean
  answer?: string
  // Extra fields for UI mapping
  topic?: string
  question_type?: QuestionType
  question_number?: string
}

export interface PaperSection {
  label: string
  description?: string
  questions: PaperQuestion[]
}

export interface PaperContent {
  sections: PaperSection[]
}

export interface Paper {
  id: string
  teacher_id: string
  class_id?: string
  curriculum_level_id?: string
  title: string
  paper_type: PaperType
  total_marks: number
  time_allowed?: string
  instructions?: string
  status: PaperStatus
  creation_mode: CreationMode
  content: PaperContent
  mark_scheme?: any
  created_at: string
  // Optional relations
  class?: Class
  curriculum_level?: CurriculumLevel
  paper_questions?: PaperQuestion[]
}

export interface AttendanceRecord {
  id: string
  teacher_id: string
  class_id: string
  student_id: string
  session_date: string
  status: AttendanceStatus
  // Joined relation
  student?: Student
}

export interface Result {
  id: string
  teacher_id: string
  paper_id: string
  student_id: string
  marks_obtained: number
  percentage: number
  grade: string
  feedback?: string
  submitted_at: string
  // Joined relations
  student?: Student
  paper?: Paper
}

export interface GeneratedQuestion {
  question_text: string
  question_type: QuestionType
  marks: number
  topic: string
  answer?: string
  is_ai_generated: boolean
}

export interface IndexPaperResponse {
  source_id: string
  questions_extracted: number
  topics_found: string[]
}
