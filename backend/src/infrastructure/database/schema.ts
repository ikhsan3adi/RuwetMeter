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
  vector,
} from "drizzle-orm/pg-core";

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
  (table) => [index("idx_articles_published_at").on(table.publishedAt)],
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
  (table) => [index("idx_ruwet_logs_created_at").on(table.createdAt)],
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
