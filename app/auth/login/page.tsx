'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Zap, Lock, Mail, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      })

      if (error) {
        setErrorMsg(error.message)
        setIsLoading(false)
        return
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('teachers')
          .select('academy_name')
          .eq('id', data.user.id)
          .single()

        if (!profile?.academy_name) {
          router.replace('/auth/setup')
        } else {
          router.replace('/dashboard')
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected authentication error occurred.')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg-base p-4">
      <div className="card w-full max-w-md p-8 shadow-xl bg-white border border-border">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="p-3 bg-accent-light text-accent rounded-xl mb-3">
            <Zap size={28} />
          </div>
          <h1 className="text-2xl font-extrabold text-text-primary">PhysicsDesk</h1>
          <p className="text-xs text-text-muted mt-1">Centaurus Academy Teacher Assistant</p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-md bg-danger-light text-danger text-xs mb-4 flex items-center gap-2 border border-danger">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-text-muted" />
              <input
                type="email"
                className="form-input pl-9"
                placeholder="teacher@centaurus.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-text-muted" />
              <input
                type="password"
                className="form-input pl-9"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full py-2.5 justify-center mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} />
                Signing in...
              </>
            ) : (
              'Sign In to PhysicsDesk'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-text-muted border-t border-border pt-4">
          PhysicsDesk is reserved for authorized Centaurus Academy faculty.
        </div>
      </div>
    </div>
  )
}
