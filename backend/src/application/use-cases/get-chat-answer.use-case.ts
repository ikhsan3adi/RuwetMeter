import type { ArticleRepositoryPort } from '../ports/article-repository.port'
import type { EmbeddingProviderPort } from '../ports/embedding-provider.port'
import type { ChatProviderPort } from '../ports/chat-provider.port'

export interface ChatAnswer {
  reply: string
  sources: string[]
}

export class GetChatAnswerUseCase {
  constructor(
    private articleRepo: ArticleRepositoryPort,
    private embeddingProvider: EmbeddingProviderPort,
    private chatProvider: ChatProviderPort,
  ) {}

  async execute(
    question: string,
    dimensionFilter?: 'economy' | 'politics' | 'infrastructure' | 'social',
  ): Promise<ChatAnswer> {
    const queryEmbedding = await this.embeddingProvider.embed(question)

    const relevantArticles = await this.articleRepo.semanticSearch(queryEmbedding, 5, {
      dimensionFilter,
    })

    const context = relevantArticles
      .map((a) => `[${a.title}] (${a.url})\n${a.content}`)
      .join('\n---\n')

    const response = await this.chatProvider.respond(context, question)

    return {
      reply: response.reply,
      sources: relevantArticles.map((a) => a.url),
    }
  }
}
