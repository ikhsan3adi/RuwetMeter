# TECHNICAL SPECIFICATION DOCUMENT (TSD)

**Project Name:** RuwetMeter -- National Sentiment & Anomaly Analysis System
**Reference Documents:** [FSD v2.1](fsd.md) | [OpenAPI Spec](../openapi.yml)
**Document Version:** 1.0

---

## 1. Project Structure

The project adopts a simple monorepo architecture with two workspaces: `backend` (Bun + Hono) and `frontend` (SvelteKit). The backend folder implements *Clean Architecture* with directory separation based on layers.

```
RuwetMeter/
├── openapi.yml
├── .req/
│   ├── fsd.md
│   └── tsd.md                  # this document
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── drizzle.config.ts
│   ├── .env.example
│   │
│   ├── src/
│   │   ├── index.ts             # Entry point: bootstrap Hono app + Bun.serve
│   │   ├── config.ts            # Environment variables validation & parsing
│   │   │
│   │   ├── domain/              # Layer 1: Domain (zero dependencies)
│   │   │   ├── entities/
│   │   │   │   ├── article.ts       # Entity: Article
│   │   │   │   └── ruwet-score.ts   # Entity: RuwetScore
│   │   │   └── value-objects/
│   │   │       └── score-dimension.ts  # VO: ScoreDimension (0-100 validated)
│   │   │
│   │   ├── application/         # Layer 2: Use Cases & Ports
│   │   │   ├── ports/
│   │   │   │   ├── article-repository.port.ts
│   │   │   │   ├── ruwet-log-repository.port.ts
│   │   │   │   ├── analysis-provider.port.ts
│   │   │   │   ├── chat-provider.port.ts
│   │   │   │   ├── embedding-provider.port.ts
│   │   │   │   └── rss-fetcher.port.ts
│   │   │   ├── use-cases/
│   │   │   │   ├── aggregate-news.use-case.ts
│   │   │   │   ├── get-current-metrics.use-case.ts
│   │   │   │   ├── get-metrics-history.use-case.ts
│   │   │   │   ├── get-news-anomalies.use-case.ts
│   │   │   │   └── get-chat-answer.use-case.ts
│   │   │   └── dto/
│   │   │       ├── ruwet-score.dto.ts
│   │   │       └── chat.dto.ts
│   │   │
│   │   └── infrastructure/      # Layer 3: Adapters & Implementations
│   │       ├── http/
│   │       │   ├── app.ts           # Hono app instance, middleware, route mounting
│   │       │   ├── routes/
│   │       │   │   ├── metrics.route.ts
│   │       │   │   ├── news.route.ts
│   │       │   │   ├── chat.route.ts
│   │       │   │   └── webhook.route.ts
│   │       │   └── middleware/
│   │       │       ├── rate-limiter.ts
│   │       │       ├── error-handler.ts
│   │       │       └── telegram-auth.ts
│   │       ├── database/
│   │       │   ├── schema.ts        # Drizzle schema definitions
│   │       │   ├── client.ts        # Drizzle + pg pool initialization
│   │       │   ├── migrations/      # Drizzle generated migrations
│   │       │   └── repositories/
│   │       │       ├── article.repository.ts
│   │       │       └── ruwet-log.repository.ts
│   │       ├── llm/
│   │       │   ├── provider-factory.ts  # Factory: resolves provider from config
│   │       │   ├── adapters/
│   │       │   │   ├── anthropic.adapter.ts
│   │       │   │   ├── openai.adapter.ts
│   │       │   │   └── google.adapter.ts
│   │       │   └── mcp/
│   │       │       └── mcp-client.ts    # MCP client wrapper
│   │       ├── rss/
│   │       │   └── rss-fetcher.ts
│   │       └── cron/
│   │           └── aggregation-job.ts   # Bun.Cron wrapper + advisory lock
│   │
│   └── tests/
│       ├── unit/
│       │   ├── domain/
│       │   └── application/
│       └── integration/
│           ├── repositories/
│           └── routes/
│
└── frontend/                    # SvelteKit app (details outside TSD scope)
    ├── package.json
    └── src/
```

