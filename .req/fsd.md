# FUNCTIONAL SPECIFICATION DOCUMENT (FSD)

**Project Name:** RuwetMeter – National Sentiment & Anomaly Analysis System
**Architecture:** Distributed (SPA Frontend & RESTful API Backend)
**Document Version:** 2.1 (Architecture, DB Schema & Reliability Revision)

## 1. Introduction

### 1.1 Document Purpose
This document defines the functional specification, technical architecture, system design, and logic flow for the development of RuwetMeter. The system acts as a *real-time* measurement tool to autonomously monitor socio-political stability metrics and public sentiment in Indonesia.

### 1.2 System Scope
RuwetMeter operates through three main pillars:
1. **Automatic Aggregation:** Collects local news, extracts text, and performs turbulence assessment periodically (every 3 hours).
2. **Visual Dashboard:** Displays "Ruwet" level fluctuation charts in *real-time* to users.
3. **Interactive Channels (Chatbot & Webhook):** Provides a virtual assistant to answer specific user questions regarding issue context, accessible via *web* and Telegram.

---

## 2. Technical Architecture & Tech Stack

The system implements *Clean Architecture* principles with layered boundaries to ensure testability and framework independence.

### 2.1 Clean Architecture Layers
1. **Domain Layer:** Core entities (`Article`, `RuwetScore`) and pure logic. No external library dependencies.
2. **Application Layer:** *Use Cases* (e.g., `AggregateNewsUseCase`, `GetChatAnswerUseCase`) and *Ports/Interfaces* for both database and LLM.
3. **Infrastructure Layer:** Specific technical implementations: Hono Route Handlers (as adapters), PostgreSQL Repositories, RSS client, and MCP/LLM SDK adapters. Hono *routes* act only as thin controllers that forward data to the Application Layer.

| System Layer | Technology Choice | Role & Description |
| --- | --- | --- |
| **Frontend (UI)** | Svelte (SvelteKit) | *Dashboard* and *chat* interface. |
| **Data Visualization** | Chart.js (`svelte-chartjs`) | Renders *Time-Series Line Charts*. |
| **Backend & API** | Bun + Hono (TypeScript) | Fast REST API *web server*, *webhook receiver*, and *Cron Job*. |
| **AI Orchestrator** | MCP (Model Context Protocol) | Manages tool-use interactions with LLM in a standard and lightweight manner, without heavy *overhead* (replacing LangChain). |
| **Database & ORM** | PostgreSQL + `pgvector` + Drizzle ORM | Stores metric logs, news metadata, and semantic search vectors (RAG) in a *type-safe* manner. |

---

## 3. Business Logic & Core Algorithms

### 3.1 LLM Agnostic Integration (*Strategy Pattern*)

The system defines strict contract interfaces (*Ports* in Application Layer) to avoid *vendor lock-in*. LLM interactions follow the MCP standard or directly via each provider's native SDK through internal adapters.
Example contracts:
```typescript
interface AnalysisProvider {
  analyze(articles: ArticleBatch): Promise<RuwetScore>;
}
interface ChatProvider {
  respond(context: RAGContext, question: string): Promise<ChatResponse>;
}
```
* **Main Analysis Model (Heavy Compute):** High-performance model (e.g., Claude 3.5, GPT-4o) for JSON *Ruwet Level* extraction.
* **Chatbot Model (Light Compute):** Fast & cheap model (e.g., Llama 3 or Gemini Flash) for answering specific RAG *queries*.

### 3.2 *Time-Weighted* RAG Algorithm

Search prioritizes recent issues using an exponential decay function (24-hour half-life).
Formula: $S_{final}=S_{semantic}\times(0.5)^{\Delta t}$
*(Note: The 24-hour half-life is a simplification that applies uniformly to all topics. In subsequent iterations, this can be made dynamic per category).*

### 3.3 Ruwet Scoring Indicators

Scale **0 - 100**, extracted from the Main Model's JSON response based on 4 dimensions: (1) Economy & Welfare, (2) Politics & Law, (3) Infrastructure & Public Services, (4) Social & Security.
* **Sanity Check:** If the total score difference from the previous cycle exceeds 30 points, the system will flag the log for manual review (*flagged*).

