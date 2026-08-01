import { NextRequest, NextResponse } from 'next/server'
import { generateJSON } from '@/lib/gemini'
import { getPaperBuilderPrompt, getSimilarQuestionPrompt } from '@/lib/prompts'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      curriculum_level,
      topics,
      num_questions,
      total_marks,
      difficulty,
      question_types,
      mode,
      questionText,
      marks,
      topic,
      count,
    } = body

    let generatedQuestions: any[] = []

    if (mode === 'similar') {
      const prompt = getSimilarQuestionPrompt({
        questionText: questionText || 'Calculate magnetic flux density',
        marks: marks || 4,
        topic: topic || 'Electromagnetic Induction',
        curriculumLevel: curriculum_level || 'A-Level Physics',
        count: count || 2,
      })
      generatedQuestions = await generateJSON(prompt)
    } else {
      const prompt = getPaperBuilderPrompt({
        curriculumLevel: curriculum_level || 'A-Level Physics',
        numQuestions: num_questions || 3,
        topics: topics && topics.length > 0 ? topics : ['Kinematics', 'Electricity'],
        questionTypes: question_types && question_types.length > 0 ? question_types : ['structured', 'calculation'],
        totalMarks: total_marks || 25,
        difficulty: difficulty || 'standard',
      })
      generatedQuestions = await generateJSON(prompt)
    }

    if (!Array.isArray(generatedQuestions)) {
      generatedQuestions = [generatedQuestions]
    }

    // Format output questions nicely
    const formatted = generatedQuestions.map((q: any) => ({
      question_text: q.question_text || 'Sample AI Generated Physics Question',
      question_type: q.question_type || 'structured',
      marks: typeof q.marks === 'number' ? q.marks : 4,
      topic: q.topic || topics?.[0] || 'Physics',
      answer: q.answer || 'Worked solution provided by AI examiner',
      is_ai_generated: true,
    }))

    return NextResponse.json({ questions: formatted })
  } catch (err: any) {
    console.error('generate-questions error:', err)
    // Fallback response if Gemini API key is missing or timed out
    const fallbackQuestions = [
      {
        question_text: 'Explain how Faraday law of electromagnetic induction applies to an electric generator. (3 marks)',
        question_type: 'structured',
        marks: 3,
        topic: 'Electromagnetic Induction',
        answer: 'The rotating coil cuts magnetic flux lines, inducing an e.m.f. proportional to the rate of change of flux linkage.',
        is_ai_generated: true,
      },
      {
        question_text: 'A transformer has 500 primary turns and 50 secondary turns. Calculate secondary voltage if primary is 230 V. (2 marks)',
        question_type: 'calculation',
        marks: 2,
        topic: 'Electricity',
        answer: 'Vs = Vp × (Ns / Np) = 230 × (50 / 500) = 23 V.',
        is_ai_generated: true,
      },
    ]

    return NextResponse.json({ questions: fallbackQuestions })
  }
}
