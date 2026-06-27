function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  PORT: Number(process.env.PORT ?? 3000),
  NODE_ENV: process.env.NODE_ENV ?? "development",

  DATABASE_URL: requireEnv("DATABASE_URL"),

  ANALYSIS_PROVIDER: requireEnv("ANALYSIS_PROVIDER"),
  CHAT_PROVIDER: requireEnv("CHAT_PROVIDER"),
  EMBEDDING_PROVIDER: requireEnv("EMBEDDING_PROVIDER"),

  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ?? "",
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ?? "",
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ?? "",
  MISTRAL_API_KEY: process.env.MISTRAL_API_KEY ?? "",
  GROQ_API_KEY: process.env.GROQ_API_KEY ?? "",
  OPENCODE_API_KEY: process.env.OPENCODE_API_KEY ?? "",
  OPENCODE_BASE_URL: process.env.OPENCODE_BASE_URL ?? "https://opencode.ai/zen/v1",

  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ?? "",
  TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET ?? "",

  RSS_FEED_URLS: (process.env.RSS_FEED_URLS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  CHAT_RATE_LIMIT_MAX: Number(process.env.CHAT_RATE_LIMIT_MAX ?? 10),
  CHAT_RATE_LIMIT_WINDOW_MS: Number(
    process.env.CHAT_RATE_LIMIT_WINDOW_MS ?? 60000,
  ),

  DATA_RETENTION_DAYS: Number(process.env.DATA_RETENTION_DAYS ?? 90),
} as const;

const PROVIDER_KEY_MAP: Record<string, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  google: "GOOGLE_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  deepseek: "DEEPSEEK_API_KEY",
  mistral: "MISTRAL_API_KEY",
  groq: "GROQ_API_KEY",
  opencode: "OPENCODE_API_KEY",
};

const selectedProviders = [
  config.ANALYSIS_PROVIDER,
  config.CHAT_PROVIDER,
  config.EMBEDDING_PROVIDER,
];

for (const provider of [...new Set(selectedProviders)]) {
  const keyName = PROVIDER_KEY_MAP[provider];
  if (!keyName) {
    throw new Error(`Unknown LLM provider: ${provider}`);
  }
  if (!process.env[keyName]) {
    throw new Error(
      `Provider "${provider}" selected but ${keyName} is not set`,
    );
  }
}
