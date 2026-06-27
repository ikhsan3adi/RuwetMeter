import type {
  AnalysisProviderPort,
  AnalysisResult,
} from '../../../application/ports/analysis-provider.port'
import type { ChatProviderPort, ChatResult } from '../../../application/ports/chat-provider.port'
import type { Article } from '../../../domain/entities/article'
import { config } from '../../../config'

const BASE_URL = 'https://api.deepseek.com/v1'

export class DeepSeekAnalysisAdapter implements AnalysisProviderPort {
  constructor(_model?: string) {
    if (!config.DEEPSEEK_API_KEY) throw new Error('DeepSeek API key not configured')
  }

  async analyze(_articles: Article[]): Promise<AnalysisResult> {
    throw new Error('DeepSeek analysis adapter not yet implemented')
  }
}

export class DeepSeekChatAdapter implements ChatProviderPort {
  constructor(_model?: string) {
    if (!config.DEEPSEEK_API_KEY) throw new Error('DeepSeek API key not configured')
  }

  async respond(_context: string, _question: string): Promise<ChatResult> {
    throw new Error('DeepSeek chat adapter not yet implemented')
  }
}
