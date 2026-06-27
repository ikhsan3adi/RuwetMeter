import { describe, test, expect, mock } from 'bun:test'
import { GetCurrentMetricsUseCase } from '../../../src/application/use-cases/get-current-metrics.use-case'
import { ScoreDimension } from '../../../src/domain/value-objects/score-dimension'
import type { RuwetLogRepositoryPort } from '../../../src/application/ports/ruwet-log-repository.port'

describe('GetCurrentMetricsUseCase', () => {
  test('returns latest metrics when data exists', async () => {
    const repo: RuwetLogRepositoryPort = {
      getLatest: mock(() =>
        Promise.resolve({
          id: 'id-1',
          createdAt: new Date('2026-06-27T12:00:00Z'),
          economy: new ScoreDimension(40),
          politics: new ScoreDimension(50),
          infrastructure: new ScoreDimension(60),
          social: new ScoreDimension(70),
          totalScore: 55,
          aiSummary: 'Current situation summary.',
          flagged: false,
          sourceArticleIds: ['art-1', 'art-2'],
        }),
      ),
      save: mock(() => Promise.reject()),
      getHistory: mock(() => Promise.resolve([])),
      getAnomalyArticles: mock(() => Promise.resolve([])),
    }

    const useCase = new GetCurrentMetricsUseCase(repo)
    const result = await useCase.execute()

    expect(result).not.toBeNull()
    expect(result!.scores.economy).toBe(40)
    expect(result!.scores.politics).toBe(50)
    expect(result!.scores.infrastructure).toBe(60)
    expect(result!.scores.social).toBe(70)
    expect(result!.total).toBe(55)
    expect(result!.summary).toBe('Current situation summary.')
    expect(result!.timestamp).toBe('2026-06-27T12:00:00.000Z')
  })

  test('returns null when no data', async () => {
    const repo: RuwetLogRepositoryPort = {
      getLatest: mock(() => Promise.resolve(null)),
      save: mock(() => Promise.reject()),
      getHistory: mock(() => Promise.resolve([])),
      getAnomalyArticles: mock(() => Promise.resolve([])),
    }

    const useCase = new GetCurrentMetricsUseCase(repo)
    const result = await useCase.execute()

    expect(result).toBeNull()
  })
})
