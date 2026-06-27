import { db } from '../src/infrastructure/database/client'
import { ArticleRepository } from '../src/infrastructure/database/repositories/article.repository'
import { RuwetLogRepository } from '../src/infrastructure/database/repositories/ruwet-log.repository'
import {
  createAnalysisProvider,
  createEmbeddingProvider,
} from '../src/infrastructure/llm/provider-factory'
import { RssFetcher } from '../src/infrastructure/rss/rss-fetcher'
import { AggregateNewsUseCase } from '../src/application/use-cases/aggregate-news.use-case'

const articleRepo = new ArticleRepository()
const ruwetLogRepo = new RuwetLogRepository()
const analysisProvider = createAnalysisProvider()
const embeddingProvider = createEmbeddingProvider()
// Only use 2 feeds for faster testing
const rssFetcher = new RssFetcher([
  'https://news.detik.com/berita/rss',
  'https://www.cnbcindonesia.com/news/rss',
])

const useCase = new AggregateNewsUseCase(
  rssFetcher,
  articleRepo,
  embeddingProvider,
  analysisProvider,
  ruwetLogRepo,
)

console.log('[Manual] Starting aggregation...')
const start = Date.now()
try {
  await useCase.execute()
  console.log(`[Manual] Aggregation completed in ${Date.now() - start}ms`)
} catch (err) {
  console.error('[Manual] Aggregation failed:', err)
}
process.exit(0)
