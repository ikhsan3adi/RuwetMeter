import { Hono } from "hono";
import type { GetNewsAnomaliesUseCase } from "../../../application/use-cases/get-news-anomalies.use-case";

export function newsRoutes(
  getNewsAnomalies: GetNewsAnomaliesUseCase,
): Hono {
  const router = new Hono();

  router.get("/anomalies", async (c) => {
    const result = await getNewsAnomalies.execute();
    return c.json(result);
  });

  return router;
}
