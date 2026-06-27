process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://test:test@localhost:5432/ruwetmeter_test";
process.env.ANALYSIS_PROVIDER = process.env.ANALYSIS_PROVIDER ?? "openai";
process.env.CHAT_PROVIDER = process.env.CHAT_PROVIDER ?? "openai";
process.env.EMBEDDING_PROVIDER = process.env.EMBEDDING_PROVIDER ?? "openai";
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "sk-test-fake-key";
