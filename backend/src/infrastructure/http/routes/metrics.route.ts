import { Hono } from 'hono'
import type { GetCurrentMetricsUseCase } from '../../../application/use-cases/get-current-metrics.use-case'
import type { GetMetricsHistoryUseCase } from '../../../application/use-cases/get-metrics-history.use-case'

export function metricsRoutes(
  getCurrentMetrics: GetCurrentMetricsUseCase,
  getMetricsHistory: GetMetricsHistoryUseCase,
): Hono {
  const router = new Hono()

  router.get('/current', async (c) => {
    const result = await getCurrentMetrics.execute()
    if (!result) {
      return c.json(
        { error: { code: 'NOT_FOUND', message: 'No metrics data available yet.' } },
        404,
      )
    }
    return c.json(result)
  })

  router.get('/history', async (c) => {
    const days = Number(c.req.query('days') ?? 7)
    if (days < 1 || days > 365) {
      return c.json(
        { error: { code: 'INVALID_PARAM', message: 'days must be between 1 and 365' } },
        400,
      )
    }
    const result = await getMetricsHistory.execute(days)
    return c.json(result)
  })

  return router
}
