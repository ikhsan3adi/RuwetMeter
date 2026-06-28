import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { ScoreDimension } from '../../../src/domain/value-objects/score-dimension'
import { RuwetLogRepository } from '../../../src/infrastructure/database/repositories/ruwet-log.repository'
import { ArticleRepository } from '../../../src/infrastructure/database/repositories/article.repository'

describe('RuwetLogRepository (integration)', () => {
  let repo: RuwetLogRepository
  let articleRepo: ArticleRepository

  beforeAll(() => {
    repo = new RuwetLogRepository()
    articleRepo = new ArticleRepository()
  })

  test('save creates a log entry with article relations', async () => {
    const [article] = await articleRepo.upsertBatch([
      {
        title: 'Related Article',
        url: 'https://example.com/related',
        source: 'example.com',
        content: 'Article related to log entry.',
        contentType: 'raw',
        publishedAt: new Date(),
        fetchedAt: new Date(),
      },
    ])

    const saved = await repo.save({
      createdAt: new Date(),
      economy: new ScoreDimension(30),
      politics: new ScoreDimension(40),
      infrastructure: new ScoreDimension(35),
      social: new ScoreDimension(45),
      totalScore: 38,
      aiSummary: 'Normal conditions.',
      flagged: false,
      sourceArticleIds: [article.id],
    })

    expect(saved.id).toBeDefined()
    expect(saved.totalScore).toBe(38)
    expect(saved.sourceArticleIds).toContain(article.id)
  })

  test('getLatest returns the most recent log', async () => {
    const latest = await repo.getLatest()
    expect(latest).not.toBeNull()
    expect(latest!.totalScore).toBe(38)
  })

  test('getHistory returns logs within date range', async () => {
    const logs = await repo.getHistory(30)
    expect(logs.length).toBeGreaterThanOrEqual(1)
  })

  test('getAnomalyArticles returns article IDs for a log', async () => {
    const latest = await repo.getLatest()
    if (latest) {
      const articleIds = await repo.getAnomalyArticles(latest.id)
      expect(Array.isArray(articleIds)).toBe(true)
    }
  })
})
