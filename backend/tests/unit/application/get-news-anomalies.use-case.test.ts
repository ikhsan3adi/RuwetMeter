import { describe, test, expect, mock } from "bun:test";
import { GetNewsAnomaliesUseCase } from "../../../src/application/use-cases/get-news-anomalies.use-case";
import { ScoreDimension } from "../../../src/domain/value-objects/score-dimension";
import type { RuwetLogRepositoryPort } from "../../../src/application/ports/ruwet-log-repository.port";
import type { ArticleRepositoryPort } from "../../../src/application/ports/article-repository.port";

describe("GetNewsAnomaliesUseCase", () => {
  test("returns anomaly articles from latest flagged log", async () => {
    const ruwetLogRepo: RuwetLogRepositoryPort = {
      getLatest: mock(() =>
        Promise.resolve({
          id: "log-1",
          createdAt: new Date(),
          economy: new ScoreDimension(80),
          politics: new ScoreDimension(90),
          infrastructure: new ScoreDimension(85),
          social: new ScoreDimension(95),
          totalScore: 88,
          aiSummary: "High turbulence detected.",
          flagged: true,
          sourceArticleIds: ["art-1", "art-2"],
        }),
      ),
      getAnomalyArticles: mock(() =>
        Promise.resolve(["art-1", "art-2"]),
      ),
      save: mock(() => Promise.reject()),
      getHistory: mock(() => Promise.resolve([])),
    };

    const articleRepo: ArticleRepositoryPort = {
      upsertBatch: mock(() => Promise.resolve([])),
      updateEmbeddings: mock(() => Promise.resolve()),
      findRecentWithEmbedding: mock(() => Promise.resolve([])),
      semanticSearch: mock(() => Promise.resolve([])),
    };

    const useCase = new GetNewsAnomaliesUseCase(ruwetLogRepo, articleRepo);
    const result = await useCase.execute();

    expect(ruwetLogRepo.getLatest).toHaveBeenCalledTimes(1);
    expect(ruwetLogRepo.getAnomalyArticles).toHaveBeenCalledWith("log-1");
    expect(result).toHaveLength(2);
  });

  test("returns empty when latest log is not flagged", async () => {
    const ruwetLogRepo: RuwetLogRepositoryPort = {
      getLatest: mock(() =>
        Promise.resolve({
          id: "log-1",
          createdAt: new Date(),
          economy: new ScoreDimension(30),
          politics: new ScoreDimension(40),
          infrastructure: new ScoreDimension(35),
          social: new ScoreDimension(45),
          totalScore: 38,
          aiSummary: "Normal situation.",
          flagged: false,
          sourceArticleIds: [],
        }),
      ),
      getAnomalyArticles: mock(() => Promise.resolve([])),
      save: mock(() => Promise.reject()),
      getHistory: mock(() => Promise.resolve([])),
    };

    const articleRepo: ArticleRepositoryPort = {
      upsertBatch: mock(() => Promise.resolve([])),
      updateEmbeddings: mock(() => Promise.resolve()),
      findRecentWithEmbedding: mock(() => Promise.resolve([])),
      semanticSearch: mock(() => Promise.resolve([])),
    };

    const useCase = new GetNewsAnomaliesUseCase(ruwetLogRepo, articleRepo);
    const result = await useCase.execute();

    expect(result).toEqual([]);
    expect(ruwetLogRepo.getAnomalyArticles).not.toHaveBeenCalled();
  });

  test("returns empty when no data exists", async () => {
    const ruwetLogRepo: RuwetLogRepositoryPort = {
      getLatest: mock(() => Promise.resolve(null)),
      getAnomalyArticles: mock(() => Promise.resolve([])),
      save: mock(() => Promise.reject()),
      getHistory: mock(() => Promise.resolve([])),
    };

    const articleRepo: ArticleRepositoryPort = {
      upsertBatch: mock(() => Promise.resolve([])),
      updateEmbeddings: mock(() => Promise.resolve()),
      findRecentWithEmbedding: mock(() => Promise.resolve([])),
      semanticSearch: mock(() => Promise.resolve([])),
    };

    const useCase = new GetNewsAnomaliesUseCase(ruwetLogRepo, articleRepo);
    const result = await useCase.execute();

    expect(result).toEqual([]);
  });
});