---

## 2. Dependency Rule

Dependency flow is one-way inward. No imports from outer layers to inner specific layers.

```
Infrastructure (adapters, DB, HTTP, LLM)
    └──> Application (use cases, ports, DTO)
             └──> Domain (entities, value objects)
```

**Rules:**
- `domain/` must not import modules from `application/` or `infrastructure/`.
- `application/` must not import modules from `infrastructure/`. It only depends on `ports/` (interfaces) whose implementations are *injected* from outside.
- `infrastructure/` may import from `application/` and `domain/`. This is where ports are implemented as concrete adapters.

---

## 3. Domain Layer

### 3.1 Entity: Article

```typescript
// domain/entities/article.ts

export interface Article {
  id: string;             // UUID
  title: string;
  url: string;            // unique, original source
  source: string;         // portal name (e.g., "detik.com")
  content: string;        // clean normalized text
  contentType: "raw" | "cleaned" | "summary";
  publishedAt: Date;
  fetchedAt: Date;
}
```

### 3.2 Entity: RuwetScore

```typescript
// domain/entities/ruwet-score.ts

import type { ScoreDimension } from "../value-objects/score-dimension.ts";

export interface RuwetScore {
  id: string;
  createdAt: Date;
  economy: ScoreDimension;
  politics: ScoreDimension;
  infrastructure: ScoreDimension;
  social: ScoreDimension;
  totalScore: number;     // computed: average of 4 dimensions
  aiSummary: string;
  flagged: boolean;       // true if delta > 30 from previous cycle
  sourceArticleIds: string[];
}
```

### 3.3 Value Object: ScoreDimension

```typescript
// domain/value-objects/score-dimension.ts

export class ScoreDimension {
  readonly value: number;

  constructor(value: number) {
    if (!Number.isInteger(value) || value < 0 || value > 100) {
      throw new Error(`ScoreDimension must be integer 0-100, got: ${value}`);
    }
    this.value = value;
  }
}
```

---

## 4. Application Layer

### 4.1 Port Interfaces

All ports are defined as TypeScript interfaces. Concrete implementations reside in `infrastructure/`.

```typescript
// application/ports/article-repository.port.ts

import type { Article } from "../../domain/entities/article.ts";

export interface ArticleRepositoryPort {
  upsertBatch(articles: Omit<Article, "id">[]): Promise<Article[]>;
  findRecentWithEmbedding(limit: number): Promise<Article[]>;
  semanticSearch(
    queryEmbedding: number[],
    limit: number,
    decayHalfLifeDays?: number,
  ): Promise<Array<Article & { finalScore: number }>>;
}
```

```typescript
// application/ports/ruwet-log-repository.port.ts

import type { RuwetScore } from "../../domain/entities/ruwet-score.ts";

export interface RuwetLogRepositoryPort {
  save(score: Omit<RuwetScore, "id">): Promise<RuwetScore>;
  getLatest(): Promise<RuwetScore | null>;
  getHistory(days: number): Promise<RuwetScore[]>;
  getAnomalyArticles(logId: string): Promise<string[]>;
}
```

```typescript
// application/ports/analysis-provider.port.ts

import type { Article } from "../../domain/entities/article.ts";

export interface AnalysisProviderPort {
  analyze(articles: Article[]): Promise<{
    economy: number;
    politics: number;
    infrastructure: number;
    social: number;
    summary: string;
  }>;
}
```

```typescript
// application/ports/chat-provider.port.ts

export interface ChatProviderPort {
  respond(context: string, question: string): Promise<{
    reply: string;
    sourceUrls: string[];
  }>;
}
```

```typescript
// application/ports/embedding-provider.port.ts

export interface EmbeddingProviderPort {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}
```

```typescript
// application/ports/rss-fetcher.port.ts

export interface RssFetcherPort {
  fetchAll(): Promise<Array<{
    title: string;
    url: string;
    source: string;
    content: string;
    publishedAt: Date;
  }>>;
}
```

### 4.2 Use Case: AggregateNewsUseCase

