import { execSync } from 'child_process'

process.env.ANALYSIS_PROVIDER = process.env.ANALYSIS_PROVIDER ?? 'openai'
process.env.CHAT_PROVIDER = process.env.CHAT_PROVIDER ?? 'openai'
process.env.EMBEDDING_PROVIDER = process.env.EMBEDDING_PROVIDER ?? 'openai'
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? 'sk-test-fake-key'

console.log('[Test Setup] Starting global test database container synchronously...')

const containerName = 'ruwetmeter_test_db'
const dbName = 'ruwetmeter_test'
const dbUser = 'test'
const dbPass = 'test'
const dbPort = '54321'

// 1. Remove old container if exists
try {
  execSync(`docker rm -f ${containerName}`, { stdio: 'ignore' })
} catch (e) {}

// 2. Start pgvector container on port 54321
try {
  execSync(
    `docker run -d --name ${containerName} -p ${dbPort}:5432 -e POSTGRES_DB=${dbName} -e POSTGRES_USER=${dbUser} -e POSTGRES_PASSWORD=${dbPass} pgvector/pgvector:pg16`,
    { stdio: 'ignore' },
  )
} catch (err) {
  console.error('[Test Setup] Failed to run docker container:', err)
  process.exit(1)
}

// 3. Wait for PostgreSQL to be fully ready (attempt to run query SELECT 1)
console.log('[Test Setup] Waiting for database system to be fully initialized...')
let ready = false
for (let i = 0; i < 60; i++) {
  try {
    execSync(
      `docker exec -e PGPASSWORD=${dbPass} ${containerName} psql -U ${dbUser} -d ${dbName} -c "SELECT 1;"`,
      { stdio: 'ignore' },
    )
    ready = true
    break
  } catch (e) {
    execSync('sleep 0.25')
  }
}

if (!ready) {
  console.error('[Test Setup] Database container failed to become ready in time')
  try {
    execSync(`docker logs ${containerName}`)
  } catch (e) {}
  process.exit(1)
}

// 4. Set DATABASE_URL env var
const dbUrl = `postgresql://${dbUser}:${dbPass}@localhost:${dbPort}/${dbName}`
process.env.DATABASE_URL = dbUrl
console.log(`[Test Setup] Database container started at ${dbUrl}`)

// 5. Apply schema synchronously
console.log('[Test Setup] Applying database schema...')
try {
  execSync(
    `docker exec -e PGPASSWORD=${dbPass} -i ${containerName} psql -U ${dbUser} -d ${dbName} -c "CREATE EXTENSION IF NOT EXISTS vector;"`,
    { stdio: 'ignore' },
  )

  execSync(
    `docker exec -e PGPASSWORD=${dbPass} -i ${containerName} psql -U ${dbUser} -d ${dbName} -c "DO \\$\\$ BEGIN CREATE TYPE content_type AS ENUM ('raw', 'cleaned', 'summary'); EXCEPTION WHEN duplicate_object THEN null; END \\$\\$;"`,
    { stdio: 'ignore' },
  )

  const schemaSql = `
    CREATE TABLE IF NOT EXISTS news_articles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title varchar(512) NOT NULL,
      url varchar(2048) NOT NULL UNIQUE,
      source varchar(128) NOT NULL,
      content text NOT NULL,
      content_type content_type DEFAULT 'raw' NOT NULL,
      published_at timestamptz NOT NULL,
      fetched_at timestamptz DEFAULT now() NOT NULL,
      score_economy integer DEFAULT 0 NOT NULL,
      score_politics integer DEFAULT 0 NOT NULL,
      score_infrastructure integer DEFAULT 0 NOT NULL,
      score_social integer DEFAULT 0 NOT NULL,
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
  `

  execSync(
    `docker exec -e PGPASSWORD=${dbPass} -i ${containerName} psql -U ${dbUser} -d ${dbName} -c "${schemaSql.replace(/"/g, '\\"')}"`,
    { stdio: 'ignore' },
  )
  console.log('[Test Setup] Global schema applied successfully.')
} catch (err) {
  console.error('[Test Setup] Failed to apply schema:', err)
  process.exit(1)
}

// 6. Stop the container on process exit
process.on('exit', () => {
  try {
    execSync(`docker rm -f ${containerName}`, { stdio: 'ignore' })
  } catch (e) {}
})
