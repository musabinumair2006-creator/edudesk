'use client'

import Link from 'next/link'
import {
  Zap,
  BookOpen,
  Users,
  ClipboardCheck,
  FileText,
  BarChart2,
  Sparkles,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  Globe,
  Cpu,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col font-sans">
      {/* Top Header */}
      <header
        className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-border flex items-center justify-between px-6 py-4"
      >
        <div className="flex items-center gap-2">
          <div
            className="p-1.5 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--accent)', color: 'white' }}
          >
            <Zap size={20} fill="currentColor" />
          </div>
          <span className="text-xl font-bold tracking-tight">EduDesk</span>
          <span
            className="badge ml-2 font-mono"
            style={{ background: '#EDE9FE', color: '#7C3AED', fontSize: '11px' }}
          >
            Gemini 2.5 Powered
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="btn btn-ghost btn-sm">
            Sign In
          </Link>
          <Link href="/dashboard" className="btn btn-primary btn-sm">
            Launch LMS <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-6 max-w-6xl mx-auto text-center flex flex-col items-center">
        <div
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-6"
          style={{ background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid rgba(37,99,235,0.2)' }}
        >
          <Sparkles size={14} /> Next-Gen AI LMS Assistant for Physics Academies
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight">
          Supercharge Your Physics Academy with <span style={{ color: 'var(--accent)' }}>Gemini AI</span> & Smart LMS
        </h1>

        <p className="mt-6 text-lg md:text-xl text-text-secondary max-w-2xl">
          EduDesk is the standalone management assistant built specifically for Physics teachers running IGCSE, A-Level, and Edexcel courses.
        </p>

        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Link href="/dashboard" className="btn btn-primary btn-lg">
            ⚡ Open LMS Dashboard <ArrowRight size={16} />
          </Link>
          <Link href="/auth/setup" className="btn btn-secondary btn-lg">
            Configure Setup Wizard
          </Link>
        </div>

        {/* Feature Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-text-muted">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} style={{ color: 'var(--success)' }} /> Google Gemini 2.5 Integration
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={16} style={{ color: 'var(--success)' }} /> Netlify Serverless Ready
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={16} style={{ color: 'var(--success)' }} /> Supabase Multi-Class RLS
          </div>
        </div>
      </section>

      {/* Core Capabilities Grid */}
      <section className="py-16 px-6 max-w-6xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold">Built for Academic Excellence</h2>
          <p className="text-text-muted text-sm mt-2">
            Everything a single teacher needs to run a top-tier physics academy efficiently.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Gemini AI Material Generator */}
          <div className="card hover:shadow-lg transition-all" style={{ border: '1px solid var(--border)' }}>
            <div className="p-3 rounded-lg w-fit mb-4" style={{ background: 'var(--accent-light)' }}>
              <Cpu size={24} style={{ color: 'var(--accent)' }} />
            </div>
            <h3 className="font-bold text-lg mb-2">Gemini AI Content Creation</h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              Instantly generate syllabus-matched assignments, quizzes, and problem sets calibrated to IGCSE, A-Level, or Edexcel standards.
            </p>
            <div className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
              • Gemini 2.5 Pro JSON engine
            </div>
          </div>

          {/* Card 2: AI Submission Auto-Marking */}
          <div className="card hover:shadow-lg transition-all" style={{ border: '1px solid var(--border)' }}>
            <div className="p-3 rounded-lg w-fit mb-4" style={{ background: 'var(--success-light)' }}>
              <ClipboardCheck size={24} style={{ color: 'var(--success)' }} />
            </div>
            <h3 className="font-bold text-lg mb-2">Instant AI Submission Marking</h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              Upload or type student answers to receive automated mark suggestions, letter grades ($A^*$ to $U$), strength highlights, and misconception detection.
            </p>
            <div className="text-xs font-semibold" style={{ color: 'var(--success)' }}>
              • Sub-second Gemini 2.5 Flash evaluation
            </div>
          </div>

          {/* Card 3: Exam Paper Generator */}
          <div className="card hover:shadow-lg transition-all" style={{ border: '1px solid var(--border)' }}>
            <div className="p-3 rounded-lg w-fit mb-4" style={{ background: 'var(--warning-light)' }}>
              <FileText size={24} style={{ color: 'var(--warning)' }} />
            </div>
            <h3 className="font-bold text-lg mb-2">Complete Exam Paper Generator</h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              Create full Mid-Term and Final-Term examination papers complete with candidate cover pages, structured sections, and detailed teacher mark schemes.
            </p>
            <div className="text-xs font-semibold" style={{ color: 'var(--warning)' }}>
              • Multi-topic exam builder
            </div>
          </div>

          {/* Card 4: Smart Attendance Sheet */}
          <div className="card hover:shadow-lg transition-all" style={{ border: '1px solid var(--border)' }}>
            <div className="p-3 rounded-lg w-fit mb-4" style={{ background: 'var(--danger-light)' }}>
              <Users size={24} style={{ color: 'var(--danger)' }} />
            </div>
            <h3 className="font-bold text-lg mb-2">Class Attendance Suite</h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              Mark attendance rapidly with keyboard shortcuts (`P`/`A`/`L`/`E`), record session notes, and view horizontal stacked bar charts of student attendance trends.
            </p>
            <div className="text-xs font-semibold" style={{ color: 'var(--danger)' }}>
              • Quick shortcut marking
            </div>
          </div>

          {/* Card 5: Student Analytics */}
          <div className="card hover:shadow-lg transition-all" style={{ border: '1px solid var(--border)' }}>
            <div className="p-3 rounded-lg w-fit mb-4" style={{ background: '#F3E8FF' }}>
              <BarChart2 size={24} style={{ color: '#7C3AED' }} />
            </div>
            <h3 className="font-bold text-lg mb-2">Student Performance Trends</h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              Track student trajectory with interactive Recharts line graphs showing score trends, pass threshold lines, and grade distribution.
            </p>
            <div className="text-xs font-semibold" style={{ color: '#7C3AED' }}>
              • Recharts visual insights
            </div>
          </div>

          {/* Card 6: Netlify One-Click Deploy */}
          <div className="card hover:shadow-lg transition-all" style={{ border: '1px solid var(--border)' }}>
            <div className="p-3 rounded-lg w-fit mb-4" style={{ background: '#E0F2FE' }}>
              <Globe size={24} style={{ color: '#0284C7' }} />
            </div>
            <h3 className="font-bold text-lg mb-2">Netlify Ready Deployment</h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              Pre-configured with `netlify.toml` and `@netlify/plugin-nextjs` for zero-configuration deployment on Netlify's global edge network.
            </p>
            <div className="text-xs font-semibold" style={{ color: '#0284C7' }}>
              • Netlify edge & serverless functions
            </div>
          </div>
        </div>
      </section>

      {/* Netlify Deployment Notice */}
      <section className="py-12 px-6 max-w-4xl mx-auto w-full">
        <div
          className="card p-8 text-center flex flex-col items-center"
          style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', color: 'white' }}
        >
          <Globe size={36} className="mb-3" style={{ color: '#38BDF8' }} />
          <h2 className="text-2xl font-bold text-white mb-2">Deploy to Netlify in Minutes</h2>
          <p className="text-sm max-w-xl text-slate-300 mb-6">
            EduDesk is fully optimized for Netlify deployment with built-in serverless functions for Gemini API requests and Supabase database authentication.
          </p>
          <div className="flex gap-4">
            <Link href="/dashboard" className="btn btn-primary">
              Launch Application <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-border text-center text-xs text-text-muted">
        <p>© 2026 EduDesk — Gemini API Powered Physics Academy Assistant. All rights reserved.</p>
      </footer>
    </div>
  )
}
