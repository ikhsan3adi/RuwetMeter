import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { db } from '../database/client'
import { config } from '../../config'

import { ArticleRepository } from '../database/repositories/article.repository'
import { RuwetLogRepository } from '../database/repositories/ruwet-log.repository'

import {
  createAnalysisProvider,
  createChatProvider,
  createEmbeddingProvider,
} from '../llm/provider-factory'
import { RssFetcher } from '../rss/rss-fetcher'

import { AggregateNewsUseCase } from '../../application/use-cases/aggregate-news.use-case'
import { GetCurrentMetricsUseCase } from '../../application/use-cases/get-current-metrics.use-case'
import { GetMetricsHistoryUseCase } from '../../application/use-cases/get-metrics-history.use-case'
import { GetNewsAnomaliesUseCase } from '../../application/use-cases/get-news-anomalies.use-case'
import { GetChatAnswerUseCase } from '../../application/use-cases/get-chat-answer.use-case'

import { metricsRoutes } from './routes/metrics.route'
import { newsRoutes } from './routes/news.route'
import { chatRoutes } from './routes/chat.route'
import { webhookRoutes } from './routes/webhook.route'
import { TelegramService } from '../telegram/telegram.service'
import { errorHandler } from './middleware/error-handler'

import { startAggregationCron } from '../cron/aggregation-job'

const articleRepo = new ArticleRepository()
const ruwetLogRepo = new RuwetLogRepository()

const analysisProvider = createAnalysisProvider()
const chatProvider = createChatProvider()
const embeddingProvider = createEmbeddingProvider()
const rssFetcher = new RssFetcher()
const telegramService = new TelegramService()

const aggregateNewsUC = new AggregateNewsUseCase(
  rssFetcher,
  articleRepo,
  embeddingProvider,
  analysisProvider,
  ruwetLogRepo,
)
const getCurrentMetricsUC = new GetCurrentMetricsUseCase(ruwetLogRepo)
const getMetricsHistoryUC = new GetMetricsHistoryUseCase(ruwetLogRepo)
const getNewsAnomaliesUC = new GetNewsAnomaliesUseCase(ruwetLogRepo, articleRepo)
const getChatAnswerUC = new GetChatAnswerUseCase(articleRepo, embeddingProvider, chatProvider)

const app = new Hono().basePath('/api/v1')
app.use('*', cors())
app.onError(errorHandler)

app.route('/metrics', metricsRoutes(getCurrentMetricsUC, getMetricsHistoryUC))
app.route('/news', newsRoutes(getNewsAnomaliesUC))
app.route('/chat', chatRoutes(getChatAnswerUC))
app.route('/webhook', webhookRoutes(getChatAnswerUC, telegramService))

startAggregationCron(aggregateNewsUC)

export default {
  port: config.PORT,
  fetch: app.fetch,
}
