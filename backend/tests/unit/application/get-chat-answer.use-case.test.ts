import { describe, test, expect, mock } from 'bun:test'
import { GetChatAnswerUseCase } from '../../../src/application/use-cases/get-chat-answer.use-case'
import type {
  ArticleRepositoryPort,
  ArticleWithScore,
} from '../../../src/application/ports/article-repository.port'
import type { EmbeddingProviderPort } from '../../../src/application/ports/embedding-provider.port'
import type { ChatProviderPort } from '../../../src/application/ports/chat-provider.port'

describe('GetChatAnswerUseCase', () => {
  test('performs RAG flow and returns answer with sources', async () => {
    const articleRepo: ArticleRepositoryPort = {
      semanticSearch: mock(() =>
        Promise.resolve([
          {
            id: 'art-1',
            title: 'News Article 1',
            url: 'https://example.com/1',
            source: 'example.com',
            content: 'Content of article 1.',
            contentType: 'cleaned' as const,
            publishedAt: new Date(),
            fetchedAt: new Date(),
            finalScore: 0.95,
          } as ArticleWithScore,
          {
            id: 'art-2',
            title: 'News Article 2',
            url: 'https://example.com/2',
            source: 'example.com',
            content: 'Content of article 2.',
            contentType: 'cleaned' as const,
            publishedAt: new Date(),
            fetchedAt: new Date(),
            finalScore: 0.85,
          } as ArticleWithScore,
        ]),
      ),
      upsertBatch: mock(() => Promise.resolve([])),
      updateEmbeddings: mock(() => Promise.resolve()),
      findRecentWithEmbedding: mock(() => Promise.resolve([])),
    }

    const embeddingProvider: EmbeddingProviderPort = {
      embed: mock((text: string) => {
        expect(text).toBe('What is happening?')
        return Promise.resolve([0.5, 0.3, 0.1])
      }),
      embedBatch: mock(() => Promise.resolve([])),
    }

    const chatProvider: ChatProviderPort = {
      respond: mock((context: string, question: string) => {
        expect(question).toBe('What is happening?')
        expect(context).toContain('News Article 1')
        expect(context).toContain('News Article 2')
        return Promise.resolve({
          reply: 'Based on recent news, there are developments.',
          sourceUrls: ['https://example.com/1', 'https://example.com/2'],
        })
      }),
    }

    const useCase = new GetChatAnswerUseCase(articleRepo, embeddingProvider, chatProvider)
    const result = await useCase.execute('What is happening?')

    expect(embeddingProvider.embed).toHaveBeenCalledTimes(1)
    expect(articleRepo.semanticSearch).toHaveBeenCalledTimes(1)
    expect(chatProvider.respond).toHaveBeenCalledTimes(1)
    expect(result.reply).toBe('Based on recent news, there are developments.')
    expect(result.sources).toEqual(['https://example.com/1', 'https://example.com/2'])
  })
})
