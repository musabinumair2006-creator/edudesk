'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Zap, CheckCircle, Plus, BookOpen, Layers } from 'lucide-react'

export default function SetupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [fullName, setFullName] = useState('Dr. Sarah Jenkins')
  const [academyName, setAcademyName] = useState('Centaurus Academy')
  const [subject, setSubject] = useState('Physics')

  // Step 2 Curriculum levels
  const [levels, setLevels] = useState([
    { name: 'IGCSE Physics', description: 'CIE 0625 Core & Extended Syllabus' },
    { name: 'A-Level Physics', description: 'CIE 9702 Advanced Syllabus' },
    { name: 'Edexcel Physics', description: 'Edexcel International A-Level' },
  ])

  // Step 3 Class
  const [className, setClassName] = useState('Grade 12 Physics (A-Level)')
  const [academicYear, setAcademicYear] = useState('2025-2026')
  const [isSaving, setIsSaving] = useState(false)

  async function handleCompleteSetup() {
    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/upload')
        return
      }

      // Update teacher profile
      await supabase.from('teachers').upsert({
        id: user.id,
        full_name: fullName,
        email: user.email!,
        academy_name: academyName,
        subject,
      })

      // Insert curriculum levels
      for (const lvl of levels) {
        if (lvl.name.trim()) {
          await supabase.from('curriculum_levels').insert({
            teacher_id: user.id,
            name: lvl.name.trim(),
            description: lvl.description.trim() || null,
          })
        }
      }

      // Insert initial class
      await supabase.from('classes').insert({
        teacher_id: user.id,
        name: className.trim() || 'Grade 12 Physics',
        academic_year: academicYear,
      })

      router.replace('/upload')
    } catch {
      router.replace('/upload')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg-base p-4">
      <div className="card w-full max-w-xl p-8 bg-white border border-border shadow-xl">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-semibold text-text-muted mb-2">
            <span>STEP {step} OF 3</span>
            <span>{step === 1 ? 'Profile' : step === 2 ? 'Curriculum Levels' : 'First Class'}</span>
          </div>
          <div className="w-full h-2 bg-bg-subtle rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <h2 className="text-xl font-bold text-text-primary">Welcome to PhysicsDesk</h2>
            <p className="text-xs text-text-secondary">
              Confirm your teaching profile details for Centaurus Academy.
            </p>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Academy Name</label>
              <input
                type="text"
                className="form-input"
                value={academyName}
                onChange={(e) => setAcademyName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Primary Subject</label>
              <input
                type="text"
                className="form-input"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <button
              className="btn btn-primary justify-center py-2.5 mt-2"
              onClick={() => setStep(2)}
            >
              Next: Configure Curricula →
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <h2 className="text-xl font-bold text-text-primary">Physics Curricula</h2>
            <p className="text-xs text-text-secondary">
              Pre-loaded syllabi for your academy classes. Add or modify as needed.
            </p>

            <div className="flex flex-col gap-3">
              {levels.map((lvl, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    className="form-input"
                    value={lvl.name}
                    onChange={(e) => {
                      const updated = [...levels]
                      updated[idx].name = e.target.value
                      setLevels(updated)
                    }}
                    placeholder="Curriculum Level"
                  />
                  <input
                    type="text"
                    className="form-input"
                    value={lvl.description}
                    onChange={(e) => {
                      const updated = [...levels]
                      updated[idx].description = e.target.value
                      setLevels(updated)
                    }}
                    placeholder="Syllabus Description"
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm w-fit"
              onClick={() => setLevels([...levels, { name: '', description: '' }])}
            >
              <Plus size={14} /> Add Curriculum Level
            </button>

            <div className="flex justify-between mt-4">
              <button className="btn btn-ghost" onClick={() => setStep(1)}>
                Back
              </button>
              <button className="btn btn-primary" onClick={() => setStep(3)}>
                Next: Create First Class →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <h2 className="text-xl font-bold text-text-primary">Add Your First Class</h2>
            <p className="text-xs text-text-secondary">
              Create a class section to start importing LMS data and tracking performance.
            </p>

            <div className="form-group">
              <label className="form-label">Class Name</label>
              <input
                type="text"
                className="form-input"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g. Grade 12 Physics (A-Level)"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Academic Year</label>
              <input
                type="text"
                className="form-input"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2025-2026"
              />
            </div>

            <div className="flex justify-between mt-4">
              <button className="btn btn-ghost" onClick={() => setStep(2)}>
                Back
              </button>
              <button
                className="btn btn-primary justify-center py-2.5 px-6"
                onClick={handleCompleteSetup}
                disabled={isSaving}
              >
                {isSaving ? 'Finishing Setup...' : 'Finish Setup & Open Upload Hub 🚀'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
