import { eq, inArray, sql } from 'drizzle-orm'
import type { Article } from '../../../domain/entities/article'
import type {
  ArticleRepositoryPort,
  ArticleWithScore,
} from '../../../application/ports/article-repository.port'
import { db } from '../client'
import { newsArticles } from '../schema'

function rowToArticle(row: typeof newsArticles.$inferSelect): Article {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    source: row.source,
    content: row.content,
    contentType: row.contentType,
    publishedAt: row.publishedAt,
    fetchedAt: row.fetchedAt,
    scoreEconomy: row.scoreEconomy,
    scorePolitics: row.scorePolitics,
    scoreInfrastructure: row.scoreInfrastructure,
    scoreSocial: row.scoreSocial,
  }
}

export class ArticleRepository implements ArticleRepositoryPort {
  async updateEmbeddings(
    embeddings: Array<{ articleId: string; embedding: number[] }>,
  ): Promise<void> {
    for (const { articleId, embedding } of embeddings) {
      const vectorStr = `[${embedding.join(',')}]`
      await db.execute(sql`
        UPDATE news_articles
        SET embedding = ${vectorStr}::vector(${sql.raw(String(embedding.length))})
        WHERE id = ${articleId}
      `)
    }
  }

  async updateScores(
    scores: Array<{
      articleId: string
      economy: number
      politics: number
      infrastructure: number
      social: number
    }>,
  ): Promise<void> {
    for (const score of scores) {
      await db.execute(sql`
        UPDATE news_articles
        SET score_economy = ${score.economy},
            score_politics = ${score.politics},
            score_infrastructure = ${score.infrastructure},
            score_social = ${score.social}
        WHERE id = ${score.articleId}
      `)
    }
  }

  async upsertBatch(articles: Omit<Article, 'id'>[]): Promise<Article[]> {
    const urls = articles.map((a) => a.url)

    await db
      .insert(newsArticles)
      .values(
        articles.map((a) => ({
          title: a.title,
          url: a.url,
          source: a.source,
          content: a.content,
          contentType: a.contentType,
          publishedAt: a.publishedAt,
          fetchedAt: a.fetchedAt,
        })),
      )
      .onConflictDoNothing({ target: newsArticles.url })

    const rows = await db.select().from(newsArticles).where(inArray(newsArticles.url, urls))

    return rows.map(rowToArticle)
  }

  async findRecentWithEmbedding(limit: number): Promise<Article[]> {
    const rows = await db
      .select()
      .from(newsArticles)
      .where(sql`embedding IS NOT NULL`)
      .orderBy(sql`published_at DESC`)
      .limit(limit)

    return rows.map(rowToArticle)
  }

  async semanticSearch(
    queryEmbedding: number[],
    limit: number,
    options?: {
      decayHalfLifeDays?: number
      dimensionFilter?: 'economy' | 'politics' | 'infrastructure' | 'social'
    },
  ): Promise<ArticleWithScore[]> {
    const vectorStr = `[${queryEmbedding.join(',')}]`
    const decayHalfLifeDays = options?.decayHalfLifeDays ?? 1
    const dimensionFilter = options?.dimensionFilter
    const defaultHalfLifeSecs = decayHalfLifeDays * 86400
    const embeddingDim = queryEmbedding.length

    let decaySql = sql`${defaultHalfLifeSecs}`
    if (dimensionFilter === 'politics') {
      decaySql = sql`CASE WHEN score_politics > 50 THEN 259200 ELSE ${defaultHalfLifeSecs} END`
    } else if (dimensionFilter === 'economy') {
      decaySql = sql`CASE WHEN score_economy > 50 THEN 172800 ELSE ${defaultHalfLifeSecs} END`
    } else if (dimensionFilter === 'infrastructure') {
      decaySql = sql`CASE WHEN score_infrastructure > 50 THEN 172800 ELSE ${defaultHalfLifeSecs} END`
    } else if (dimensionFilter === 'social') {
      decaySql = sql`CASE WHEN score_social > 50 THEN 172800 ELSE ${defaultHalfLifeSecs} END`
    }

    const filterSql = dimensionFilter ? sql`AND ${sql.raw(`score_${dimensionFilter}`)} > 0` : sql``

    const { rows } = await db.execute(sql`
      SELECT
        id, title, url, source, content, content_type, published_at, fetched_at,
        score_economy, score_politics, score_infrastructure, score_social,
        (1 - (embedding <=> ${vectorStr}::vector(${sql.raw(String(embeddingDim))})))
          * POWER(0.5, EXTRACT(EPOCH FROM (NOW() - published_at)) / ${decaySql})
          AS final_score
      FROM news_articles
      WHERE embedding IS NOT NULL ${filterSql}
      ORDER BY final_score DESC
      LIMIT ${limit}
    `)

    return (rows as Array<Record<string, unknown>>).map((row: any) => ({
      id: row.id as string,
      title: row.title as string,
      url: row.url as string,
      source: row.source as string,
      content: row.content as string,
      contentType: row.content_type as Article['contentType'],
      publishedAt: new Date(row.published_at as string),
      fetchedAt: new Date(row.fetched_at as string),
      scoreEconomy: Number(row.score_economy),
      scorePolitics: Number(row.score_politics),
      scoreInfrastructure: Number(row.score_infrastructure),
      scoreSocial: Number(row.score_social),
      finalScore: Number(row.final_score),
    }))
  }
}
