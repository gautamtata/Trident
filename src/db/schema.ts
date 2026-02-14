import { boolean, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Enums
export const topicTypeEnum = pgEnum('topic_type', ['vertical', 'company', 'keyword']);
export const digestStatusEnum = pgEnum('digest_status', ['sent', 'failed']);
export const frequencyEnum = pgEnum('frequency', ['daily', 'weekdays', 'weekly']);

// Topics - verticals, companies, or keywords to track
export const topics = pgTable('topics', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  type: topicTypeEnum('type').notNull().default('keyword'),
  searchQuery: text('search_query').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Companies - companies to monitor for news/updates
export const companies = pgTable('companies', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  domain: text('domain'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Articles - every result found and deduped by URL
export const articles = pgTable('articles', {
  id: uuid('id').defaultRandom().primaryKey(),
  topicId: uuid('topic_id').references(() => topics.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  url: text('url').notNull().unique(),
  title: text('title').notNull(),
  summary: text('summary'),
  source: text('source'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  foundAt: timestamp('found_at', { withTimezone: true }).notNull().defaultNow(),
});

// Digests - history of sent email digests
export const digests = pgTable('digests', {
  id: uuid('id').defaultRandom().primaryKey(),
  sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
  recipientEmail: text('recipient_email').notNull(),
  articleCount: integer('article_count').notNull().default(0),
  status: digestStatusEnum('status').notNull().default('sent'),
});

// RSS Feeds - optional RSS sources linked to topics
export const feeds = pgTable('feeds', {
  id: uuid('id').defaultRandom().primaryKey(),
  url: text('url').notNull(),
  topicId: uuid('topic_id').references(() => topics.id, { onDelete: 'cascade' }).notNull(),
  lastChecked: timestamp('last_checked', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Config - single-row configuration table
export const config = pgTable('config', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull(),
  cronSchedule: text('cron_schedule').notNull().default('0 6 * * *'),
  timezone: text('timezone').notNull().default('Asia/Calcutta'),
  deliveryHour: integer('delivery_hour').notNull().default(6),
  deliveryMinute: integer('delivery_minute').notNull().default(0),
  frequency: frequencyEnum('frequency').notNull().default('daily'),
  maxArticlesPerDigest: integer('max_articles_per_digest').notNull().default(15),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
