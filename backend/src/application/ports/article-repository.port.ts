import type { Article } from '../../domain/entities/article'

export type ArticleWithScore = Article & { finalScore: number }

export interface ArticleRepositoryPort {
  upsertBatch(articles: Omit<Article, 'id'>[]): Promise<Article[]>
  updateEmbeddings(embeddings: Array<{ articleId: string; embedding: number[] }>): Promise<void>
  findRecentWithEmbedding(limit: number): Promise<Article[]>
  semanticSearch(
    queryEmbedding: number[],
    limit: number,
    decayHalfLifeDays?: number,
  ): Promise<ArticleWithScore[]>
}
