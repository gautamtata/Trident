ALTER TABLE "articles" DROP CONSTRAINT "articles_url_unique";--> statement-breakpoint
ALTER TABLE "config" ALTER COLUMN "timezone" SET DEFAULT 'Asia/Calcutta';--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "recipient_email" text;--> statement-breakpoint
UPDATE "articles" SET "recipient_email" = COALESCE((SELECT "email" FROM "config" LIMIT 1), 'unknown@example.com') WHERE "recipient_email" IS NULL;--> statement-breakpoint
ALTER TABLE "articles" ALTER COLUMN "recipient_email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_url_recipient_unique" UNIQUE("url","recipient_email");
