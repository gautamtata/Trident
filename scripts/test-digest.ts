/**
 * Test script: runs the full digest pipeline once, bypassing Trigger.dev.
 *
 * Usage:
 *   bun run scripts/test-digest.ts
 *
 * What it does:
 *   1. Seeds a test company (NVIDIA) and topic (Robotics Industry) if DB is empty
 *   2. Ensures a config row exists (will prompt you to set RECIPIENT_EMAIL env var)
 *   3. Searches Exa for each company + topic
 *   4. Dedup + AI summarise
 *   5. Sends the digest email via Resend
 *   6. Logs the digest to DB
 *
 * Required env vars (in .env):
 *   DATABASE_URL, EXA_API_KEY, OPENAI_API_KEY, RESEND_API_KEY
 *
 * Optional:
 *   RECIPIENT_EMAIL  -- who to send the test digest to (defaults to config in DB)
 */

import 'dotenv/config';
import { eq, inArray } from 'drizzle-orm';
import React from 'react';
import { db } from '../src/db';
import { articles, companies, config, digests, topics } from '../src/db/schema';
import { searchTopic, searchCompany, type SearchResult } from '../src/lib/exa';
import { summarizeArticles, type ArticleForSummary } from '../src/lib/agent';
import { DigestEmail } from '../src/lib/email/digest-template';
import { sendDigestEmail } from '../src/lib/resend';

interface TaggedResult extends SearchResult {
  topicId?: string;
  companyId?: string;
}

async function ensureTestData() {
  // Seed a company if none exist
  const existingCompanies = await db.select().from(companies);
  if (existingCompanies.length === 0) {
    console.log('[Seed] No companies found. Adding NVIDIA as a test company...');
    await db.insert(companies).values({
      name: 'NVIDIA',
      domain: 'nvidia.com',
    });
  }

  // Seed a topic if none exist
  const existingTopics = await db.select().from(topics);
  if (existingTopics.length === 0) {
    console.log('[Seed] No topics found. Adding "Robotics Industry" as a test topic...');
    await db.insert(topics).values({
      name: 'Robotics Industry',
      type: 'vertical',
      searchQuery: 'latest robotics industry news developments and breakthroughs',
    });
  }

  // Ensure config row exists
  const [cfg] = await db.select().from(config).limit(1);
  const email = process.env.RECIPIENT_EMAIL;

  if (!cfg && !email) {
    console.error(
      '\n[Error] No config row and no RECIPIENT_EMAIL env var set.\n' +
      'Run with: RECIPIENT_EMAIL=you@example.com bun run scripts/test-digest.ts\n'
    );
    process.exit(1);
  }

  if (!cfg) {
    console.log(`[Seed] Creating config with email: ${email}`);
    await db.insert(config).values({ email: email! });
  } else if (email && cfg.email !== email) {
    console.log(`[Seed] Updating config email to: ${email}`);
    await db.update(config).set({ email }).where(eq(config.id, cfg.id));
  }
}

