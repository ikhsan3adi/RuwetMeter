import { describe, test, expect, mock } from 'bun:test'
import { AggregateNewsUseCase } from '../../../src/application/use-cases/aggregate-news.use-case'
import { ScoreDimension } from '../../../src/domain/value-objects/score-dimension'
import type { Article } from '../../../src/domain/entities/article'
import type { RssFetcherPort } from '../../../src/application/ports/rss-fetcher.port'
import type { ArticleRepositoryPort } from '../../../src/application/ports/article-repository.port'
import type { EmbeddingProviderPort } from '../../../src/application/ports/embedding-provider.port'
import type { AnalysisProviderPort } from '../../../src/application/ports/analysis-provider.port'
import type { RuwetLogRepositoryPort } from '../../../src/application/ports/ruwet-log-repository.port'
import type { RuwetScore } from '../../../src/domain/entities/ruwet-score'

describe('AggregateNewsUseCase', () => {
  test('executes full flow from RSS to log save', async () => {
    const mockArticle: Article = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Test Article',
      url: 'https://example.com/news/1',
      source: 'example.com',
      content: 'This is test content.',
      contentType: 'raw',
      publishedAt: new Date(),
      fetchedAt: new Date(),
    }

    const rssFetcher: RssFetcherPort = {
      fetchAll: mock(() =>
        Promise.resolve([
          {
            title: 'Test Article',
            url: 'https://example.com/news/1',
            source: 'example.com',
            content: 'This is test content.',
            publishedAt: new Date(),
          },
        ]),
      ),
    }

    const articleRepo: ArticleRepositoryPort = {
      upsertBatch: mock(() => Promise.resolve([mockArticle])),
      updateEmbeddings: mock(() => Promise.resolve()),
      findRecentWithEmbedding: mock(() => Promise.resolve([])),
      semanticSearch: mock(() => Promise.resolve([])),
      updateScores: mock(() => Promise.resolve()),
    }

    const embeddingProvider: EmbeddingProviderPort = {
      embed: mock(() => Promise.resolve([0.1, 0.2, 0.3])),
      embedBatch: mock(() => Promise.resolve([[0.1, 0.2, 0.3]])),
    }

    const analysisProvider: AnalysisProviderPort = {
      analyze: mock(() =>
        Promise.resolve({
          economy: 45,
          politics: 60,
          infrastructure: 30,
          social: 55,
          summary: 'Test summary.',
        }),
      ),
    }

    const ruwetLogRepo: RuwetLogRepositoryPort = {
      save: mock(() =>
        Promise.resolve({
          id: '660e8400-e29b-41d4-a716-446655440001',
          createdAt: new Date(),
          economy: new ScoreDimension(45),
          politics: new ScoreDimension(60),
          infrastructure: new ScoreDimension(30),
          social: new ScoreDimension(55),
          totalScore: 48,
          aiSummary: 'Test summary.',
          flagged: false,
          sourceArticleIds: [mockArticle.id],
        } as RuwetScore),
      ),
      getLatest: mock(() => Promise.resolve(null)),
      getHistory: mock(() => Promise.resolve([])),
      getAnomalyArticles: mock(() => Promise.resolve([])),
    }

    const useCase = new AggregateNewsUseCase(
      rssFetcher,
      articleRepo,
      embeddingProvider,
      analysisProvider,
      ruwetLogRepo,
    )

    await useCase.execute()

    expect(rssFetcher.fetchAll).toHaveBeenCalledTimes(1)
    expect(articleRepo.upsertBatch).toHaveBeenCalledTimes(1)
    expect(embeddingProvider.embedBatch).toHaveBeenCalledTimes(1)
    expect(articleRepo.updateEmbeddings).toHaveBeenCalledTimes(1)
    expect(analysisProvider.analyze).toHaveBeenCalledTimes(1)
    expect(ruwetLogRepo.save).toHaveBeenCalledTimes(1)
  })

  test('skips when no articles fetched', async () => {
    const rssFetcher: RssFetcherPort = {
      fetchAll: mock(() => Promise.resolve([])),
    }

    const articleRepo: ArticleRepositoryPort = {
      upsertBatch: mock(() => Promise.resolve([])),
      updateEmbeddings: mock(() => Promise.resolve()),
      findRecentWithEmbedding: mock(() => Promise.resolve([])),
      semanticSearch: mock(() => Promise.resolve([])),
      updateScores: mock(() => Promise.resolve()),
    }

    const embeddingProvider: EmbeddingProviderPort = {
      embed: mock(() => Promise.resolve([])),
      embedBatch: mock(() => Promise.resolve([])),
    }

    const analysisProvider: AnalysisProviderPort = {
      analyze: mock(() => Promise.reject(new Error('should not be called'))),
    }

    const ruwetLogRepo: RuwetLogRepositoryPort = {
      save: mock(() => Promise.reject(new Error('should not be called'))),
      getLatest: mock(() => Promise.resolve(null)),
      getHistory: mock(() => Promise.resolve([])),
      getAnomalyArticles: mock(() => Promise.resolve([])),
    }

    const useCase = new AggregateNewsUseCase(
      rssFetcher,
      articleRepo,
      embeddingProvider,
      analysisProvider,
      ruwetLogRepo,
    )

    await useCase.execute()

    expect(rssFetcher.fetchAll).toHaveBeenCalledTimes(1)
    expect(articleRepo.upsertBatch).not.toHaveBeenCalled()
  })
})