---

## 4. System Workflows & Reliability

### 4.1 Aggregation Path (Background / *Cron Job*)
Isolated from user *requests*, executed by `Bun.Cron` every **3 hours**.
* **Reliability (Idempotency):** Operations are wrapped in a *database transaction*. Equipped with a *Distributed Lock* mechanism (e.g., PostgreSQL *advisory lock*) to prevent *overlapping runs* if the previous *cron* stalled. Mid-process failures trigger a full *rollback*.
* **RSS Deduplication:** *Feed* fetching checks against the unique URL parameter source (UPSERT `ON CONFLICT DO NOTHING`) with *retry/timeout policy*.

### 4.2 Presentation Path (*Dashboard* REST API)
Passive path. Svelte client requests data from the API (`/api/v1/metrics/history`). The backend fetches data directly from the PostgreSQL index and responds with consistently formatted JSON.

### 4.3 Interactive Path (*Web Chat* & *Telegram Webhook*)
Client sends a message (`POST /api/v1/chat` or `POST /api/v1/webhook/telegram`).
* **Conversation Context:** Currently focuses on a **single-turn question-answer** system. The API engine facilitates the `session_id` parameter as an initial *future-proof* step, but chat history is not managed in this release.
* **Webhook Security:** Mandatory validation using the `X-Telegram-Bot-Api-Secret-Token` header.
* **Cost & Abuse Protection:** *Rate-limiting* is applied to this endpoint to prevent LLM API billing surges from potential spam.

---

## 5. API Endpoint Specification

To separate *concerns*, all API design and contracts (Request Body, Response Schema, Error Format, Versioning) are documented in a separate **`openapi.yml`** file at the project root level.

Main endpoints under `/api/v1/` prefix:
* `GET /metrics/current`
* `GET /metrics/history`
* `GET /news/anomalies`
* `POST /chat`
* `POST /webhook/telegram`

---

## 6. Database Schema

Table structures are designed with data integrity reliability as the top priority. All interactions and *schema migration* updates must use **Drizzle ORM** to ensure fully *type-safe* synchronization with the TypeScript codebase.

**Table 1: `news_articles`** (RAG Knowledge Base)
* `id` (UUID, Primary Key)
* `title` (Varchar)
* `url` (Varchar, Original Link - **UNIQUE Constraint**)
* `source` (Varchar, Source News Portal)
* `content` (Text, *Scraping* result)
* `content_type` (Enum: 'raw', 'cleaned', 'summary')
* `published_at` (Timestamp, Key for $\Delta t$ calculation)
* `fetched_at` (Timestamp, Time fetched by system)
* `embedding` (Vector, pgvector embeddings)
*(Index Plan: B-Tree on `published_at`, Unique Index on `url`, HNSW index on `embedding`)*

**Table 2: `ruwet_logs`** (Time-Series Log)
* `id` (UUID, Primary Key)
* `created_at` (Timestamp, Execution time)
* `score_economy` (Integer, CHECK 0-100)
* `score_politics` (Integer, CHECK 0-100)
* `score_infrastructure` (Integer, CHECK 0-100)
* `score_social` (Integer, CHECK 0-100)
* `total_score` (Integer, Average)
* `ai_summary` (Text)
*(Index Plan: B-Tree on `created_at`)*

**Table 3: `ruwet_log_articles`** (Junction Table)
* `log_id` (UUID, FK to `ruwet_logs`)
* `article_id` (UUID, FK to `news_articles`)
*(To precisely track the news basis for scores at a given hour)*

---

## 7. Non-Functional Requirements

1. **Testing Strategy:** Application code must include unit tests (especially for *domain/application* layers) and *integration tests* for database paths (repositories) and HTTP *endpoints*.
2. **Deployment:** Initial *deployment* target is VPS/Container with *environment variable* separation between `development`, `staging`, and `production`.
3. **Observability:** Implement *structured logging* and standard HTTP error handling to record cron executions and API issues for traceability.

