import type {
  AnalysisProviderPort,
  AnalysisResult,
} from '../../../application/ports/analysis-provider.port'
import type { ChatProviderPort, ChatResult } from '../../../application/ports/chat-provider.port'
import type { Article } from '../../../domain/entities/article'
import { config } from '../../../config'
import { ANALYSIS_SYSTEM_PROMPT, CHAT_SYSTEM_PROMPT, formatArticlesForAnalysis } from '../prompts'

interface AnthropicMessageResponse {
  content: Array<{ text: string }>
}

export class AnthropicAnalysisAdapter implements AnalysisProviderPort {
  private apiKey: string
  private model: string

  constructor(model?: string) {
    this.apiKey = config.ANTHROPIC_API_KEY
    this.model = model ?? 'claude-3-5-sonnet-20241022'
    if (!this.apiKey) throw new Error('Anthropic API key not configured')
  }

  async analyze(articles: Article[]): Promise<AnalysisResult> {
    const content = formatArticlesForAnalysis(articles)

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1024,
        system: ANALYSIS_SYSTEM_PROMPT + '\nReturn ONLY valid JSON.',
        messages: [{ role: 'user' as const, content }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Anthropic analysis failed (${res.status}): ${err}`)
    }

    const data = (await res.json()) as AnthropicMessageResponse
    const text = data.content[0].text
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

export class AnthropicChatAdapter implements ChatProviderPort {
  private apiKey: string
  private model: string

  constructor(model?: string) {
    this.apiKey = config.ANTHROPIC_API_KEY
    this.model = model ?? 'claude-3-5-haiku-20241022'
    if (!this.apiKey) throw new Error('Anthropic API key not configured')
  }

  async respond(context: string, question: string): Promise<ChatResult> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1024,
        system: CHAT_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user' as const,
            content: `Context:\n${context}\n\nQuestion: ${question}`,
          },
        ],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Anthropic chat failed (${res.status}): ${err}`)
    }

    const data = (await res.json()) as AnthropicMessageResponse
    return {
      reply: data.content[0].text,
      sourceUrls: [],
    }
  }
}
