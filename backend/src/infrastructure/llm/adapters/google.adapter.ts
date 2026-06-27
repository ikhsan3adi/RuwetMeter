import type {
  AnalysisProviderPort,
  AnalysisResult,
} from '../../../application/ports/analysis-provider.port'
import type { ChatProviderPort, ChatResult } from '../../../application/ports/chat-provider.port'
import type { EmbeddingProviderPort } from '../../../application/ports/embedding-provider.port'
import type { Article } from '../../../domain/entities/article'
import { config } from '../../../config'
import { ANALYSIS_SYSTEM_PROMPT, CHAT_SYSTEM_PROMPT, formatArticlesForAnalysis } from '../prompts'

interface GoogleContentResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>
    }
  }>
}

interface GoogleEmbeddingResponse {
  embeddings: Array<{ values: number[] }>
}

export class GoogleAnalysisAdapter implements AnalysisProviderPort {
  private apiKey: string
  private model: string

  constructor(model?: string) {
    this.apiKey = config.GOOGLE_API_KEY
    this.model = model ?? 'gemini-2.0-pro'
    if (!this.apiKey) throw new Error('Google API key not configured')
  }

  async analyze(articles: Article[]): Promise<AnalysisResult> {
    const content = formatArticlesForAnalysis(articles)

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: ANALYSIS_SYSTEM_PROMPT + '\n\n' + content,
              },
            ],
          },
        ],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Google analysis failed (${res.status}): ${err}`)
    }

    const data = (await res.json()) as GoogleContentResponse
    const text = data.candidates[0].content.parts[0].text
    const parsed = JSON.parse(text) as any
    return {
      economy: parsed.economy ?? 0,
      politics: parsed.politics ?? 0,
      infrastructure: parsed.infrastructure ?? 0,
      social: parsed.social ?? 0,
      summary: parsed.summary ?? '',
      articleScores: Array.isArray(parsed.articleScores) ? parsed.articleScores : [],
    }
  }
}

export class GoogleChatAdapter implements ChatProviderPort {
  private apiKey: string
  private model: string

  constructor(model?: string) {
    this.apiKey = config.GOOGLE_API_KEY
    this.model = model ?? 'gemini-2.0-flash-lite'
    if (!this.apiKey) throw new Error('Google API key not configured')
  }

  async respond(context: string, question: string): Promise<ChatResult> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: CHAT_SYSTEM_PROMPT + `\n\nContext:\n${context}\n\nQuestion: ${question}`,
              },
            ],
          },
        ],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Google chat failed (${res.status}): ${err}`)
    }

    const data = (await res.json()) as GoogleContentResponse
    return {
      reply: data.candidates[0].content.parts[0].text,
      sourceUrls: [],
    }
  }
}

export class GoogleEmbeddingAdapter implements EmbeddingProviderPort {
  private apiKey: string
  private model: string

  constructor(model?: string) {
    this.apiKey = config.GOOGLE_API_KEY
    this.model = model ?? 'text-embedding-004'
    if (!this.apiKey) throw new Error('Google API key not configured')
  }

  async embed(text: string): Promise<number[]> {
    const [result] = await this.embedBatch([text])
    return result
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:batchEmbedContents?key=${this.apiKey}`

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: texts.map((text) => ({
          model: `models/${this.model}`,
          content: { parts: [{ text }] },
        })),
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Google embedding failed (${res.status}): ${err}`)
    }

    const data = (await res.json()) as GoogleEmbeddingResponse
    return data.embeddings.map((e) => e.values)
  }
}
