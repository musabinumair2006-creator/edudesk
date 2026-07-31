'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import {
  Sparkles,
  ArrowLeft,
  Printer,
  Globe,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  FlaskConical,
  MessageSquare,
  FileCheck,
  Zap,
} from 'lucide-react'
import LMSPublishModal from '@/components/lms/LMSPublishModal'
import type { LessonPlan } from '@/lib/types'

export default function DetailedLessonPlanPage() {
  const params = useParams()
  const id = params?.id as string

  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLmsModalOpen, setIsLmsModalOpen] = useState(false)

  useEffect(() => {
    fetch('/api/curriculum')
      .then((res) => res.json())
      .then((data) => {
        if (data.lesson_plans) {
          const match = data.lesson_plans.find((lp: LessonPlan) => lp.id === id)
          if (match) {
            setLessonPlan(match)
          } else if (data.lesson_plans.length > 0) {
            setLessonPlan(data.lesson_plans[0])
          }
        }
      })
      .finally(() => setIsLoading(false))
  }, [id])

  function handlePrint() {
    window.print()
  }

  function handlePublishLms() {
    setIsLmsModalOpen(true)
  }

  if (isLoading) {
    return (
      <AppShell>
        <Header title="Lesson Plan Details" />
        <div className="flex justify-center items-center py-20">
          <span className="spinner spinner-lg" />
        </div>
      </AppShell>
    )
  }

  if (!lessonPlan) {
    return (
      <AppShell>
        <Header title="Lesson Plan Not Found" />
        <div className="page-body text-center py-16 text-slate-400">
          <p>The requested lesson plan could not be found.</p>
          <Link href="/curriculum" className="btn btn-primary btn-sm mt-4">
            Return to Library
          </Link>
        </div>
      </AppShell>
    )
  }

  const { content } = lessonPlan

  return (
    <AppShell>
      <Header
        title={lessonPlan.title}
        subtitle={`${lessonPlan.topic} • ${lessonPlan.duration_minutes} Mins • ${lessonPlan.target_audience || 'Physics'}`}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/curriculum" className="btn btn-secondary btn-sm">
              <ArrowLeft size={14} /> Back
            </Link>
            <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
              <Printer size={14} /> Print Plan
            </button>
            <button
              className="btn btn-primary btn-sm flex items-center gap-1.5"
              onClick={handlePublishLms}
            >
              <Globe size={14} />
              <span>Publish to School LMS</span>
            </button>
          </div>
        }
      />

      <LMSPublishModal
        isOpen={isLmsModalOpen}
        onClose={() => setIsLmsModalOpen(false)}
        contentType="lesson_plan"
        itemTitle={lessonPlan.title}
        itemDetails={`Topic: ${lessonPlan.topic} • Duration: ${lessonPlan.duration_minutes} mins • Audience: ${lessonPlan.target_audience || 'Physics Class'}`}
      />

      <div className="page-body max-w-4xl mx-auto flex flex-col gap-6 print:p-0 print:max-w-none">
        {/* Header Summary Card */}
        <div className="card bg-slate-900 border-slate-800 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="px-3 py-1 rounded text-xs font-bold bg-purple-500/20 text-purple-300 flex items-center gap-1.5">
              <Zap size={12} /> {lessonPlan.topic}
            </span>
            <div className="text-xs text-slate-400 flex items-center gap-3">
              <span>⏱️ {lessonPlan.duration_minutes} Minutes</span>
              <span>🎓 {lessonPlan.target_audience}</span>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-white leading-tight">{lessonPlan.title}</h1>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">{content.overview}</p>
          </div>
        </div>

        {/* Objectives & Misconceptions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Objectives */}
          <div className="card border-blue-500/20 bg-blue-950/10 p-5">
            <h3 className="text-sm font-bold text-blue-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CheckCircle2 size={16} /> Learning Objectives
            </h3>
            <ul className="flex flex-col gap-2">
              {content.learning_objectives.map((obj, i) => (
                <li key={i} className="text-xs text-slate-200 flex items-start gap-2">
                  <span className="text-blue-400 font-bold">•</span>
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Misconceptions */}
          <div className="card border-amber-500/20 bg-amber-950/10 p-5">
            <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <AlertTriangle size={16} /> Common Student Misconceptions
            </h3>
            <ul className="flex flex-col gap-2">
              {content.common_misconceptions.map((misc, i) => (
                <li key={i} className="text-xs text-slate-200 flex items-start gap-2">
                  <span className="text-amber-400 font-bold">⚠️</span>
                  <span>{misc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Equations & Vocabulary */}
        <div className="card border-slate-800 p-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
            <BookOpen size={16} className="text-purple-400" /> Key Equations & Physical Definitions
          </h3>
          <div className="flex flex-wrap gap-2">
            {content.key_equations_and_terms.map((eq, i) => (
              <span key={i} className="bg-slate-800 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 font-mono">
                {eq}
              </span>
            ))}
          </div>
        </div>

        {/* Step-by-Step Teaching Timeline */}
        <div className="card border-slate-800 p-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Clock size={16} className="text-blue-400" /> Step-by-Step Lesson Timeline ({lessonPlan.duration_minutes} Mins)
          </h3>

          <div className="flex flex-col gap-4">
            {content.timeline.map((step, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col md:flex-row items-start gap-4"
              >
                <div className="shrink-0 w-24">
                  <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded block text-center">
                    {step.duration_minutes} mins
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 mt-1 block text-center">
                    Phase {idx + 1}
                  </span>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-white mb-1">👨‍🏫 Teacher Activity</h4>
                    <p className="text-xs text-slate-300">{step.teacher_activity}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-blue-300 mb-1">🙋 Student Activity</h4>
                    <p className="text-xs text-slate-300">{step.student_activity}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Practical Experiment Guide (If applicable) */}
        {content.practical_experiment && (
          <div className="card border-emerald-500/30 bg-emerald-950/10 p-5">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FlaskConical size={18} className="text-emerald-400" />
                <h3 className="text-sm font-bold text-emerald-300 uppercase tracking-wider">
                  Hands-On Practical Lab: {content.practical_experiment.title}
                </h3>
              </div>
              <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-semibold">
                Practical Guide
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-bold text-white mb-2">🧰 Required Apparatus</h4>
                <ul className="flex flex-col gap-1.5">
                  {content.practical_experiment.apparatus.map((item, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white mb-2">🛡️ Safety Precautions</h4>
                <ul className="flex flex-col gap-1.5">
                  {content.practical_experiment.safety_precautions.map((item, i) => (
                    <li key={i} className="text-xs text-amber-300 flex items-center gap-2">
                      <span>⚠️</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-emerald-500/20">
              <h4 className="text-xs font-bold text-white mb-2">📋 Lab Procedure Steps</h4>
              <ol className="flex flex-col gap-2">
                {content.practical_experiment.procedure.map((step, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="font-bold text-emerald-400">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {/* Discussion Starters & Homework */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card border-slate-800 p-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <MessageSquare size={16} className="text-purple-400" /> Discussion Starters
            </h3>
            <ul className="flex flex-col gap-2">
              {content.discussion_starters.map((starter, i) => (
                <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="text-purple-400 font-bold">❓</span>
                  <span>{starter}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card border-slate-800 p-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileCheck size={16} className="text-blue-400" /> Homework Assignment
            </h3>
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
              <div className="font-bold text-xs text-white mb-1">{content.homework_assignment.title}</div>
              <p className="text-xs text-slate-300">{content.homework_assignment.description}</p>
              <div className="text-[11px] text-blue-400 mt-2">
                ⏱️ Estimated Time: {content.homework_assignment.estimated_time}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
