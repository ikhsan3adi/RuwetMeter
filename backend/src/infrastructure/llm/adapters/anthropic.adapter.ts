import type {
  AnalysisProviderPort,
  AnalysisResult,
} from '../../../application/ports/analysis-provider.port'
import type { ChatProviderPort, ChatResult } from '../../../application/ports/chat-provider.port'
import type { Article } from '../../../domain/entities/article'
import { config } from '../../../config'

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
    const content = articles
      .slice(0, 20)
      .map((a) => `[${a.source}] ${a.title}\n${a.content.slice(0, 2000)}`)
      .join('\n\n---\n\n')

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
        system:
          'You are a social-political analyst for Indonesia. Analyze the following news articles and return a JSON object with:\n' +
          '- economy: integer 0-100\n' +
          '- politics: integer 0-100\n' +
          '- infrastructure: integer 0-100\n' +
          '- social: integer 0-100\n' +
          '- summary: string (2-3 sentences in Indonesian describing the overall situation)\n\n' +
          'Higher score means more concerning/turbulent. Return ONLY valid JSON.',
        messages: [{ role: 'user' as const, content }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Anthropic analysis failed (${res.status}): ${err}`)
    }

    const data = (await res.json()) as AnthropicMessageResponse
    const text = data.content[0].text
    const parsed = JSON.parse(text) as Record<string, unknown>
    return {
      economy: (parsed.economy as number) ?? 0,
      politics: (parsed.politics as number) ?? 0,
      infrastructure: (parsed.infrastructure as number) ?? 0,
      social: (parsed.social as number) ?? 0,
      summary: (parsed.summary as string) ?? '',
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
        system:
          'You are a helpful assistant for RuwetMeter, an Indonesian public sentiment analysis system. ' +
          'Answer questions based on the provided news context. Be concise and factual.',
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
