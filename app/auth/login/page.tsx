'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Zap, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setIsLoading(false)
      return
    }

    if (data.user) {
      // Check if academy has been set up
      const { data: profile } = await supabase
        .from('teacher_profile')
        .select('academy_name')
        .eq('id', data.user.id)
        .single()

      if (!profile?.academy_name) {
        router.push('/auth/setup')
      } else {
        router.push('/dashboard')
      }
    }
    setIsLoading(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg-base)' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center gap-2 mb-3"
            style={{ color: 'var(--accent)' }}
          >
            <Zap size={28} fill="currentColor" />
            <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              EduDesk
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Physics Academy Management System
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '2rem' }}>
          <h1 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Sign in to your account
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            Enter your credentials to access EduDesk
          </p>

          {error && (
            <div
              className="flex items-start gap-2 p-3 rounded-md mb-4 text-sm"
              style={{
                background: 'var(--danger-light)',
                border: '1px solid var(--danger)',
                color: 'var(--danger)',
              }}
            >
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="teacher@academy.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          EduDesk is a private single-teacher application.
          <br />Contact your administrator for access.
        </p>
      </div>
    </div>
  )
}
