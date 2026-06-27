import { desc, sql, inArray } from "drizzle-orm";
import type { RuwetScore } from "../../../domain/entities/ruwet-score";
import { ScoreDimension } from "../../../domain/value-objects/score-dimension";
import type { RuwetLogRepositoryPort } from "../../../application/ports/ruwet-log-repository.port";
import { db } from "../client";
import { ruwetLogs, ruwetLogArticles } from "../schema";

function rowToRuwetScore(
  row: typeof ruwetLogs.$inferSelect,
  articleIds: string[],
): RuwetScore {
  return {
    id: row.id,
    createdAt: row.createdAt,
    economy: new ScoreDimension(row.scoreEconomy),
    politics: new ScoreDimension(row.scorePolitics),
    infrastructure: new ScoreDimension(row.scoreInfrastructure),
    social: new ScoreDimension(row.scoreSocial),
    totalScore: row.totalScore,
    aiSummary: row.aiSummary,
    flagged: row.flagged,
    sourceArticleIds: articleIds,
  };
}

export class RuwetLogRepository implements RuwetLogRepositoryPort {
  async save(score: Omit<RuwetScore, "id">): Promise<RuwetScore> {
    return db.transaction(async (tx) => {
      const [log] = await tx
        .insert(ruwetLogs)
        .values({
          scoreEconomy: score.economy.value,
          scorePolitics: score.politics.value,
          scoreInfrastructure: score.infrastructure.value,
          scoreSocial: score.social.value,
          totalScore: score.totalScore,
          aiSummary: score.aiSummary,
          flagged: score.flagged,
        })
        .returning();

      if (score.sourceArticleIds.length > 0) {
        await tx.insert(ruwetLogArticles).values(
          score.sourceArticleIds.map((articleId) => ({
            logId: log.id,
            articleId,
          })),
        );
      }

      return rowToRuwetScore(log, score.sourceArticleIds);
    });
  }

  async getLatest(): Promise<RuwetScore | null> {
    const [row] = await db
      .select()
      .from(ruwetLogs)
      .orderBy(desc(ruwetLogs.createdAt))
      .limit(1);

    if (!row) return null;

    const articles = await db
      .select()
      .from(ruwetLogArticles)
      .where(sql`log_id = ${row.id}`);

    return rowToRuwetScore(
      row,
      articles.map((a) => a.articleId),
    );
  }

  async getHistory(days: number): Promise<RuwetScore[]> {
    const cutoff = new Date(Date.now() - days * 86400000);
    const logRows = await db
      .select()
      .from(ruwetLogs)
      .where(sql`created_at >= ${cutoff}`)
      .orderBy(ruwetLogs.createdAt);

    if (logRows.length === 0) return [];

    const logIds = logRows.map((r) => r.id);
    const junctionRows = await db
      .select()
      .from(ruwetLogArticles)
      .where(inArray(ruwetLogArticles.logId, logIds));

    const articleMap = new Map<string, string[]>();
    for (const j of junctionRows) {
      const existing = articleMap.get(j.logId) ?? [];
      existing.push(j.articleId);
      articleMap.set(j.logId, existing);
    }

    return logRows.map((row) =>
      rowToRuwetScore(row, articleMap.get(row.id) ?? []),
    );
  }

  async getAnomalyArticles(logId: string): Promise<string[]> {
    const rows = await db
      .select()
      .from(ruwetLogArticles)
      .where(sql`log_id = ${logId}`);

    return rows.map((r) => r.articleId);
  }
}
