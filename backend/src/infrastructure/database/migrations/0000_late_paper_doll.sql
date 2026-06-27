CREATE TYPE "public"."content_type" AS ENUM('raw', 'cleaned', 'summary');--> statement-breakpoint
CREATE TABLE "news_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(512) NOT NULL,
	"url" varchar(2048) NOT NULL,
	"source" varchar(128) NOT NULL,
	"content" text NOT NULL,
	"content_type" "content_type" DEFAULT 'raw' NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"embedding" vector(1536),
	CONSTRAINT "news_articles_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "ruwet_log_articles" (
	"log_id" uuid NOT NULL,
	"article_id" uuid NOT NULL,
	CONSTRAINT "ruwet_log_articles_log_id_article_id_pk" PRIMARY KEY("log_id","article_id")
);
--> statement-breakpoint
CREATE TABLE "ruwet_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"score_economy" integer NOT NULL,
	"score_politics" integer NOT NULL,
	"score_infrastructure" integer NOT NULL,
	"score_social" integer NOT NULL,
	"total_score" integer NOT NULL,
	"ai_summary" text NOT NULL,
	"flagged" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ruwet_log_articles" ADD CONSTRAINT "ruwet_log_articles_log_id_ruwet_logs_id_fk" FOREIGN KEY ("log_id") REFERENCES "public"."ruwet_logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ruwet_log_articles" ADD CONSTRAINT "ruwet_log_articles_article_id_news_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."news_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_articles_published_at" ON "news_articles" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "idx_ruwet_logs_created_at" ON "ruwet_logs" USING btree ("created_at");