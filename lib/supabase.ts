import { createBrowserClient, createServerClient as createSSRServerClient } from '@supabase/ssr'

const DEFAULT_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ldfmjhhmkdjtccefcesk.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZm1qaGhta2RqdGNjZWZjZXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMzkzNDgsImV4cCI6MjEwMDkxNTM0OH0.ZfU8Bx-XAOFGyUHn_DDwoxK2zhumBqdloQx2CLuUMPE'

/**
 * Browser singleton client for Client Components
 */
export const supabase = createBrowserClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY)

/**
 * Server client factory for API Routes & Server Components
 */
export function createServerClient() {
  try {
    const { cookies } = require('next/headers')
    const cookieStore = cookies()
    return createSSRServerClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Handled in Server Components
          }
        },
      },
    })
  } catch {
    return supabase as any
  }
}
