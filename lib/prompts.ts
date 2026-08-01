// PhysicsDesk AI Prompts

export const QUESTION_EXTRACTOR_PROMPT = `You are an expert Physics examiner. You have received the full text extracted from a Physics past paper or topical question compilation.

Your task is to identify and extract every individual question from this text.

For each question extract:
- question_number: the original number/label as it appears (e.g. "1", "3(b)", "Q4(ii)")
- question_text: the complete question text exactly as written
- question_type: mcq (multiple choice) | short (1-3 marks short answer) | structured (multi-part) | calculation (requires calculation) | essay (extended response)
- marks: the number of marks allocated (look for "[2]" or "(3 marks)" style notation)
- topic: which Physics topic this question covers — use standard syllabus topic names
- subtopic: more specific subtopic if identifiable
- difficulty: foundation | standard | challenging — judge based on marks, complexity, and question style
- has_diagram: true if the question references a diagram, figure, or graph (even if the image itself is not in the extracted text)
- answer: the mark scheme answer if this document includes one, otherwise null
- year: the exam year if identifiable from the document, otherwise null

Return ONLY a JSON array:
[
  {
    "question_number": "",
    "question_text": "",
    "question_type": "mcq | short | structured | calculation | essay",
    "marks": 0,
    "topic": "",
    "subtopic": "",
    "difficulty": "foundation | standard | challenging",
    "has_diagram": false,
    "answer": null,
    "year": null
  }
]

If a question references a diagram that cannot be extracted as text, include the question but add "[Diagram required — see original paper]" at the end of question_text.
Extract every question you can find. Do not skip questions even if incomplete.`

export function getPaperBuilderPrompt(params: {
  curriculumLevel: string
  numQuestions: number
  topics: string[]
  questionTypes: string[]
  totalMarks: number
  difficulty: string
  styleReference?: string
}): string {
  return `You are an expert Physics examiner for ${params.curriculumLevel} level.

Generate ${params.numQuestions} new Physics questions on the following topics: ${params.topics.join(', ')}

Requirements:
- Questions must match the style, difficulty, and mark allocation typical of ${params.curriculumLevel} ${params.styleReference ? `(Reference style: ${params.styleReference})` : ''} past papers
- Question types requested: ${params.questionTypes.join(', ')}
- Total marks across all generated questions must equal approximately ${params.totalMarks} marks
- Target difficulty level: ${params.difficulty}
- For any calculation question include all necessary physical constants and data values (e.g., g = 9.81 m/s²)
- Do not reference external diagrams — questions must be self-contained in text

Return as JSON array using exactly this structure:
[
  {
    "question_text": "",
    "question_type": "mcq | short | structured | calculation",
    "marks": 0,
    "topic": "",
    "answer": "Detailed worked solution and mark allocation guidance",
    "is_ai_generated": true
  }
]`
}

export function getSimilarQuestionPrompt(params: {
  questionText: string
  marks: number
  topic: string
  curriculumLevel: string
  count?: number
}): string {
  const count = params.count || 2
  return `You are an expert Physics examiner. Here is a real past paper question:

ORIGINAL QUESTION:
${params.questionText}
Marks: ${params.marks}
Topic: ${params.topic}
Level: ${params.curriculumLevel}

Generate ${count} new questions that:
- Test the same Physics concept and topic (${params.topic})
- Use a similar question style and mark allocation (${params.marks} marks)
- Are different enough that a student who memorised the original would still need to understand the underlying Physics
- Match the difficulty and language style of ${params.curriculumLevel} past papers

Return as JSON array:
[
  {
    "question_text": "",
    "question_type": "structured | calculation | short",
    "marks": ${params.marks},
    "topic": "${params.topic}",
    "answer": "Complete mark scheme worked solution",
    "is_ai_generated": true
  }
]`
}
