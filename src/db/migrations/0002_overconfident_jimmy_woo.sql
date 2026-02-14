CREATE TYPE "public"."frequency" AS ENUM('daily', 'weekdays', 'weekly');--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"domain" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "articles" ALTER COLUMN "topic_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "config" ALTER COLUMN "cron_schedule" SET DEFAULT '0 6 * * *';--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "company_id" uuid;--> statement-breakpoint
ALTER TABLE "config" ADD COLUMN "timezone" text DEFAULT 'Asia/Kolkata' NOT NULL;--> statement-breakpoint
ALTER TABLE "config" ADD COLUMN "delivery_hour" integer DEFAULT 6 NOT NULL;--> statement-breakpoint
ALTER TABLE "config" ADD COLUMN "delivery_minute" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "config" ADD COLUMN "frequency" "frequency" DEFAULT 'daily' NOT NULL;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;