Main orchestration executed by the cron job every 3 hours.

```typescript
// application/use-cases/aggregate-news.use-case.ts

export class AggregateNewsUseCase {
  constructor(
    private rssFetcher: RssFetcherPort,
    private articleRepo: ArticleRepositoryPort,
    private embeddingProvider: EmbeddingProviderPort,
    private analysisProvider: AnalysisProviderPort,
    private ruwetLogRepo: RuwetLogRepositoryPort,
  ) {}

  async execute(): Promise<void> {
    // 1. Fetch RSS feeds (partial failure tolerant)
    const rawArticles = await this.rssFetcher.fetchAll();

    // 2. Upsert to DB (deduplication via UNIQUE url)
    const articles = await this.articleRepo.upsertBatch(
      rawArticles.map((a) => ({
        ...a,
        contentType: "raw" as const,
        fetchedAt: new Date(),
      })),
    );

    // 3. Generate embeddings (batch)
    const embeddings = await this.embeddingProvider.embedBatch(
      articles.map((a) => `${a.title}\n${a.content}`),
    );
    // save embedding to each article (update)

    // 4. Send to Analysis LLM
    const result = await this.analysisProvider.analyze(articles);

    // 5. Sanity check: compare with last score
    const lastLog = await this.ruwetLogRepo.getLatest();
    const totalScore = Math.round(
      (result.economy + result.politics + result.infrastructure + result.social) / 4,
    );
    const flagged = lastLog
      ? Math.abs(totalScore - lastLog.totalScore) > 30
      : false;

    // 6. Save log + article relations (in one transaction)
    await this.ruwetLogRepo.save({
      createdAt: new Date(),
      economy: new ScoreDimension(result.economy),
      politics: new ScoreDimension(result.politics),
      infrastructure: new ScoreDimension(result.infrastructure),
      social: new ScoreDimension(result.social),
      totalScore,
      aiSummary: result.summary,
      flagged,
      sourceArticleIds: articles.map((a) => a.id),
    });
  }
}
```

### 4.3 Use Case: GetChatAnswerUseCase

```typescript
// application/use-cases/get-chat-answer.use-case.ts

export class GetChatAnswerUseCase {
  constructor(
    private articleRepo: ArticleRepositoryPort,
    private embeddingProvider: EmbeddingProviderPort,
    private chatProvider: ChatProviderPort,
  ) {}

  async execute(question: string): Promise<{ reply: string; sources: string[] }> {
    // 1. Embed user question
    const queryEmbedding = await this.embeddingProvider.embed(question);

    // 2. Time-Weighted Semantic Search
    const relevantArticles = await this.articleRepo.semanticSearch(
      queryEmbedding,
      5, // top-5
    );

    // 3. Build context from top articles
    const context = relevantArticles
      .map((a) => `[${a.title}] (${a.url})\n${a.content}`)
      .join("\n---\n");

    // 4. Send to Chat LLM (single-turn)
    const response = await this.chatProvider.respond(context, question);

    return {
      reply: response.reply,
      sources: response.sourceUrls,
    };
  }
}
```

---

## 5. Infrastructure Layer

### 5.1 Database Schema (Drizzle ORM)

```typescript
// infrastructure/database/schema.ts

import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { vector } from "drizzle-orm/pg-core"; // pgvector extension via drizzle

export const contentTypeEnum = pgEnum("content_type", [
  "raw",
  "cleaned",
  "summary",
]);

export const newsArticles = pgTable(
  "news_articles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: varchar("title", { length: 512 }).notNull(),
    url: varchar("url", { length: 2048 }).notNull().unique(),
    source: varchar("source", { length: 128 }).notNull(),
    content: text("content").notNull(),
    contentType: contentTypeEnum("content_type").notNull().default("raw"),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    embedding: vector("embedding", { dimensions: 1536 }),
  },
  (table) => [
    index("idx_articles_published_at").on(table.publishedAt),
  ],
);

export const ruwetLogs = pgTable(
  "ruwet_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    scoreEconomy: integer("score_economy").notNull(),
    scorePolitics: integer("score_politics").notNull(),
    scoreInfrastructure: integer("score_infrastructure").notNull(),
    scoreSocial: integer("score_social").notNull(),
    totalScore: integer("total_score").notNull(),
    aiSummary: text("ai_summary").notNull(),
    flagged: boolean("flagged").notNull().default(false),
  },
  (table) => [
    index("idx_ruwet_logs_created_at").on(table.createdAt),
  ],
);

export const ruwetLogArticles = pgTable(
  "ruwet_log_articles",
  {
    logId: uuid("log_id")
      .notNull()
      .references(() => ruwetLogs.id, { onDelete: "cascade" }),
    articleId: uuid("article_id")
      .notNull()
      .references(() => newsArticles.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.logId, table.articleId] }),
  ],
);
```

