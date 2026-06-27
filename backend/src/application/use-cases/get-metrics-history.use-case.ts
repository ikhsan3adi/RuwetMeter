import type { RuwetLogRepositoryPort } from '../ports/ruwet-log-repository.port'
import type { CurrentMetricsResult } from './get-current-metrics.use-case'

export class GetMetricsHistoryUseCase {
  constructor(private ruwetLogRepo: RuwetLogRepositoryPort) {}

  async execute(days: number = 7): Promise<CurrentMetricsResult[]> {
    const logs = await this.ruwetLogRepo.getHistory(days)
    return logs.map((log) => ({
      timestamp: log.createdAt.toISOString(),
      scores: {
        economy: log.economy.value,
        politics: log.politics.value,
        infrastructure: log.infrastructure.value,
        social: log.social.value,
      },
      total: log.totalScore,
      summary: log.aiSummary,
    }))
  }
}
