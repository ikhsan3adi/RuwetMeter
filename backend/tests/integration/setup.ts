import { GenericContainer, Wait } from "testcontainers";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../../src/infrastructure/database/schema";

let container: Awaited<ReturnType<GenericContainer["start"]>> | null = null;
let pool: pg.Pool | null = null;

export async function startTestDb(): Promise<{
  db: ReturnType<typeof drizzle>;
  pool: pg.Pool;
}> {
  container = await new GenericContainer("pgvector/pgvector:pg16")
    .withEnvironment({
      POSTGRES_DB: "ruwetmeter_test",
      POSTGRES_USER: "test",
      POSTGRES_PASSWORD: "test",
    })
    .withExposedPorts(5432)
    .withWaitStrategy(Wait.forLogMessage("database system is ready to accept connections"))
    .withStartupTimeout(120000)
    .start();

  const port = container.getMappedPort(5432);
  const host = container.getHost();

  pool = new pg.Pool({
    connectionString: `postgresql://test:test@${host}:${port}/ruwetmeter_test`,
  });

  const db = drizzle(pool, { schema });
  return { db, pool };
}

export async function stopTestDb(): Promise<void> {
  if (pool) {
    await pool.end().catch(() => {});
    pool = null;
  }
  if (container) {
    await container.stop().catch(() => {});
    container = null;
  }
}

export async function applySchema(conn: pg.Pool): Promise<void> {
  await conn.query(`CREATE EXTENSION IF NOT EXISTS vector`);

  await conn.query(`DO $$ BEGIN
    CREATE TYPE content_type AS ENUM ('raw', 'cleaned', 'summary');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;`);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS news_articles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title varchar(512) NOT NULL,
      url varchar(2048) NOT NULL UNIQUE,
      source varchar(128) NOT NULL,
      content text NOT NULL,
      content_type content_type DEFAULT 'raw' NOT NULL,
      published_at timestamptz NOT NULL,
      fetched_at timestamptz DEFAULT now() NOT NULL,
      embedding vector(1536)
    );

    CREATE TABLE IF NOT EXISTS ruwet_logs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at timestamptz DEFAULT now() NOT NULL,
      score_economy integer NOT NULL,
      score_politics integer NOT NULL,
      score_infrastructure integer NOT NULL,
      score_social integer NOT NULL,
      total_score integer NOT NULL,
      ai_summary text NOT NULL,
      flagged boolean DEFAULT false NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ruwet_log_articles (
      log_id uuid NOT NULL REFERENCES ruwet_logs(id) ON DELETE CASCADE,
      article_id uuid NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
      PRIMARY KEY (log_id, article_id)
    );
  `);
}
