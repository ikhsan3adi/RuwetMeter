ALTER TABLE "news_articles" ADD COLUMN "score_economy" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "news_articles" ADD COLUMN "score_politics" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "news_articles" ADD COLUMN "score_infrastructure" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "news_articles" ADD COLUMN "score_social" integer DEFAULT 0 NOT NULL;