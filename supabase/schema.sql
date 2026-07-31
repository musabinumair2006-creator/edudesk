-- PhysicsDesk Database Schema for Supabase (Centaurus Academy)
-- Safe to run multiple times — uses IF NOT EXISTS throughout

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- DROP OLD CONFLICTING TABLES (if they exist from previous schema)
-- =============================================
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS ai_suggestions CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS uploads CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS curriculum_levels CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS teacher_profile CASCADE;

-- =============================================
-- TEACHER PROFILE
-- =============================================
CREATE TABLE teachers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  subject TEXT DEFAULT 'Physics',
  academy_name TEXT DEFAULT 'Centaurus Academy',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teacher reads own profile" ON teachers FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Teacher updates own profile" ON teachers FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Teacher inserts own profile" ON teachers FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================
-- CURRICULUM LEVELS
-- =============================================
CREATE TABLE curriculum_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE curriculum_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teacher manages own levels" ON curriculum_levels FOR ALL USING (auth.uid() = teacher_id);

-- =============================================
-- CLASSES
-- =============================================
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  curriculum_level_id UUID REFERENCES curriculum_levels(id),
  name TEXT NOT NULL,
  subject TEXT DEFAULT 'Physics',
  academic_year TEXT,
  schedule JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teacher manages own classes" ON classes FOR ALL USING (auth.uid() = teacher_id);

-- =============================================
-- STUDENTS
-- =============================================
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  roll_number TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teacher manages own students" ON students FOR ALL USING (auth.uid() = teacher_id);

-- =============================================
-- UPLOADED FILES
-- =============================================
CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  storage_url TEXT NOT NULL,
  detected_data_type TEXT,
  parsed_data JSONB,
  parse_status TEXT DEFAULT 'pending' CHECK (parse_status IN ('pending', 'processing', 'complete', 'failed')),
  parse_error TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teacher manages own uploads" ON uploads FOR ALL USING (auth.uid() = teacher_id);

-- =============================================
-- ATTENDANCE
-- =============================================
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'imported')),
  UNIQUE(student_id, class_id, session_date)
);
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teacher manages own attendance" ON attendance FOR ALL USING (auth.uid() = teacher_id);

-- =============================================
-- ASSIGNMENTS
-- =============================================
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  topic TEXT,
  curriculum_level_id UUID REFERENCES curriculum_levels(id),
  total_marks INTEGER NOT NULL,
  due_date TIMESTAMPTZ,
  assignment_type TEXT DEFAULT 'assignment' CHECK (assignment_type IN ('assignment', 'quiz', 'midterm', 'finalterm', 'classwork')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'distributed')),
  ai_generated BOOLEAN DEFAULT FALSE,
  answer_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teacher manages own assignments" ON assignments FOR ALL USING (auth.uid() = teacher_id);

-- =============================================
-- SUBMISSIONS
-- =============================================
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  upload_id UUID REFERENCES uploads(id),
  content TEXT,
  file_url TEXT,
  marks_obtained NUMERIC(5,2),
  ai_suggested_marks NUMERIC(5,2),
  feedback TEXT,
  ai_feedback TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ai_checked', 'teacher_reviewed', 'returned', 'checked')),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teacher manages own submissions" ON submissions FOR ALL USING (auth.uid() = teacher_id);

-- =============================================
-- AI SUGGESTIONS
-- =============================================
CREATE TABLE ai_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN (
    'generated_assignment',
    'generated_paper',
    'submission_feedback',
    'student_report',
    'class_report',
    'attendance_alert',
    'performance_flag'
  )),
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  related_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'modified')),
  teacher_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teacher manages own suggestions" ON ai_suggestions FOR ALL USING (auth.uid() = teacher_id);

-- =============================================
-- REPORTS
-- =============================================
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('weekly', 'monthly', 'midterm', 'final', 'student', 'class')),
  class_id UUID REFERENCES classes(id),
  student_id UUID REFERENCES students(id),
  period_start DATE,
  period_end DATE,
  content JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teacher manages own reports" ON reports FOR ALL USING (auth.uid() = teacher_id);

-- =============================================
-- AUTO-CREATE TEACHER PROFILE ON SIGNUP
-- =============================================
CREATE OR REPLACE FUNCTION handle_new_teacher()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO teachers (id, full_name, email, subject, academy_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'Physics',
    'Centaurus Academy'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_teacher_signup ON auth.users;
CREATE TRIGGER on_teacher_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_teacher();

-- =============================================
-- PERFORMANCE INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance(class_id, session_date);
CREATE INDEX IF NOT EXISTS idx_assignments_class ON assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_teacher_status ON ai_suggestions(teacher_id, status);
CREATE INDEX IF NOT EXISTS idx_uploads_teacher ON uploads(teacher_id);
