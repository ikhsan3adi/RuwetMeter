import type { Article } from '../../domain/entities/article'

export interface AnalysisResult {
  economy: number
  politics: number
  infrastructure: number
  social: number
  summary: string
  articleScores?: Array<{
    url: string
    economy: number
    politics: number
    infrastructure: number
    social: number
  }>
}

export interface AnalysisProviderPort {
  analyze(articles: Article[]): Promise<AnalysisResult>
}
