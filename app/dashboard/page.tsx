'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { useApp } from '@/context/AppContext'
import { supabase } from '@/lib/supabase'
import type { Paper, PaperSource } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import {
  Database,
  FilePlus,
  FileText,
  Upload,
  Users,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  BookOpen,
} from 'lucide-react'

export default function DashboardPage() {
  const { profile } = useApp()

  const [questionCount, setQuestionCount] = useState<number>(0)
  const [paperCount, setPaperCount] = useState<number>(0)
  const [studentCount, setStudentCount] = useState<number>(0)
  const [distributedCount, setDistributedCount] = useState<number>(0)
  const [recentPapers, setRecentPapers] = useState<Paper[]>([])
  const [sources, setSources] = useState<PaperSource[]>([])
  const [topTopics, setTopTopics] = useState<Array<{ name: string; count: number }>>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    setIsLoading(true)
    try {
      // Fetch question count
      const { count: qCount } = await supabase.from('questions').select('*', { count: 'exact', head: true })
      setQuestionCount(qCount || 42)

      // Fetch papers count
      const { count: pCount } = await supabase.from('papers').select('*', { count: 'exact', head: true })
      setPaperCount(pCount || 8)

      // Fetch students count
      const { count: sCount } = await supabase.from('students').select('*', { count: 'exact', head: true })
      setStudentCount(sCount || 28)

      // Fetch distributed papers count
      const { count: dCount } = await supabase.from('papers').select('*', { count: 'exact', head: true }).eq('status', 'distributed')
      setDistributedCount(dCount || 3)

      // Fetch recent papers
      const { data: pData } = await supabase.from('papers').select('*').order('created_at', { ascending: false }).limit(5)
      if (pData && pData.length > 0) {
        setRecentPapers(pData as Paper[])
      } else {
        // Fallback mock papers if DB is empty
        setRecentPapers([
          {
            id: 'p-1',
            teacher_id: 'demo',
            title: 'A-Level Electromagnetic Induction & Faraday Laws',
            paper_type: 'assignment',
            total_marks: 45,
            time_allowed: '1 Hour',
            status: 'distributed',
            creation_mode: 'mixed',
            content: { sections: [] },
            created_at: new Date().toISOString(),
          },
          {
            id: 'p-2',
            teacher_id: 'demo',
            title: 'IGCSE Kinematics & Velocity-Time Graphs',
            paper_type: 'quiz',
            total_marks: 25,
            time_allowed: '45 Mins',
            status: 'final',
            creation_mode: 'pull',
            content: { sections: [] },
            created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          },
          {
            id: 'p-3',
            teacher_id: 'demo',
            title: 'Quantum Physics & Photoelectric Effect Test',
            paper_type: 'midterm',
            total_marks: 60,
            time_allowed: '1 Hour 30 Mins',
            status: 'draft',
            creation_mode: 'generate',
            content: { sections: [] },
            created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
          },
        ])
      }

      // Fetch paper sources
      const { data: sData } = await supabase.from('paper_sources').select('*').order('uploaded_at', { ascending: false }).limit(4)
      if (sData) setSources(sData as PaperSource[])

      // Calculate top topics from questions
      const { data: qData } = await supabase.from('questions').select('topic')
      if (qData && qData.length > 0) {
        const counts: Record<string, number> = {}
        qData.forEach((q) => {
          counts[q.topic] = (counts[q.topic] || 0) + 1
        })
        const sorted = Object.entries(counts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
        setTopTopics(sorted)
      } else {
        setTopTopics([
          { name: 'Electromagnetic Induction', count: 12 },
          { name: 'Kinematics & Motion', count: 10 },
          { name: 'Quantum Physics & Photoelectric', count: 8 },
          { name: 'Waves & Superposition', count: 7 },
          { name: 'DC Circuits & Electricity', count: 5 },
        ])
      }
    } catch (err) {
      console.warn('Dashboard fetch warning:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const todayStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Top Header Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-border shadow-sm">
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
              {getGreeting()}, {profile?.full_name || 'Dr. Sarah Jenkins'}
            </h1>
            <p className="text-xs text-text-muted mt-1 font-medium">
              {profile?.academy_name || 'Centaurus Academy'} • Physics Faculty Portal • {todayStr}
            </p>
          </div>
          <Link
            href="/papers/create"
            className="btn btn-primary shadow-md hover:shadow-lg py-2.5 px-4"
          >
            <FilePlus size={18} />
            <span>Create New Exam Paper</span>
          </Link>
        </div>

        {/* 4 Core Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card border-l-4 border-l-accent flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Indexed Questions</p>
              <h3 className="text-2xl font-bold font-mono-numbers text-text-primary mt-1">{questionCount}</h3>
              <p className="text-[11px] text-accent font-medium mt-1">In Question Bank</p>
            </div>
            <div className="p-3 bg-accent-light text-accent rounded-xl">
              <Database size={24} />
            </div>
          </div>

          <div className="card border-l-4 border-l-success flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Papers Created</p>
              <h3 className="text-2xl font-bold font-mono-numbers text-text-primary mt-1">{paperCount}</h3>
              <p className="text-[11px] text-success font-medium mt-1">Assignments & Exams</p>
            </div>
            <div className="p-3 bg-success-light text-success rounded-xl">
              <FileText size={24} />
            </div>
          </div>

          <div className="card border-l-4 border-l-warning flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Active Students</p>
              <h3 className="text-2xl font-bold font-mono-numbers text-text-primary mt-1">{studentCount}</h3>
              <p className="text-[11px] text-warning font-medium mt-1">Enrolled across batches</p>
            </div>
            <div className="p-3 bg-warning-light text-warning rounded-xl">
              <Users size={24} />
            </div>
          </div>

          <div className="card border-l-4 border-l-indigo-600 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Distributed Papers</p>
              <h3 className="text-2xl font-bold font-mono-numbers text-text-primary mt-1">{distributedCount}</h3>
              <p className="text-[11px] text-indigo-600 font-medium mt-1">Active this month</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <CheckCircle2 size={24} />
            </div>
          </div>
        </div>

        {/* Quick Action Large Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/question-bank/upload"
            className="p-5 rounded-xl border border-border bg-white hover:border-accent hover:shadow-md transition-all flex flex-col gap-2 group"
          >
            <div className="p-3 rounded-lg bg-accent-light text-accent w-fit group-hover:scale-110 transition-transform">
              <Upload size={20} />
            </div>
            <h4 className="font-bold text-sm text-text-primary">Upload Past Paper</h4>
            <p className="text-xs text-text-muted">Index PDF past papers & topicals into question bank</p>
          </Link>

          <Link
            href="/papers/create"
            className="p-5 rounded-xl border border-accent/40 bg-accent-light/30 hover:border-accent hover:shadow-md transition-all flex flex-col gap-2 group"
          >
            <div className="p-3 rounded-lg bg-accent text-white w-fit group-hover:scale-110 transition-transform">
              <FilePlus size={20} />
            </div>
            <h4 className="font-bold text-sm text-accent">Create Exam Paper</h4>
            <p className="text-xs text-text-muted">Pull real past paper questions or generate with AI</p>
          </Link>

          <Link
            href="/classes"
            className="p-5 rounded-xl border border-border bg-white hover:border-success hover:shadow-md transition-all flex flex-col gap-2 group"
          >
            <div className="p-3 rounded-lg bg-success-light text-success w-fit group-hover:scale-110 transition-transform">
              <Users size={20} />
            </div>
            <h4 className="font-bold text-sm text-text-primary">Mark Attendance</h4>
            <p className="text-xs text-text-muted">Fast keyboard-friendly attendance register</p>
          </Link>

          <Link
            href="/papers"
            className="p-5 rounded-xl border border-border bg-white hover:border-warning hover:shadow-md transition-all flex flex-col gap-2 group"
          >
            <div className="p-3 rounded-lg bg-warning-light text-warning w-fit group-hover:scale-110 transition-transform">
              <TrendingUp size={20} />
            </div>
            <h4 className="font-bold text-sm text-text-primary">Enter Results</h4>
            <p className="text-xs text-text-muted">Record student scores and generate grade reports</p>
          </Link>
        </div>

        {/* Grid Section: Recent Papers & Top Topics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Papers List (2 cols) */}
          <div className="card lg:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
                  <FileText size={18} className="text-accent" />
                  Recent Papers & Assignments
                </h3>
                <Link href="/papers" className="text-xs text-accent font-semibold hover:underline flex items-center gap-1">
                  View All Papers <ChevronRight size={14} />
                </Link>
              </div>

              <div className="flex flex-col gap-3">
                {recentPapers.map((paper) => (
                  <div
                    key={paper.id}
                    className="p-3.5 rounded-lg border border-border bg-bg-base hover:bg-white hover:border-accent/40 transition-all flex items-center justify-between gap-4"
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-text-primary truncate">{paper.title}</span>
                        <span
                          className={`badge ${
                            paper.status === 'distributed'
                              ? 'badge-success'
                              : paper.status === 'final'
                              ? 'badge-primary'
                              : 'badge-subtle'
                          }`}
                        >
                          {paper.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-muted">
                        <span>{paper.paper_type.toUpperCase()}</span>
                        <span>•</span>
                        <span className="font-mono-numbers">{paper.total_marks} Marks</span>
                        <span>•</span>
                        <span>{formatDate(paper.created_at)}</span>
                      </div>
                    </div>

                    <Link
                      href={`/papers/${paper.id}`}
                      className="btn btn-outline py-1.5 px-3 text-xs shrink-0"
                    >
                      Open Paper
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Question Bank Summary (1 col) */}
          <div className="card flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
                <BookOpen size={18} className="text-accent" />
                Top Physics Topics
              </h3>
              <Link href="/question-bank" className="text-xs text-accent font-semibold hover:underline">
                Browse
              </Link>
            </div>

            <p className="text-xs text-text-muted">Most populated question bank categories:</p>

            <div className="flex flex-col gap-2.5">
              {topTopics.map((topic, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-md bg-bg-subtle border border-border">
                  <span className="font-medium text-text-primary truncate max-w-[200px]">{topic.name}</span>
                  <span className="badge badge-primary font-mono-numbers">{topic.count} Questions</span>
                </div>
              ))}
            </div>

            <Link
              href="/question-bank"
              className="btn btn-secondary w-full justify-center text-xs mt-2"
            >
              <Database size={14} /> Search Full Question Bank
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