**Check Constraint:** Drizzle ORM currently does not support declarative `CHECK` constraints. These constraints are added via custom SQL migration:

```sql
-- migrations/0001_add_check_constraints.sql
ALTER TABLE ruwet_logs
  ADD CONSTRAINT chk_score_economy CHECK (score_economy BETWEEN 0 AND 100),
  ADD CONSTRAINT chk_score_politics CHECK (score_politics BETWEEN 0 AND 100),
  ADD CONSTRAINT chk_score_infrastructure CHECK (score_infrastructure BETWEEN 0 AND 100),
  ADD CONSTRAINT chk_score_social CHECK (score_social BETWEEN 0 AND 100),
  ADD CONSTRAINT chk_total_score CHECK (total_score BETWEEN 0 AND 100);
```

**HNSW Index for pgvector:** Also added via custom migration because Drizzle does not natively support operator classes:

```sql
-- migrations/0002_add_hnsw_index.sql
CREATE INDEX idx_articles_embedding ON news_articles
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

### 5.2 Database Client

```typescript
// infrastructure/database/client.ts

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.ts";
import { config } from "../../config.ts";

const pool = new pg.Pool({
  connectionString: config.DATABASE_URL,
  max: 10,
});

export const db = drizzle(pool, { schema });
export { pool }; // exposed for advisory lock usage
```

### 5.3 Cron Job & Advisory Lock

```typescript
// infrastructure/cron/aggregation-job.ts

import { pool } from "../database/client.ts";

const LOCK_ID = 123456; // arbitrary constant for pg_advisory_lock

export function startAggregationCron(useCase: AggregateNewsUseCase): void {
  const cron = new Bun.CronJob("0 */3 * * *", async () => {
    const client = await pool.connect();
    try {
      // Attempt non-blocking advisory lock
      const lockResult = await client.query(
        "SELECT pg_try_advisory_lock($1) AS acquired",
        [LOCK_ID],
      );
      if (!lockResult.rows[0].acquired) {
        console.warn("[Cron] Previous run still active, skipping.");
        return;
      }

      await client.query("BEGIN");
      await useCase.execute();
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("[Cron] Aggregation failed:", error);
    } finally {
      // Release lock
      await client.query("SELECT pg_advisory_unlock($1)", [LOCK_ID]);
      client.release();
    }
  });
}
```

### 5.4 LLM Provider Factory (Strategy Pattern)

```typescript
// infrastructure/llm/provider-factory.ts

import type { AnalysisProviderPort } from "../../application/ports/analysis-provider.port.ts";
import type { ChatProviderPort } from "../../application/ports/chat-provider.port.ts";
import type { EmbeddingProviderPort } from "../../application/ports/embedding-provider.port.ts";
import { config } from "../../config.ts";

import { AnthropicAnalysisAdapter } from "./adapters/anthropic.adapter.ts";
import { OpenAIAnalysisAdapter } from "./adapters/openai.adapter.ts";
import { GoogleAnalysisAdapter } from "./adapters/google.adapter.ts";

