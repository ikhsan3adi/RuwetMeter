# RuwetMeter — Agent Guide

## Current state

Phase 1 complete — backend foundation scaffolded:

- `backend/` — Bun + Hono + TypeScript with Clean Architecture 3 layers
- Design specs in `.req/fsd.md`, `.req/tsd.md`, `openapi.yml`

Existing (domain → ports → infra): domain entities/value objects, 6 port interfaces, config with env validation (fails fast), Drizzle schema (3 tables + enum), auto-generated migration (`0000_late_paper_doll.sql`), 2 custom SQL migrations, repository implementations (Article, RuwetLog), Docker Compose for pgvector.

NOT yet implemented (Phase 2+): use cases, LLM adapter (Provider Factory), MCP client, RSS fetcher (scraping), cron job, HTTP layer (routes, middleware, Hono app bootstrap), frontend.

## Commands

| Command                       | Description                                   |
| ----------------------------- | --------------------------------------------- |
| `bun run dev`                 | Start dev server with --watch                 |
| `bun run typecheck`           | TypeScript type check (tsc --noEmit)          |
| `bun test`                    | All tests                                     |
| `bun test tests/unit/`        | Unit tests only                               |
| `bun test tests/integration/` | Integration tests only                        |
| `bun run db:generate`         | Generate Drizzle migration from schema        |
| `bun run db:migrate`          | Apply migration to database                   |
| `bun run db:push`             | Push schema directly (without migration file) |
| `docker compose up -d db`     | Start PostgreSQL + pgvector locally           |

Dev order: `typecheck → test` (typecheck first).

## Architecture

### Dependency rule (strict, enforced by convention)

```
domain/ → application/ → infrastructure/  (one-way)
```

- `domain/`: zero dependencies, must not import anything from outside
- `application/`: only imports from `domain/` and `ports/`
- `infrastructure/`: adapter implementations for ports, may import from `application/` and `domain/`

### LLM integration

- Provider: **Agnostic (Strategy Pattern)** via Provider Factory (Anthropic, OpenAI, Google, OpenRouter, DeepSeek, Mistral, Groq).
- MCP as the main abstraction for LLM tool-use
- Embedding: Dynamically selected via EmbeddingProviderPort (e.g. OpenAI `text-embedding-3-small` or Google embeddings).

### Key decisions from user

| Aspect             | Choice                                    |
| ------------------ | ----------------------------------------- |
| Frontend scope     | SPA Dashboard + Chat (not yet scaffolded) |
| LLM Architecture   | Provider Factory (Strategy Pattern)       |
| LLM abstraction    | MCP as primary                            |
| Content extraction | Full article scraping via Readability     |
| Embedding          | Agnostic (via EmbeddingProviderPort)      |
| Request validation | Zod middleware (`@hono/zod-validator`)    |
| Testing DB         | Testcontainers (Docker always available)  |

## DB schema (implemented)

4 tables: `news_articles`, `ruwet_logs`, `ruwet_log_articles` (junction), plus `content_type` enum.

- `news_articles.embedding` = `vector(1536)` for pgvector
- UNIQUE constraint on `url` (RSS deduplication at DB level)
- B-Tree indexes on `published_at` and `created_at`

### Migration workflow

- `drizzle-kit generate` for schema DDL (auto-generated `0000_late_paper_doll.sql`)
- Custom SQL (CHECK constraints, HNSW index) in `migrations/0001_add_check_constraints.sql` and `0002_add_hnsw_index.sql` — registered in `meta/_journal.json`, applied by `drizzle-kit migrate` alongside DDL
- Total = 3 migration files (1 auto + 2 custom)

## Env vars

See `.env.example`. All required unless a default exists:

- `DATABASE_URL` — required
- `ANALYSIS_PROVIDER`, `CHAT_PROVIDER`, `EMBEDDING_PROVIDER` — required (determines which API keys are needed at runtime)
- `RSS_FEED_URLS` — comma-separated
- Validation in `src/config.ts` — fails at startup if required env is missing

## Testing (planned, no test code yet)

- `bun:test` with mocked ports
- Integration test with testcontainers (real PostgreSQL)
- Hono test client for route contract tests
- Test dirs: `tests/unit/domain/`, `tests/unit/application/`, `tests/integration/repositories/`, `tests/integration/routes/`

## Notes for agents

- Use English for doc strings, commit messages, comments
- `ScoreDimension` constructor: validates integer 0–100, throws if invalid
- Total score = average of 4 dimensions; flagged if delta > 30 from previous cycle
- LLM adapters implement `AnalysisProviderPort`, `ChatProviderPort`, `EmbeddingProviderPort`
- Chat single-turn; `session_id` accepted but not processed yet
- Telegram webhook: validates `X-Telegram-Bot-Api-Secret-Token` header
- Rate limiter in-memory (`Map`), not shared across instances
- Data retention: `news_articles` > 90 days deleted (scheduled job not implemented yet)
- Time-weighted RAG: cosine similarity × exponential decay (half-life 24h), in SQL
- Don't write too much comment, write if critical and necessary
