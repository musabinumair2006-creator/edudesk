import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import type { LessonPlan } from '@/lib/types'

const MOCK_LESSON_PLANS: LessonPlan[] = [
  {
    id: 'lp-1',
    teacher_id: 'teacher-1',
    curriculum_level_id: 'lvl-1',
    title: 'Electromagnetic Induction & Faraday’s Law',
    topic: 'Electromagnetism',
    duration_minutes: 60,
    target_audience: 'A-Level Physics (Year 13)',
    ai_generated: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    content: {
      overview: 'Comprehensive 60-minute lesson introducing Faraday’s and Lenz’s laws of electromagnetic induction with live coil-and-magnet demonstrations.',
      learning_objectives: [
        'State and apply Faraday’s law of electromagnetic induction.',
        'Use Lenz’s law to determine the direction of induced EMF and current.',
        'Calculate magnetic flux linkage in rotating coils.',
      ],
      key_equations_and_terms: [
        'Φ = B · A · cos(θ)',
        'ε = -N · (ΔΦ / Δt)',
        'Lenz’s Law, Flux Linkage, Weber (Wb), Tesla (T)',
      ],
      common_misconceptions: [
        'Confusing static magnetic flux with the RATE of change of magnetic flux.',
        'Forgetting the negative sign representing energy conservation in Lenz’s law.',
      ],
      timeline: [
        { phase: 'Hook / Demonstration', duration_minutes: 10, teacher_activity: 'Drop neodymium magnet down copper tube vs plastic tube.', student_activity: 'Observe damping effect and discuss eddy currents.' },
        { phase: 'Derivation & Theory', duration_minutes: 20, teacher_activity: 'Derive ε = -N(ΔΦ/Δt) on whiteboard with flux diagrams.', student_activity: 'Take structured notes on flux density vs total linkage.' },
        { phase: 'Guided Problem Solving', duration_minutes: 20, teacher_activity: 'Work through 3 past A-Level exam questions.', student_activity: 'Solve calculation worksheet in pairs.' },
        { phase: 'Plenary & Exit Ticket', duration_minutes: 10, teacher_activity: 'Collect exit slips answering "How does Lenz’s law enforce conservation of energy?"', student_activity: 'Complete exit slip.' },
      ],
      practical_experiment: {
        title: 'Investigating Induced EMF in a Secondary Coil',
        apparatus: ['Primary & Secondary Coils', 'Signal Generator', 'Oscilloscope', 'Iron Core'],
        procedure: [
          'Connect primary coil to AC signal generator at 50 Hz.',
          'Insert iron core and position secondary coil coaxially.',
          'Measure peak-to-peak induced voltage on the oscilloscope as secondary coil turns vary.',
        ],
        safety_precautions: ['Do not touch uninsulated coil terminals during high-frequency AC operation.'],
      },
      discussion_starters: [
        'Why would induction heating be inefficient without a ferromagnetic core?',
        'How do regenerative braking systems in modern electric vehicles use Lenz’s law?',
      ],
      homework_assignment: {
        title: 'A-Level Past Paper Booklet: Induction',
        description: 'Complete Questions 1 to 6 on magnetic flux linkage and transformer efficiency.',
        estimated_time: '45 mins',
      },
    },
  },
  {
    id: 'lp-2',
    teacher_id: 'teacher-1',
    curriculum_level_id: 'lvl-2',
    title: 'Simple Harmonic Motion & Resonance',
    topic: 'Waves & Oscillations',
    duration_minutes: 45,
    target_audience: 'IGCSE Physics (Grade 10)',
    ai_generated: true,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    content: {
      overview: 'Interactive 45-minute lesson examining mass-spring systems, simple pendulums, and forced resonance graphs.',
      learning_objectives: [
        'Define simple harmonic motion where acceleration is proportional to displacement.',
        'Plot and analyze period against mass/length graphs.',
        'Explain dampening and sharpness of resonance peaks.',
      ],
      key_equations_and_terms: [
        'T = 2π √(m / k)',
        'T = 2π √(l / g)',
        'Natural frequency, Damping, Resonance peak',
      ],
      common_misconceptions: [
        'Believing pendulum period depends on release amplitude at small angles.',
      ],
      timeline: [
        { phase: 'Warm-up', duration_minutes: 8, teacher_activity: 'Set off pendulum wave apparatus.', student_activity: 'Count oscillations and record periods.' },
        { phase: 'Core Concept', duration_minutes: 20, teacher_activity: 'Explain restoration force F = -kx and energy exchange.', student_activity: 'Draw PE vs KE graphs against displacement.' },
        { phase: 'Student Activity', duration_minutes: 12, teacher_activity: 'Guide pendulum timing experiment.', student_activity: 'Time 10 swings for 5 different lengths.' },
        { phase: 'Plenary', duration_minutes: 5, teacher_activity: 'Summary quiz.', student_activity: 'Answer digital poll.' },
      ],
      discussion_starters: ['Why did the Tacoma Narrows Bridge collapse due to wind resonance?'],
      homework_assignment: {
        title: 'Oscillation Calculation Sheet',
        description: 'Solve questions on pendulum period and spring constants.',
        estimated_time: '30 mins',
      },
    },
  },
]

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ lesson_plans: MOCK_LESSON_PLANS })
    }

    const { data, error } = await supabase
      .from('lesson_plans')
      .select('*, curriculum_level:curriculum_levels(name)')
      .order('created_at', { ascending: false })

    if (error || !data || data.length === 0) {
      return NextResponse.json({ lesson_plans: MOCK_LESSON_PLANS })
    }

    return NextResponse.json({ lesson_plans: data })
  } catch (err) {
    return NextResponse.json({ lesson_plans: MOCK_LESSON_PLANS })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { title, topic, duration_minutes, target_audience, content, curriculum_level_id } = body

    if (!title || !topic || !content) {
      return NextResponse.json(
        { error: 'Title, topic, and content are required' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (session?.user) {
      const { data, error } = await supabase
        .from('lesson_plans')
        .insert({
          teacher_id: session.user.id,
          curriculum_level_id: curriculum_level_id || null,
          title,
          topic,
          duration_minutes: duration_minutes || 60,
          target_audience: target_audience || 'Physics Class',
          content,
          ai_generated: true,
        })
        .select()
        .single()

      if (!error && data) {
        return NextResponse.json({ lesson_plan: data })
      }
    }

    // Mock fallback response
    const mockCreated: LessonPlan = {
      id: 'lp-' + Date.now(),
      teacher_id: session?.user?.id || 'demo-teacher',
      curriculum_level_id: curriculum_level_id || null,
      title,
      topic,
      duration_minutes: duration_minutes || 60,
      target_audience: target_audience || 'Physics Class',
      content,
      ai_generated: true,
      created_at: new Date().toISOString(),
    }

    return NextResponse.json({ lesson_plan: mockCreated })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to save lesson plan' },
      { status: 500 }
    )
  }
}