export function createAnalysisProvider(): AnalysisProviderPort {
  switch (config.ANALYSIS_PROVIDER) {
    case "anthropic":
      return new AnthropicAnalysisAdapter(config.ANTHROPIC_API_KEY);
    case "openai":
      return new OpenAIAnalysisAdapter(config.OPENAI_API_KEY);
    case "google":
      return new GoogleAnalysisAdapter(config.GOOGLE_API_KEY);
    default:
      throw new Error(
        `Unknown analysis provider: ${config.ANALYSIS_PROVIDER}`,
      );
  }
}

export function createChatProvider(): ChatProviderPort {
  switch (config.CHAT_PROVIDER) {
    case "anthropic":
      return new AnthropicAnalysisAdapter(config.ANTHROPIC_API_KEY);
    case "openai":
      return new OpenAIAnalysisAdapter(config.OPENAI_API_KEY);
    case "google":
      return new GoogleAnalysisAdapter(config.GOOGLE_API_KEY);
    default:
      throw new Error(`Unknown chat provider: ${config.CHAT_PROVIDER}`);
  }
}

// Embedding can use the same or a separate provider
export function createEmbeddingProvider(): EmbeddingProviderPort {
  switch (config.EMBEDDING_PROVIDER) {
    case "openai":
      return new OpenAIAnalysisAdapter(config.OPENAI_API_KEY);
    case "google":
      return new GoogleAnalysisAdapter(config.GOOGLE_API_KEY);
    default:
      throw new Error(
        `Unknown embedding provider: ${config.EMBEDDING_PROVIDER}`,
      );
  }
}
```

### 5.5 HTTP Layer (Hono)

Route handlers act purely as thin adapters. No business logic here.

```typescript
// infrastructure/http/routes/metrics.route.ts

import { Hono } from "hono";
import type { GetCurrentMetricsUseCase } from "../../../application/use-cases/get-current-metrics.use-case.ts";
import type { GetMetricsHistoryUseCase } from "../../../application/use-cases/get-metrics-history.use-case.ts";

export function metricsRoutes(
  getCurrentMetrics: GetCurrentMetricsUseCase,
  getMetricsHistory: GetMetricsHistoryUseCase,
): Hono {
  const router = new Hono();

  router.get("/current", async (c) => {
    const result = await getCurrentMetrics.execute();
    return c.json(result);
  });

  router.get("/history", async (c) => {
    const days = Number(c.req.query("days") ?? 7);
    const result = await getMetricsHistory.execute(days);
    return c.json(result);
  });

  return router;
}
```

### 5.6 Middleware: Rate Limiter

```typescript
// infrastructure/http/middleware/rate-limiter.ts

import type { Context, Next } from "hono";

const store = new Map<string, { count: number; resetAt: number }>();

export function rateLimiter(maxRequests: number, windowMs: number) {
  return async (c: Context, next: Next) => {
    const ip =
      c.req.header("x-forwarded-for") ??
      c.req.header("x-real-ip") ??
      "unknown";
    const now = Date.now();
    const record = store.get(ip);

    if (!record || now > record.resetAt) {
      store.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      return c.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: `Too many requests. Try again in ${Math.ceil((record.resetAt - now) / 1000)} seconds.`,
          },
        },
        429,
      );
    }

    record.count++;
    return next();
  };
}
```

### 5.7 Middleware: Error Handler

```typescript
// infrastructure/http/middleware/error-handler.ts

import type { Context } from "hono";

export function errorHandler(err: Error, c: Context) {
  console.error("[HTTP Error]", {
    method: c.req.method,
    path: c.req.path,
    error: err.message,
    stack: err.stack,
  });

  if (err.message.includes("ScoreDimension")) {
    return c.json(
      { error: { code: "VALIDATION_ERROR", message: err.message } },
      400,
    );
  }

  return c.json(
    { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } },
    500,
  );
}
```

### 5.8 Middleware: Telegram Auth

```typescript
// infrastructure/http/middleware/telegram-auth.ts

import type { Context, Next } from "hono";
import { config } from "../../../config.ts";

