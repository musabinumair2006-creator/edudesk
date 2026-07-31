import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import type { LMSConnection } from '@/lib/types'

const MOCK_LMS_CONNECTIONS: LMSConnection[] = [
  {
    id: 'lms-1',
    teacher_id: 'teacher-1',
    provider: 'google_classroom',
    academy_name: 'St. Mary High School (Physics Dept)',
    portal_url: 'https://classroom.google.com',
    account_email: 'teacher@stmarys.edu',
    gradebook_url: 'https://classroom.google.com/u/0/h',
    coursework_url: 'https://classroom.google.com/u/0/w/MjM0',
    attendance_url: 'https://classroom.google.com/u/0/r/MjM0',
    live_class_url: 'https://meet.google.com/abc-defg-hij',
    notes: 'A-Level Physics 2026 Batch',
    access_token: 'gc_mock_token_123',
    status: 'connected',
    last_synced_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: 'lms-2',
    teacher_id: 'teacher-1',
    provider: 'canvas',
    academy_name: 'Cambridge Science Academy',
    portal_url: 'https://canvas.instructure.com',
    account_email: 'physics.prof@cambridge-academy.org',
    gradebook_url: 'https://canvas.instructure.com/courses/101/gradebook',
    coursework_url: 'https://canvas.instructure.com/courses/101/assignments',
    attendance_url: 'https://canvas.instructure.com/courses/101/attendance',
    live_class_url: 'https://zoom.us/j/9876543210',
    notes: 'IGCSE Physics Honors Class',
    access_token: 'canvas_mock_token_456',
    status: 'connected',
    last_synced_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
  {
    id: 'lms-3',
    teacher_id: 'teacher-1',
    provider: 'custom',
    academy_name: 'Beaconhouse Science Institute',
    portal_url: 'https://lms.beaconhouse.net',
    account_email: 'm.numair@beaconhouse.edu.pk',
    gradebook_url: 'https://lms.beaconhouse.net/teacher/marks',
    coursework_url: 'https://lms.beaconhouse.net/teacher/assignments',
    attendance_url: 'https://lms.beaconhouse.net/teacher/attendance',
    live_class_url: 'https://teams.microsoft.com/l/meetup-join/12345',
    notes: 'Custom School Academy Portal',
    access_token: null,
    status: 'connected',
    last_synced_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
]

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ connections: MOCK_LMS_CONNECTIONS })
    }

    const { data, error } = await supabase
      .from('lms_connections')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !data || data.length === 0) {
      return NextResponse.json({ connections: MOCK_LMS_CONNECTIONS })
    }

    return NextResponse.json({ connections: data })
  } catch (err) {
    return NextResponse.json({ connections: MOCK_LMS_CONNECTIONS })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      provider,
      academy_name,
      portal_url,
      account_email,
      gradebook_url,
      coursework_url,
      attendance_url,
      live_class_url,
      notes,
    } = body

    if (!provider || !academy_name || !portal_url) {
      return NextResponse.json(
        { error: 'Provider, Academy Name, and Portal URL are required' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    const newConnection: Partial<LMSConnection> = {
      provider,
      academy_name,
      portal_url,
      account_email: account_email || null,
      gradebook_url: gradebook_url || null,
      coursework_url: coursework_url || null,
      attendance_url: attendance_url || null,
      live_class_url: live_class_url || null,
      notes: notes || null,
      status: 'connected',
      last_synced_at: new Date().toISOString(),
    }

    if (session?.user) {
      const { data, error } = await supabase
        .from('lms_connections')
        .insert({
          ...newConnection,
          teacher_id: session.user.id,
        })
        .select()
        .single()

      if (!error && data) {
        return NextResponse.json({ connection: data })
      }
    }

    // Mock fallback response for instant preview
    const createdMock: LMSConnection = {
      id: 'lms-' + Date.now(),
      teacher_id: session?.user?.id || 'demo-teacher',
      provider,
      academy_name,
      portal_url,
      account_email: account_email || null,
      gradebook_url: gradebook_url || null,
      coursework_url: coursework_url || null,
      attendance_url: attendance_url || null,
      live_class_url: live_class_url || null,
      notes: notes || null,
      access_token: 'token_' + Date.now(),
      status: 'connected',
      last_synced_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }

    return NextResponse.json({ connection: createdMock })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to connect LMS' },
      { status: 500 }
    )
  }
}
