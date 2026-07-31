import { NextResponse } from 'next/server'
import type { AILessonPlanRequest, LessonPlanContent } from '@/lib/types'

export async function POST(req: Request) {
  try {
    const body: AILessonPlanRequest = await req.json()
    const { topic, curriculum_level, duration_minutes, include_practical, difficulty, special_instructions } = body

    if (!topic || !curriculum_level) {
      return NextResponse.json(
        { error: 'Topic and Curriculum Level are required' },
        { status: 400 }
      )
    }

    const durationMins = duration_minutes || 60
    const diff = difficulty || 'standard'

    // Generate comprehensive pedagogical lesson plan
    const generatedContent: LessonPlanContent = {
      overview: `A comprehensive ${durationMins}-minute ${diff} lesson on ${topic} tailored for ${curriculum_level} students. Focuses on conceptual clarity, mathematical rigor, and real-world physics applications.`,
      learning_objectives: [
        `Understand the fundamental physics principles and definitions underlying ${topic}.`,
        `Apply core equations to solve quantitative and multi-step physics problems.`,
        `Analyze graphical representations and qualitative scenarios relating to ${topic}.`,
        `Evaluate experimental uncertainties and safety protocols during hands-on observations.`,
      ],
      key_equations_and_terms: [
        `Primary Formula: F = m · a (or equivalent core relation for ${topic})`,
        `Derived Form: ΔE = P · Δt`,
        `Key Vocabulary: Flux linkage, potential gradient, resonance frequency, field intensity.`,
      ],
      common_misconceptions: [
        {
          misconception: `Confusing instantaneous values with average rates of change during field variations.`,
          correction: `Use instantaneous rate of change (derivatives) for varying fields rather than overall averages.`,
        },
        {
          misconception: `Neglecting vector direction and polarity signs during momentum or flux calculations.`,
          correction: `Always assign a reference positive direction before calculating vector sums or induced EMF.`,
        },
        {
          misconception: `Assuming energy is lost rather than transformed into thermal dissipation.`,
          correction: `Energy is strictly conserved and converted to heat or acoustic radiation.`,
        },
      ],
      timeline: [
        {
          time: `${Math.round(durationMins * 0.15)} mins`,
          activity: 'Warm-up & Hook',
          teacher_action: `Demonstrate a 2-minute real-world teaser experiment or pose a thought experiment about ${topic}.`,
          student_action: `Brainstorm initial hypotheses in pairs and write down key variables on whiteboards.`,
        },
        {
          time: `${Math.round(durationMins * 0.35)} mins`,
          activity: 'Direct Instruction & Theoretical Derivation',
          teacher_action: `Derive core mathematical relations for ${topic} on the board, working through 2 exemplar past-paper problems step by step.`,
          student_action: `Take structured Cornell notes and annotate diagrammatic field lines/force vectors.`,
        },
        {
          time: `${Math.round(durationMins * 0.30)} mins`,
          activity: 'Guided Practice & Problem Solving',
          teacher_action: `Distribute leveled problem sheets (${diff} difficulty). Circulate the classroom offering scaffolding.`,
          student_action: `Work individually or in small groups on structured calculation questions. Peer-check answers.`,
        },
        {
          time: `${Math.round(durationMins * 0.20)} mins`,
          activity: 'Plenary Summary & Exit Ticket',
          teacher_action: `Conduct a rapid digital or verbal quiz reviewing key misconceptions identified during guided practice.`,
          student_action: `Complete 2-question exit ticket highlighting one concept mastered and one question remaining.`,
        },
      ],
      practical_experiment: include_practical
        ? {
            title: `Practical Investigation: Measuring Parameters of ${topic}`,
            apparatus: [
              'Digital Multimeter / Oscilloscope',
              'Calibrated Sensor & Power Supply',
              'Connecting Leads & Precision Resistors',
              'Safety Goggles & Circuit Board Clamp',
            ],
            procedure: [
              'Assemble the circuit apparatus as shown in the laboratory schematic.',
              'Calibrate zero-error offset on the measuring meters before taking readings.',
              'Vary the independent variable across 6 distinct intervals and record dependent values in a data table.',
              'Plot a linear graph of Y against X and compute the gradient to determine the physical constant.',
            ],
            safety_precautions: [
              'Ensure power supply voltage does not exceed 12V to prevent component overheating.',
              'Wear protective eyewear when handling tensioned wires or high-power circuits.',
              'Disconnect electrical sources immediately after taking readings.',
            ],
          }
        : undefined,
      discussion_starters: [
        `How would this physical system behave if we altered the boundary conditions by 50%?`,
        `Why do industrial applications prefer alternating parameters over steady-state direct conditions in ${topic}?`,
        `How does this physics topic connect to modern quantum or astronomical research?`,
      ],
      homework_assignment: {
        title: `Consolidation Worksheet: ${topic} (${curriculum_level})`,
        description: `Complete Questions 1-5 from Chapter Assessment. Include full step-by-step mathematical working and free-body/field diagrams.`,
        estimated_time: '45 minutes',
      },
    }

    return NextResponse.json({
      title: `Lesson Plan: ${topic}`,
      topic,
      curriculum_level,
      duration_minutes,
      content: generatedContent,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate lesson plan' },
      { status: 500 }
    )
  }
}