export async function telegramAuth(c: Context, next: Next) {
  const token = c.req.header("x-telegram-bot-api-secret-token");
  if (token !== config.TELEGRAM_WEBHOOK_SECRET) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid webhook token." } },
      401,
    );
  }
  return next();
}
```

---

## 6. Configuration Management

All environment variables are documented and validated at startup. If any are missing, the application fails to start with a clear message.

```typescript
// src/config.ts

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  // Server
  PORT: Number(process.env.PORT ?? 3000),
  NODE_ENV: process.env.NODE_ENV ?? "development",

  // Database
  DATABASE_URL: requireEnv("DATABASE_URL"),

  // LLM Providers
  ANALYSIS_PROVIDER: requireEnv("ANALYSIS_PROVIDER"), // "anthropic" | "openai" | "google"
  CHAT_PROVIDER: requireEnv("CHAT_PROVIDER"),
  EMBEDDING_PROVIDER: requireEnv("EMBEDDING_PROVIDER"),

  // API Keys (conditional based on provider)
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ?? "",

  // Telegram
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ?? "",
  TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET ?? "",

  // RSS
  RSS_FEED_URLS: (process.env.RSS_FEED_URLS ?? "").split(",").filter(Boolean),

  // Rate Limiting
  CHAT_RATE_LIMIT_MAX: Number(process.env.CHAT_RATE_LIMIT_MAX ?? 10),
  CHAT_RATE_LIMIT_WINDOW_MS: Number(
    process.env.CHAT_RATE_LIMIT_WINDOW_MS ?? 60000,
  ),
} as const;
```

**`.env.example`:**

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/ruwetmeter

# LLM Provider Selection
ANALYSIS_PROVIDER=anthropic    # anthropic | openai | google
CHAT_PROVIDER=google           # anthropic | openai | google
EMBEDDING_PROVIDER=openai      # openai | google

# API Keys
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_API_KEY=

# Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=

# RSS Feeds (comma-separated)
RSS_FEED_URLS=https://rss.detik.com/index.php/detikcom,https://www.cnnindonesia.com/nasional/rss

# Rate Limiting
CHAT_RATE_LIMIT_MAX=10
CHAT_RATE_LIMIT_WINDOW_MS=60000
```

---

## 7. Time-Weighted RAG: SQL Implementation

pgvector query with *time-decay* applied directly at the SQL level for optimal performance.

```sql
SELECT
  id, title, url, content, published_at,
  (1 - (embedding <=> $1::vector))                    -- cosine similarity
    * POWER(0.5, EXTRACT(EPOCH FROM (NOW() - published_at)) / 86400)
    AS final_score
FROM news_articles
WHERE embedding IS NOT NULL
ORDER BY final_score DESC
LIMIT $2;
```

Notes:
- `<=>` is the pgvector cosine distance operator. `1 - distance` yields similarity.
- `POWER(0.5, age_in_days)` applies exponential decay with a 1-day half-life.
- This query leverages the HNSW index on the `embedding` column for *approximate nearest neighbor* search.

---

## 8. App Bootstrap & Dependency Wiring

