import type {
  AnalysisProviderPort,
  AnalysisResult,
} from '../../../application/ports/analysis-provider.port'
import type { ChatProviderPort, ChatResult } from '../../../application/ports/chat-provider.port'
import type { EmbeddingProviderPort } from '../../../application/ports/embedding-provider.port'
import type { Article } from '../../../domain/entities/article'
import { OpenAIAnalysisAdapter, OpenAIChatAdapter, OpenAIEmbeddingAdapter } from './openai.adapter'
import { config } from '../../../config'

const BASE_URL = 'https://openrouter.ai/api/v1'

export class OpenRouterAnalysisAdapter implements AnalysisProviderPort {
  private inner: OpenAIAnalysisAdapter

  constructor(model?: string) {
    this.inner = new OpenAIAnalysisAdapter(
      BASE_URL,
      config.OPENROUTER_API_KEY,
      model ?? 'openai/gpt-4o',
    )
  }

  analyze(articles: Article[]): Promise<AnalysisResult> {
    return this.inner.analyze(articles)
  }
}

export class OpenRouterChatAdapter implements ChatProviderPort {
  private inner: OpenAIChatAdapter

  constructor(model?: string) {
    this.inner = new OpenAIChatAdapter(
      BASE_URL,
      config.OPENROUTER_API_KEY,
      model ?? 'openai/gpt-4o-mini',
    )
  }

  respond(context: string, question: string): Promise<ChatResult> {
    return this.inner.respond(context, question)
  }
}

export class OpenRouterEmbeddingAdapter implements EmbeddingProviderPort {
  private inner: OpenAIEmbeddingAdapter

  constructor(model?: string) {
    this.inner = new OpenAIEmbeddingAdapter(
      BASE_URL,
      config.OPENROUTER_API_KEY,
      model ?? 'openai/text-embedding-3-small',
    )
  }

  embed(text: string): Promise<number[]> {
    return this.inner.embed(text)
  }

  embedBatch(texts: string[]): Promise<number[][]> {
    return this.inner.embedBatch(texts)
  }
}
