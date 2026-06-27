import type { RuwetLogRepositoryPort } from '../ports/ruwet-log-repository.port'
import type { ArticleRepositoryPort } from '../ports/article-repository.port'

export interface AnomalyArticleResult {
  id: string
  title: string
  url: string
  source: string
  publishedAt: string
}

export class GetNewsAnomaliesUseCase {
  constructor(
    private ruwetLogRepo: RuwetLogRepositoryPort,
    private articleRepo: ArticleRepositoryPort,
  ) {}

  async execute(): Promise<AnomalyArticleResult[]> {
    const latest = await this.ruwetLogRepo.getLatest()
    if (!latest || !latest.flagged) return []

    const articleIds = await this.ruwetLogRepo.getAnomalyArticles(latest.id)
    if (articleIds.length === 0) return []

    return articleIds.map((id) => ({
      id,
      title: '',
      url: '',
      source: '',
      publishedAt: '',
    }))
  }
}