```typescript
// src/index.ts

import { Hono } from "hono";
import { cors } from "hono/cors";
import { db } from "./infrastructure/database/client.ts";
import { config } from "./config.ts";

// Repositories
import { ArticleRepository } from "./infrastructure/database/repositories/article.repository.ts";
import { RuwetLogRepository } from "./infrastructure/database/repositories/ruwet-log.repository.ts";

// Providers
import {
  createAnalysisProvider,
  createChatProvider,
  createEmbeddingProvider,
} from "./infrastructure/llm/provider-factory.ts";
import { RssFetcher } from "./infrastructure/rss/rss-fetcher.ts";

// Use Cases
import { AggregateNewsUseCase } from "./application/use-cases/aggregate-news.use-case.ts";
import { GetCurrentMetricsUseCase } from "./application/use-cases/get-current-metrics.use-case.ts";
import { GetMetricsHistoryUseCase } from "./application/use-cases/get-metrics-history.use-case.ts";
import { GetNewsAnomaliesUseCase } from "./application/use-cases/get-news-anomalies.use-case.ts";
import { GetChatAnswerUseCase } from "./application/use-cases/get-chat-answer.use-case.ts";

// HTTP
import { metricsRoutes } from "./infrastructure/http/routes/metrics.route.ts";
import { newsRoutes } from "./infrastructure/http/routes/news.route.ts";
import { chatRoutes } from "./infrastructure/http/routes/chat.route.ts";
import { webhookRoutes } from "./infrastructure/http/routes/webhook.route.ts";
import { errorHandler } from "./infrastructure/http/middleware/error-handler.ts";

// Cron
import { startAggregationCron } from "./infrastructure/cron/aggregation-job.ts";

// --- Wiring ---

const articleRepo = new ArticleRepository(db);
const ruwetLogRepo = new RuwetLogRepository(db);

const analysisProvider = createAnalysisProvider();
const chatProvider = createChatProvider();
const embeddingProvider = createEmbeddingProvider();
const rssFetcher = new RssFetcher(config.RSS_FEED_URLS);

const aggregateNewsUC = new AggregateNewsUseCase(
  rssFetcher, articleRepo, embeddingProvider, analysisProvider, ruwetLogRepo,
);
const getCurrentMetricsUC = new GetCurrentMetricsUseCase(ruwetLogRepo);
const getMetricsHistoryUC = new GetMetricsHistoryUseCase(ruwetLogRepo);
const getNewsAnomaliesUC = new GetNewsAnomaliesUseCase(ruwetLogRepo, articleRepo);
const getChatAnswerUC = new GetChatAnswerUseCase(
  articleRepo, embeddingProvider, chatProvider,
);

// --- Hono App ---

const app = new Hono().basePath("/api/v1");
app.use("*", cors());
app.onError(errorHandler);

app.route("/metrics", metricsRoutes(getCurrentMetricsUC, getMetricsHistoryUC));
app.route("/news", newsRoutes(getNewsAnomaliesUC));
app.route("/chat", chatRoutes(getChatAnswerUC));
app.route("/webhook", webhookRoutes(getChatAnswerUC));

// --- Start ---

startAggregationCron(aggregateNewsUC);

export default {
  port: config.PORT,
  fetch: app.fetch,
};
```

---

## 9. Testing Strategy

| Type | Target | Tools | How to Run |
|---|---|---|---|
| **Unit Test** | Domain entities, value objects, use cases (with mocked ports) | `bun:test` | `bun test tests/unit/` |
| **Integration Test** | Repository implementations against real PostgreSQL | `bun:test` + `testcontainers` (Docker) | `bun test tests/integration/` |
| **API / Contract Test** | HTTP endpoints per `openapi.yml` | `bun:test` + Hono test client | `bun test tests/integration/routes/` |

**Principles:**
- Use cases are tested with *mocks* on all ports (repository, provider). This ensures business logic can be verified without external dependencies.
- Repositories are tested against a real PostgreSQL database (via testcontainers) to validate SQL queries, constraints, and indexes.
- Route tests validate the HTTP contract (status code, response shape) per the OpenAPI specification.

---

## 10. Deployment

### 10.1 Initial Target: VPS / Docker Compose

```yaml
# docker-compose.yml (development)
services:
  db:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: ruwetmeter
      POSTGRES_USER: ruwet
      POSTGRES_PASSWORD: secret
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    build: ./backend
    depends_on:
      - db
    env_file:
      - ./backend/.env
    ports:
      - "3000:3000"

volumes:
  pgdata:
```

### 10.2 Environment Separation

| Variable | Development | Production |
|---|---|---|
| `NODE_ENV` | `development` | `production` |
| `DATABASE_URL` | Local / Docker Compose | Managed PostgreSQL (Supabase, Neon, etc.) |
| `ANALYSIS_PROVIDER` | Cheap provider for testing | Production provider of choice |

---

## 11. Data Retention Policy

To prevent uncontrolled database growth:
- `news_articles` older than **90 days** will be moved to cold storage or deleted by a separate scheduled job.
- `ruwet_logs` are stored **indefinitely** (low volume: ~8 records/day).
- This policy can be configured via the `DATA_RETENTION_DAYS` environment variable.

