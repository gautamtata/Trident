import { schedules } from '@trigger.dev/sdk/v3';
import { eq, inArray } from 'drizzle-orm';
import React from 'react';
import { db } from '../db';
import { articles, config, digests, feeds, topics } from '../db/schema';
import { searchTopic, searchCompany, type SearchResult } from '../lib/exa';
import { fetchRSSFeed } from '../lib/rss';
import { summarizeArticles, type ArticleForSummary } from '../lib/agent';
import { DigestEmail } from '../lib/email/digest-template';
import { sendDigestEmail } from '../lib/resend';

export const dailyDigest = schedules.task({
  id: 'daily-digest',
  cron: '0 7 * * 1-5', // Weekday mornings at 7am UTC
  run: async (payload) => {
    console.log(`[Digest] Starting digest run at ${payload.timestamp.toISOString()}`);

    // 1. Fetch config
    const [cfg] = await db.select().from(config).limit(1);
    if (!cfg) {
      console.log('[Digest] No config found. Skipping.');
      return;
    }

    // 2. Fetch all active topics
    const activeTopics = await db
      .select()
      .from(topics)
      .where(eq(topics.isActive, true));

    if (activeTopics.length === 0) {
      console.log('[Digest] No active topics. Skipping.');
      return;
    }

    console.log(`[Digest] Processing ${activeTopics.length} active topics`);

    // 3. Search for each topic via Exa
    const allResults: Array<SearchResult & { topicId: string }> = [];

    for (const topic of activeTopics) {
      try {
        let results: SearchResult[];
        if (topic.type === 'company') {
          results = await searchCompany(topic.searchQuery);
        } else {
          results = await searchTopic(topic.searchQuery);
        }

        console.log(`[Digest] Found ${results.length} results for "${topic.name}"`);

        for (const r of results) {
          allResults.push({ ...r, topicId: topic.id });
        }
      } catch (err) {
        console.error(`[Digest] Error searching topic "${topic.name}":`, err);
      }
    }

    // 3b. Also fetch from any RSS feeds linked to topics
    const allFeeds = await db.select().from(feeds);
    for (const feed of allFeeds) {
      try {
        const rssResults = await fetchRSSFeed(feed.url, 5);
        console.log(`[Digest] Found ${rssResults.length} RSS items from ${feed.url}`);
        for (const r of rssResults) {
          allResults.push({ ...r, topicId: feed.topicId });
        }
        // Update last checked timestamp
        await db.update(feeds).set({ lastChecked: new Date() }).where(eq(feeds.id, feed.id));
      } catch (err) {
        console.error(`[Digest] Error fetching RSS feed ${feed.url}:`, err);
      }
    }

    if (allResults.length === 0) {
      console.log('[Digest] No results found across all topics. Skipping.');
      return;
    }

    // 4. Dedup against previously stored articles
    const existingUrls = await db
      .select({ url: articles.url })
      .from(articles)
      .where(
        inArray(
          articles.url,
          allResults.map((r) => r.url)
        )
      );

    const existingUrlSet = new Set(existingUrls.map((r) => r.url));
    const newResults = allResults.filter((r) => !existingUrlSet.has(r.url));

    // Also dedup within the batch itself (same URL from multiple topics)
    const seenUrls = new Set<string>();
    const uniqueNewResults = newResults.filter((r) => {
      if (seenUrls.has(r.url)) return false;
      seenUrls.add(r.url);
      return true;
    });

    console.log(
      `[Digest] ${uniqueNewResults.length} new articles after dedup (${allResults.length} total found)`
    );

    if (uniqueNewResults.length === 0) {
      console.log('[Digest] All articles already seen. Skipping.');
      return;
    }

    // Cap to max articles per digest
    const capped = uniqueNewResults.slice(0, cfg.maxArticlesPerDigest);

    // 5. AI summarize & rank
    const topicContext = activeTopics.map((t) => t.name).join(', ');
    const articlesForSummary: ArticleForSummary[] = capped.map((r) => ({
      title: r.title,
      url: r.url,
      source: r.source,
      text: r.text,
    }));

    console.log('[Digest] Summarizing articles with AI...');
    const digest = await summarizeArticles(articlesForSummary, topicContext);

    // 6. Store new articles in DB
    for (const result of capped) {
      try {
        await db.insert(articles).values({
          topicId: result.topicId,
          url: result.url,
          title: result.title,
          summary:
            digest.articles.find((a) => a.url === result.url)?.summary ?? null,
          source: result.source,
          publishedAt: result.publishedDate
            ? new Date(result.publishedDate)
            : null,
        }).onConflictDoNothing();
      } catch (err) {
        console.error(`[Digest] Error storing article ${result.url}:`, err);
      }
    }

    // 7. Render email & send
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const sortedArticles = digest.articles.toSorted(
      (a, b) => b.relevanceScore - a.relevanceScore
    );

    const emailElement = React.createElement(DigestEmail, {
      executiveBriefing: digest.executiveBriefing,
      articles: sortedArticles,
      date: today,
      topicNames: activeTopics.map((t) => t.name),
    });

    try {
      await sendDigestEmail(
        cfg.email,
        `Trident Digest — ${today}`,
        emailElement
      );

      // 8. Log successful digest
      await db.insert(digests).values({
        recipientEmail: cfg.email,
        articleCount: sortedArticles.length,
        status: 'sent',
      });

      console.log(`[Digest] Successfully sent digest with ${sortedArticles.length} articles to ${cfg.email}`);
    } catch (err) {
      console.error('[Digest] Failed to send email:', err);

      await db.insert(digests).values({
        recipientEmail: cfg.email,
        articleCount: sortedArticles.length,
        status: 'failed',
      });
    }
  },
});