async function main() {
  console.log('=== Trident Test Digest ===\n');

  // Pre-flight checks
  const missing = ['DATABASE_URL', 'EXA_API_KEY', 'OPENAI_API_KEY', 'RESEND_API_KEY']
    .filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(`[Error] Missing env vars: ${missing.join(', ')}`);
    process.exit(1);
  }

  await ensureTestData();

  // 1. Load config
  const [cfg] = await db.select().from(config).limit(1);
  console.log(`\n[Config] Sending digest to: ${cfg.email}`);
  console.log(`[Config] Max articles: ${cfg.maxArticlesPerDigest}\n`);

  // 2. Load active topics + companies
  const activeTopics = await db.select().from(topics).where(eq(topics.isActive, true));
  const activeCompanies = await db.select().from(companies).where(eq(companies.isActive, true));

  console.log(`[Pipeline] ${activeTopics.length} active topics, ${activeCompanies.length} active companies\n`);

  const allResults: TaggedResult[] = [];

  // 3. Search topics
  for (const topic of activeTopics) {
    try {
      console.log(`[Search] Topic: "${topic.name}" (${topic.type})...`);
      let results: SearchResult[];
      if (topic.type === 'company') {
        results = await searchCompany(topic.searchQuery);
      } else {
        results = await searchTopic(topic.searchQuery);
      }
      console.log(`  -> Found ${results.length} results`);
      for (const r of results) {
        allResults.push({ ...r, topicId: topic.id });
      }
    } catch (err) {
      console.error(`  -> Error: ${err}`);
    }
  }

  // 4. Search companies
  for (const company of activeCompanies) {
    try {
      console.log(`[Search] Company: "${company.name}"${company.domain ? ` (${company.domain})` : ''}...`);
      const results = await searchCompany(company.name, 7, company.domain ?? undefined);
      console.log(`  -> Found ${results.length} results`);
      for (const r of results) {
        allResults.push({ ...r, companyId: company.id });
      }
    } catch (err) {
      console.error(`  -> Error: ${err}`);
    }
  }

  if (allResults.length === 0) {
    console.log('\n[Pipeline] No results found. Nothing to do.');
    process.exit(0);
  }

  // 5. Dedup
  const existingUrls = await db
    .select({ url: articles.url })
    .from(articles)
    .where(inArray(articles.url, allResults.map((r) => r.url)));

  const existingUrlSet = new Set(existingUrls.map((r) => r.url));
  const seenUrls = new Set<string>();
  const uniqueNewResults = allResults
    .filter((r) => !existingUrlSet.has(r.url))
    .filter((r) => {
      if (seenUrls.has(r.url)) return false;
      seenUrls.add(r.url);
      return true;
    });

  console.log(`\n[Dedup] ${uniqueNewResults.length} new articles (${allResults.length} total found)`);

  if (uniqueNewResults.length === 0) {
    console.log('[Pipeline] All articles already seen. Nothing new to send.');
    process.exit(0);
  }

  const capped = uniqueNewResults.slice(0, cfg.maxArticlesPerDigest);

  // 6. AI summarize
  const contextParts = [
    ...activeTopics.map((t) => t.name),
    ...activeCompanies.map((c) => c.name),
  ];
  const topicContext = contextParts.join(', ');

  const articlesForSummary: ArticleForSummary[] = capped.map((r) => ({
    title: r.title,
    url: r.url,
    source: r.source,
    text: r.text,
  }));

  console.log(`\n[AI] Summarizing ${capped.length} articles...`);
  const digest = await summarizeArticles(articlesForSummary, topicContext);
  console.log(`[AI] Executive briefing: "${digest.executiveBriefing.slice(0, 120)}..."`);

  // 7. Store articles
  for (const result of capped) {
    try {
      await db.insert(articles).values({
        topicId: result.topicId ?? null,
        companyId: result.companyId ?? null,
        url: result.url,
        title: result.title,
        summary: digest.articles.find((a) => a.url === result.url)?.summary ?? null,
        source: result.source,
        publishedAt: result.publishedDate ? new Date(result.publishedDate) : null,
      }).onConflictDoNothing();
    } catch (err) {
      console.error(`[DB] Error storing ${result.url}:`, err);
    }
  }
  console.log(`[DB] Stored ${capped.length} articles`);

  // 8. Send email
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const sortedArticles = digest.articles.toSorted(
    (a, b) => b.relevanceScore - a.relevanceScore
  );

  const allTrackedNames = [
    ...activeTopics.map((t) => t.name),
    ...activeCompanies.map((c) => c.name),
  ];

  const emailElement = React.createElement(DigestEmail, {
    executiveBriefing: digest.executiveBriefing,
    articles: sortedArticles,
    date: today,
    topicNames: allTrackedNames,
  });

  console.log(`\n[Email] Sending digest to ${cfg.email}...`);
  try {
    await sendDigestEmail(cfg.email, `Trident Digest — ${today}`, emailElement);

    await db.insert(digests).values({
      recipientEmail: cfg.email,
      articleCount: sortedArticles.length,
      status: 'sent',
    });

    console.log(`[Email] Sent! ${sortedArticles.length} articles in digest.`);
  } catch (err) {
    console.error('[Email] Failed to send:', err);

    await db.insert(digests).values({
      recipientEmail: cfg.email,
      articleCount: sortedArticles.length,
      status: 'failed',
    });
  }

  // Print summary
  console.log('\n=== Summary ===');
  console.log(`Topics: ${activeTopics.map((t) => t.name).join(', ') || 'none'}`);
  console.log(`Companies: ${activeCompanies.map((c) => c.name).join(', ') || 'none'}`);
  console.log(`Articles found: ${allResults.length}`);
  console.log(`New (after dedup): ${uniqueNewResults.length}`);
  console.log(`Sent: ${sortedArticles.length}`);
  console.log(`Recipient: ${cfg.email}`);
  console.log('\nDone!');

  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
