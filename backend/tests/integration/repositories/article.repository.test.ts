import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { ArticleRepository } from '../../../src/infrastructure/database/repositories/article.repository'
import pg from 'pg'

describe('ArticleRepository (integration)', () => {
  let repo: ArticleRepository

  beforeAll(() => {
    repo = new ArticleRepository()
  })

  test('upsertBatch inserts new articles', async () => {
    const articles = await repo.upsertBatch([
      {
        title: 'Test Article 1',
        url: 'https://example.com/article-1',
        source: 'example.com',
        content: 'Content of article 1.',
        contentType: 'raw',
        publishedAt: new Date('2026-06-27'),
        fetchedAt: new Date(),
      },
    ])

    expect(articles).toHaveLength(1)
    expect(articles[0].title).toBe('Test Article 1')
    expect(articles[0].url).toBe('https://example.com/article-1')
  })

  test('upsertBatch deduplicates by url', async () => {
    const first = await repo.upsertBatch([
      {
        title: 'Original Title',
        url: 'https://example.com/dup-test',
        source: 'example.com',
        content: 'Original content.',
        contentType: 'raw',
        publishedAt: new Date('2026-06-27'),
        fetchedAt: new Date(),
      },
    ])

    const second = await repo.upsertBatch([
      {
        title: 'Duplicated Title',
        url: 'https://example.com/dup-test',
        source: 'example.com',
        content: 'Original content.',
        contentType: 'raw',
        publishedAt: new Date('2026-06-27'),
        fetchedAt: new Date(),
      },
    ])

    expect(second).toHaveLength(1)
    expect(second[0].title).toBe('Original Title')
  })

  test('updateEmbeddings stores embeddings', async () => {
    const [article] = await repo.upsertBatch([
      {
        title: 'Embedding Test',
        url: 'https://example.com/embed-test',
        source: 'example.com',
        content: 'Testing embeddings.',
        contentType: 'raw',
        publishedAt: new Date('2026-06-27'),
        fetchedAt: new Date(),
      },
    ])

    const embedding = new Array(1536).fill(0).map(() => Math.random() * 2 - 1)
    await repo.updateEmbeddings([{ articleId: article.id, embedding }])

    const recent = await repo.findRecentWithEmbedding(10)
    const found = recent.find((a) => a.id === article.id)
    expect(found).toBeDefined()
  })
})
