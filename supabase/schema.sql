-- EduDesk Database Schema
-- Run this in your Supabase SQL editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TEACHER PROFILE (single teacher application)
CREATE TABLE teacher_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  academy_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE teacher_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teacher reads own profile" ON teacher_profile FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Teacher updates own profile" ON teacher_profile FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Teacher inserts own profile" ON teacher_profile FOR INSERT WITH CHECK (auth.uid() = id);

-- CURRICULUM LEVELS (expandable — teacher can add more)
CREATE TABLE curriculum_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES teacher_profile(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE curriculum_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teacher manages own levels" ON curriculum_levels FOR ALL USING (auth.uid() = teacher_id);

-- CLASSES
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES teacher_profile(id) ON DELETE CASCADE,
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

-- STUDENTS
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES teacher_profile(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  roll_number TEXT,
  email TEXT,
  phone TEXT,
  parent_phone TEXT,
  date_of_birth DATE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teacher manages own students" ON students FOR ALL USING (auth.uid() = teacher_id);

-- CLASS ENROLLMENTS (student <-> class many-to-many)
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teacher_profile(id),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, class_id)
);
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teacher manages own enrollments" ON enrollments FOR ALL USING (auth.uid() = teacher_id);

-- ATTENDANCE
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES teacher_profile(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  session_label TEXT,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  note TEXT,
  marked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, class_id, session_date)
);
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teacher manages own attendance" ON attendance FOR ALL USING (auth.uid() = teacher_id);

-- ASSIGNMENTS
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES teacher_profile(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  instructions TEXT NOT NULL,
  topic TEXT,
  curriculum_level_id UUID REFERENCES curriculum_levels(id),
  total_marks INTEGER NOT NULL,
  due_date TIMESTAMPTZ,
  assignment_type TEXT DEFAULT 'assignment' CHECK (assignment_type IN ('assignment', 'quiz', 'midterm', 'finalterm', 'classwork')),
  ai_generated BOOLEAN DEFAULT FALSE,
  answer_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teacher manages own assignments" ON assignments FOR ALL USING (auth.uid() = teacher_id);

-- SUBMISSIONS
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES teacher_profile(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  content TEXT,
  file_url TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  marks_obtained NUMERIC(5,2),
  feedback TEXT,
  ai_checked BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'checked', 'returned')),
  UNIQUE(assignment_id, student_id)
);
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teacher manages own submissions" ON submissions FOR ALL USING (auth.uid() = teacher_id);

-- PAPERS (generated exam papers)
CREATE TABLE papers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES teacher_profile(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  paper_type TEXT NOT NULL CHECK (paper_type IN ('midterm', 'finalterm')),
  curriculum_level_id UUID REFERENCES curriculum_levels(id),
  topics TEXT[],
  total_marks INTEGER,
  time_allowed TEXT,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE papers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teacher manages own papers" ON papers FOR ALL USING (auth.uid() = teacher_id);

-- REPORTS (cached generated reports)
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES teacher_profile(id) ON DELETE CASCADE,
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

-- AUTH TRIGGER
CREATE OR REPLACE FUNCTION handle_new_teacher()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO teacher_profile (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_teacher_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_teacher();

-- Indexes for performance
CREATE INDEX idx_attendance_class_date ON attendance(class_id, session_date);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX idx_submissions_student ON submissions(student_id);
CREATE INDEX idx_enrollments_class ON enrollments(class_id);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_assignments_class ON assignments(class_id);
CREATE INDEX idx_classes_teacher ON classes(teacher_id);
