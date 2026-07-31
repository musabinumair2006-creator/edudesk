import { GoogleGenAI } from '@google/genai'

const apiKey = process.env.GEMINI_API_KEY || ''
const ai = new GoogleGenAI({ apiKey })

const TIMEOUT_MS = 30000

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`AI Request timed out after ${timeoutMs / 1000} seconds.`))
    }, timeoutMs)

    promise
      .then((res) => {
        clearTimeout(timer)
        resolve(res)
      })
      .catch((err) => {
        clearTimeout(timer)
        reject(err)
      })
  })
}

export async function generateText(prompt: string): Promise<string> {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.')
  }

  try {
    const call = ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    })
    const response = await withTimeout(call, TIMEOUT_MS)
    return response.text || ''
  } catch (err: any) {
    if (err.status === 429 || (err.message && err.message.includes('429'))) {
      throw new Error('Gemini API rate limit exceeded. Please wait a moment and retry.')
    }
    throw new Error(`Gemini AI Error: ${err.message || err}`)
  }
}

export async function generateJSON<T = any>(prompt: string): Promise<T> {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.')
  }

  try {
    const jsonPrompt = `${prompt}\n\nIMPORTANT: Respond ONLY with a valid JSON object. Do not include markdown code block formatting like \`\`\`json.`
    const text = await generateText(jsonPrompt)
    
    // Clean string if code blocks present
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim()
    return JSON.parse(cleaned) as T
  } catch (err: any) {
    if (err instanceof SyntaxError) {
      throw new Error('Failed to parse AI JSON response: ' + err.message)
    }
    throw err
  }
}

export async function analyzeImage(
  imageBase64: string,
  mimeType: string,
  prompt: string
): Promise<string> {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.')
  }

  try {
    const call = ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [
        {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType || 'image/png',
          },
        },
        {
          text: prompt,
        },
      ],
    })

    const response = await withTimeout(call, TIMEOUT_MS)
    return response.text || ''
  } catch (err: any) {
    if (err.status === 429 || (err.message && err.message.includes('429'))) {
      throw new Error('Gemini API rate limit exceeded during image analysis.')
    }
    throw new Error(`Gemini Vision Error: ${err.message || err}`)
  }
}
