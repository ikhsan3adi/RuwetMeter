import type { RuwetLogRepositoryPort } from '../ports/ruwet-log-repository.port'

export interface CurrentMetricsResult {
  timestamp: string
  scores: {
    economy: number
    politics: number
    infrastructure: number
    social: number
  }
  total: number
  summary: string
}

export class GetCurrentMetricsUseCase {
  constructor(private ruwetLogRepo: RuwetLogRepositoryPort) {}

  async execute(): Promise<CurrentMetricsResult | null> {
    const latest = await this.ruwetLogRepo.getLatest()
    if (!latest) return null

    return {
      timestamp: latest.createdAt.toISOString(),
      scores: {
        economy: latest.economy.value,
        politics: latest.politics.value,
        infrastructure: latest.infrastructure.value,
        social: latest.social.value,
      },
      total: latest.totalScore,
      summary: latest.aiSummary,
    }
  }
}
