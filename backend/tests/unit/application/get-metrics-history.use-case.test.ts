import { describe, test, expect, mock } from 'bun:test'
import { GetMetricsHistoryUseCase } from '../../../src/application/use-cases/get-metrics-history.use-case'
import { ScoreDimension } from '../../../src/domain/value-objects/score-dimension'
import type { RuwetLogRepositoryPort } from '../../../src/application/ports/ruwet-log-repository.port'
import type { RuwetScore } from '../../../src/domain/entities/ruwet-score'

describe('GetMetricsHistoryUseCase', () => {
  test('returns history for given days', async () => {
    const logs: RuwetScore[] = [
      {
        id: 'id-1',
        createdAt: new Date('2026-06-27T12:00:00Z'),
        economy: new ScoreDimension(40),
        politics: new ScoreDimension(50),
        infrastructure: new ScoreDimension(60),
        social: new ScoreDimension(70),
        totalScore: 55,
        aiSummary: 'First summary.',
        flagged: false,
        sourceArticleIds: [],
      },
      {
        id: 'id-2',
        createdAt: new Date('2026-06-27T09:00:00Z'),
        economy: new ScoreDimension(45),
        politics: new ScoreDimension(55),
        infrastructure: new ScoreDimension(65),
        social: new ScoreDimension(75),
        totalScore: 60,
        aiSummary: 'Second summary.',
        flagged: true,
        sourceArticleIds: ['art-1'],
      },
    ]

    const repo: RuwetLogRepositoryPort = {
      getHistory: mock((days: number) => {
        expect(days).toBe(7)
        return Promise.resolve(logs)
      }),
      save: mock(() => Promise.reject()),
      getLatest: mock(() => Promise.resolve(null)),
      getAnomalyArticles: mock(() => Promise.resolve([])),
    }

    const useCase = new GetMetricsHistoryUseCase(repo)
    const result = await useCase.execute(7)

    expect(result).toHaveLength(2)
    expect(result[0].total).toBe(55)
    expect(result[1].total).toBe(60)
    expect(result[1].scores.economy).toBe(45)
  })

  test('returns empty array when no data', async () => {
    const repo: RuwetLogRepositoryPort = {
      getHistory: mock(() => Promise.resolve([])),
      save: mock(() => Promise.reject()),
      getLatest: mock(() => Promise.resolve(null)),
      getAnomalyArticles: mock(() => Promise.resolve([])),
    }

    const useCase = new GetMetricsHistoryUseCase(repo)
    const result = await useCase.execute(3)

    expect(result).toEqual([])
  })
})
