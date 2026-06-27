import type { AggregateNewsUseCase } from "../../application/use-cases/aggregate-news.use-case";
import { pool } from "../database/client";

const LOCK_ID = 123456;
const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

export function startAggregationCron(useCase: AggregateNewsUseCase): void {
  const run = async () => {
    const client = await pool.connect();
    try {
      const lockResult = await client.query(
        "SELECT pg_try_advisory_lock($1) AS acquired",
        [LOCK_ID],
      );
      if (!lockResult.rows[0].acquired) {
        console.warn("[Cron] Previous run still active, skipping.");
        return;
      }

      await useCase.execute();
    } catch (error) {
      console.error("[Cron] Aggregation failed:", error);
    } finally {
      await client.query("SELECT pg_advisory_unlock($1)", [LOCK_ID]);
      client.release();
    }
  };

  run();
  setInterval(run, THREE_HOURS_MS);
}
