import { GoogleGenAI } from '@google/genai'
import Anthropic from '@anthropic-ai/sdk'

export async function generateContentWithGeminiOrClaude(params: {
  systemPrompt: string
  userMessage: string
  modelPreference?: 'flash' | 'pro'
}): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY

  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey })
      const modelName = params.modelPreference === 'pro' ? 'gemini-2.5-pro' : 'gemini-2.5-flash'
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [{ text: `${params.systemPrompt}\n\nUSER REQUEST:\n${params.userMessage}` }],
          },
        ],
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      })

      if (response.text) {
        return response.text
      }
    } catch (geminiError) {
      console.warn('Gemini API call failed, attempting fallback if available:', geminiError)
    }
  }

  // Fallback to Anthropic Claude if ANTHROPIC_API_KEY is available
  if (anthropicKey) {
    const anthropic = new Anthropic({ apiKey: anthropicKey })
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4000,
      messages: [{ role: 'user', content: params.userMessage }],
      system: params.systemPrompt,
    })

    return message.content[0].type === 'text' ? message.content[0].text : ''
  }

  throw new Error('Neither GEMINI_API_KEY nor ANTHROPIC_API_KEY is configured in your environment.')
}
