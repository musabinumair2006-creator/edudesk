import { GoogleGenAI } from '@google/genai'

const apiKey = process.env.GEMINI_API_KEY || ''
const ai = new GoogleGenAI({ apiKey })

/**
 * Generate structured JSON from Gemini 1.5 Flash.
 * Parses JSON response with automatic 1-retry fallback.
 */
export async function generateJSON<T = any>(prompt: string): Promise<T> {
  const model = 'gemini-1.5-flash'

  const callModel = async (inputPrompt: string) => {
    const response = await ai.models.generateContent({
      model,
      contents: [inputPrompt],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    })
    return response.text || ''
  }

  // 30s Timeout wrapper
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('AI request timed out. Please try again.')), 30000)
  })

  let rawText = ''
  try {
    rawText = await Promise.race([callModel(prompt), timeoutPromise])
  } catch (err: any) {
    if (err.message?.includes('timed out')) {
      throw err
    }
    // Retry once with explicit json instruction
    rawText = await Promise.race([
      callModel(`${prompt}\n\nIMPORTANT: Return strictly valid JSON array or JSON object. No markdown preamble.`),
      timeoutPromise,
    ])
  }

  // Clean markdown codeblocks if present
  let cleanedText = rawText.trim()
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.substring(7)
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.substring(3)
  }
  if (cleanedText.endsWith('```')) {
    cleanedText = cleanedText.substring(0, cleanedText.length - 3)
  }
  cleanedText = cleanedText.trim()

  try {
    return JSON.parse(cleanedText) as T
  } catch (parseErr) {
    // Attempt second parse with regex extraction of brackets
    const jsonMatch = cleanedText.match(/\[[\s\S]*\]|\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T
    }
    throw new Error('Failed to parse AI structured response. Please try again.')
  }
}

/**
 * Generate plain text response from Gemini 1.5 Flash.
 */
export async function generateText(prompt: string): Promise<string> {
  const model = 'gemini-1.5-flash'
  const response = await ai.models.generateContent({
    model,
    contents: [prompt],
    config: {
      temperature: 0.4,
    },
  })
  return response.text || ''
}

/**
 * Sends extracted PDF text + prompt to Gemini for document analysis.
 */
export async function analyzeDocument(text: string, prompt: string): Promise<any> {
  const combinedPrompt = `${prompt}\n\nDOCUMENT EXTRACTED TEXT:\n${text.slice(0, 20000)}`
  return await generateJSON(combinedPrompt)
}
