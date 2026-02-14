CREATE TYPE "public"."digest_status" AS ENUM('sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."topic_type" AS ENUM('vertical', 'company', 'keyword');--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" uuid NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"source" text,
	"published_at" timestamp with time zone,
	"found_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "articles_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"cron_schedule" text DEFAULT '0 7 * * 1-5' NOT NULL,
	"max_articles_per_digest" integer DEFAULT 15 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "digests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"recipient_email" text NOT NULL,
	"article_count" integer DEFAULT 0 NOT NULL,
	"status" "digest_status" DEFAULT 'sent' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "topic_type" DEFAULT 'keyword' NOT NULL,
	"search_query" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;