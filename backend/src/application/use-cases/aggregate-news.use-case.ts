import type { RssFetcherPort } from "../ports/rss-fetcher.port";
import type { ArticleRepositoryPort } from "../ports/article-repository.port";
import type { EmbeddingProviderPort } from "../ports/embedding-provider.port";
import type { AnalysisProviderPort } from "../ports/analysis-provider.port";
import type { RuwetLogRepositoryPort } from "../ports/ruwet-log-repository.port";
import { ScoreDimension } from "../../domain/value-objects/score-dimension";

export class AggregateNewsUseCase {
  constructor(
    private rssFetcher: RssFetcherPort,
    private articleRepo: ArticleRepositoryPort,
    private embeddingProvider: EmbeddingProviderPort,
    private analysisProvider: AnalysisProviderPort,
    private ruwetLogRepo: RuwetLogRepositoryPort,
  ) {}

  async execute(): Promise<void> {
    const rawArticles = await this.rssFetcher.fetchAll();
    if (rawArticles.length === 0) {
      console.warn("[AggregateNews] No articles fetched from RSS");
      return;
    }

    const articles = await this.articleRepo.upsertBatch(
      rawArticles.map((a) => ({
        title: a.title,
        url: a.url,
        source: a.source,
        content: a.content,
        contentType: "raw" as const,
        publishedAt: a.publishedAt,
        fetchedAt: new Date(),
      })),
    );

    const BATCH_SIZE = 10;
    const BATCH_DELAY_MS = 1000;
    const texts = articles.map((a) => `${a.title}\n${a.content}`);
    const embeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      const batchResults = await this.embeddingProvider.embedBatch(batch);
      embeddings.push(...batchResults);
      if (i + BATCH_SIZE < texts.length) {
        await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
      }
    }

    await this.articleRepo.updateEmbeddings(
      articles.map((a, i) => ({ articleId: a.id, embedding: embeddings[i] })),
    );

    const result = await this.analysisProvider.analyze(articles);

    const lastLog = await this.ruwetLogRepo.getLatest();
    const totalScore = Math.round(
      (result.economy +
        result.politics +
        result.infrastructure +
        result.social) /
        4,
    );
    const flagged = lastLog
      ? Math.abs(totalScore - lastLog.totalScore) > 30
      : false;

    const clamp = (v: number) =>
      Math.max(0, Math.min(100, Math.round(v)));

    await this.ruwetLogRepo.save({
      createdAt: new Date(),
      economy: new ScoreDimension(clamp(result.economy)),
      politics: new ScoreDimension(clamp(result.politics)),
      infrastructure: new ScoreDimension(clamp(result.infrastructure)),
      social: new ScoreDimension(clamp(result.social)),
      totalScore,
      aiSummary: result.summary,
      flagged,
      sourceArticleIds: articles.map((a) => a.id),
    });
  }
}
