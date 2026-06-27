import type { RuwetScore } from '../../domain/entities/ruwet-score'

export interface RuwetLogRepositoryPort {
  save(score: Omit<RuwetScore, 'id'>): Promise<RuwetScore>
  getLatest(): Promise<RuwetScore | null>
  getHistory(days: number): Promise<RuwetScore[]>
  getAnomalyArticles(logId: string): Promise<string[]>
}
