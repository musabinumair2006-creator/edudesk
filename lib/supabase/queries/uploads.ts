import { createClient } from '@/lib/supabase/client'
import type { Upload } from '@/lib/types'

const MOCK_UPLOADS: Upload[] = [
  {
    id: 'upl-1',
    teacher_id: 'teacher-1',
    file_name: 'Grade_12_Physics_Attendance_July.xlsx',
    file_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    storage_url: 'https://placeholder.storage/attendance.xlsx',
    detected_data_type: 'attendance_records',
    parsed_data: {
      detected_type: 'attendance_records',
      confidence: 0.98,
      class_name: 'Grade 12 Physics (A-Level)',
      extracted_data: {
        students: [
          { name: 'Alex Morgan', roll_number: 'PHY-101', date: '2026-07-28', status: 'present' },
          { name: 'David Chen', roll_number: 'PHY-102', date: '2026-07-28', status: 'absent' },
        ],
      },
      warnings: [],
      suggestions: ['Import student attendance to Grade 12 Physics class roster'],
    },
    parse_status: 'complete',
    parse_error: null,
    uploaded_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'upl-2',
    teacher_id: 'teacher-1',
    file_name: 'Midterm_Exam_Grades_Scanned.pdf',
    file_type: 'application/pdf',
    storage_url: 'https://placeholder.storage/exam_grades.pdf',
    detected_data_type: 'grade_sheet',
    parsed_data: {
      detected_type: 'grade_sheet',
      confidence: 0.94,
      class_name: 'Grade 10 Physics (IGCSE)',
      extracted_data: {
        students: [
          { name: 'Sophia Patel', roll_number: 'PHY-201', scores: [{ assessment_name: 'Midterm', marks_obtained: 42, total_marks: 50 }] },
        ],
      },
      warnings: [],
      suggestions: ['Run automated AI performance analysis to flag struggling students'],
    },
    parse_status: 'complete',
    parse_error: null,
    uploaded_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
]

export async function getUploads(): Promise<Upload[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('uploads')
      .select('*')
      .order('uploaded_at', { ascending: false })

    if (error || !data || data.length === 0) return MOCK_UPLOADS
    return data as Upload[]
  } catch {
    return MOCK_UPLOADS
  }
}

export async function getUploadById(id: string): Promise<Upload | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('uploads')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return MOCK_UPLOADS.find((u) => u.id === id) || MOCK_UPLOADS[0]
    }
    return data as Upload
  } catch {
    return MOCK_UPLOADS.find((u) => u.id === id) || MOCK_UPLOADS[0]
  }
}

export async function createUpload(upload: Partial<Upload>): Promise<Upload | null> {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      const mockCreated: Upload = {
        id: 'upl-' + Date.now(),
        teacher_id: 'teacher-1',
        file_name: upload.file_name || 'uploaded_file.xlsx',
        file_type: upload.file_type || 'application/octet-stream',
        storage_url: upload.storage_url || 'https://storage.placeholder/file',
        detected_data_type: upload.detected_data_type || null,
        parsed_data: upload.parsed_data || null,
        parse_status: upload.parse_status || 'pending',
        parse_error: upload.parse_error || null,
        uploaded_at: new Date().toISOString(),
      }
      return mockCreated
    }

    const { data, error } = await supabase
      .from('uploads')
      .insert({
        ...upload,
        teacher_id: session.user.id,
      })
      .select()
      .single()

    if (error) return null
    return data as Upload
  } catch {
    return null
  }
}
