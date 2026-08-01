import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ldfmjhhmkdjtccefcesk.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZm1qaGhta2RqdGNjZWZjZXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMzkzNDgsImV4cCI6MjEwMDkxNTM0OH0.ZfU8Bx-XAOFGyUHn_DDwoxK2zhumBqdloQx2CLuUMPE'
  return createBrowserClient(url, key)
}
