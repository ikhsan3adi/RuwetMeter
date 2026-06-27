import type { Article } from "../../domain/entities/article";

export interface AnalysisResult {
  economy: number;
  politics: number;
  infrastructure: number;
  social: number;
  summary: string;
}

export interface AnalysisProviderPort {
  analyze(articles: Article[]): Promise<AnalysisResult>;
}
