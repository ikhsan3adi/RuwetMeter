import { describe, test, expect } from "bun:test";
import { Hono } from "hono";
import type { GetCurrentMetricsUseCase } from "../../../src/application/use-cases/get-current-metrics.use-case";
import type { GetMetricsHistoryUseCase } from "../../../src/application/use-cases/get-metrics-history.use-case";
import { metricsRoutes } from "../../../src/infrastructure/http/routes/metrics.route";

describe("GET /api/v1/metrics", () => {
  function createApp(
    current: GetCurrentMetricsUseCase,
    history: GetMetricsHistoryUseCase,
  ) {
    const app = new Hono().basePath("/api/v1");
    app.route("/metrics", metricsRoutes(current, history));
    return app;
  }

  test("/current returns 404 when no data", async () => {
    const currentUC = { execute: () => Promise.resolve(null) } as unknown as GetCurrentMetricsUseCase;
    const historyUC = { execute: () => Promise.resolve([]) } as unknown as GetMetricsHistoryUseCase;
    const app = createApp(currentUC, historyUC);

    const res = await app.request("http://localhost/api/v1/metrics/current");
    expect(res.status).toBe(404);
  });

  test("/current returns 200 with metrics", async () => {
    const metrics = {
      timestamp: "2026-06-27T12:00:00.000Z",
      scores: { economy: 40, politics: 50, infrastructure: 60, social: 70 },
      total: 55,
      summary: "Test summary.",
    };
    const currentUC = { execute: () => Promise.resolve(metrics) } as unknown as GetCurrentMetricsUseCase;
    const historyUC = { execute: () => Promise.resolve([]) } as unknown as GetMetricsHistoryUseCase;
    const app = createApp(currentUC, historyUC);

    const res = await app.request("http://localhost/api/v1/metrics/current");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.timestamp).toBeDefined();
    expect(body.scores.economy).toBe(40);
    expect(body.total).toBe(55);
  });

  test("/history returns 200 with array", async () => {
    const currentUC = { execute: () => Promise.resolve(null) } as unknown as GetCurrentMetricsUseCase;
    const historyUC = { execute: () => Promise.resolve([]) } as unknown as GetMetricsHistoryUseCase;
    const app = createApp(currentUC, historyUC);

    const res = await app.request("http://localhost/api/v1/metrics/history?days=7");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  test("/history rejects invalid days", async () => {
    const currentUC = { execute: () => Promise.resolve(null) } as unknown as GetCurrentMetricsUseCase;
    const historyUC = { execute: () => Promise.resolve([]) } as unknown as GetMetricsHistoryUseCase;
    const app = createApp(currentUC, historyUC);

    const res = await app.request("http://localhost/api/v1/metrics/history?days=999");
    expect(res.status).toBe(400);
  });
});
