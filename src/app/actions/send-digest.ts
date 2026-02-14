'use server';

import { and, eq, inArray } from 'drizzle-orm';
import React from 'react';
import { db } from '@/db';
import { articles, companies, config, digests, feeds, topics } from '@/db/schema';
import { searchTopic, searchCompany, type SearchResult } from '@/lib/exa';
import { fetchRSSFeed } from '@/lib/rss';
import { summarizeArticles, type ArticleForSummary } from '@/lib/agent';
import { DigestEmail } from '@/lib/email/digest-template';
import { sendDigestEmail } from '@/lib/resend';
import { revalidatePath } from 'next/cache';

interface TaggedResult extends SearchResult {
  topicId?: string;
  companyId?: string;
}

/**
 * Run the full digest pipeline on-demand.
 * Same logic as the Trigger.dev scheduled task but callable from the dashboard.
 */
export async function sendDigestNow(): Promise<{ success: boolean; message: string }> {
  // 1. Config
  const [cfg] = await db.select().from(config).limit(1);
  if (!cfg) {
    return { success: false, message: 'No config found. Save your settings first.' };
  }

  // 2. Active topics + companies
  const activeTopics = await db.select().from(topics).where(eq(topics.isActive, true));
  const activeCompanies = await db.select().from(companies).where(eq(companies.isActive, true));

  if (activeTopics.length === 0 && activeCompanies.length === 0) {
    return { success: false, message: 'No active topics or companies to search.' };
  }

  const allResults: TaggedResult[] = [];

  // 3. Search topics
  for (const topic of activeTopics) {
    try {
      let results: SearchResult[];
      if (topic.type === 'company') {
        results = await searchCompany(topic.searchQuery);
      } else {
        results = await searchTopic(topic.searchQuery);
      }
      for (const r of results) {
        allResults.push({ ...r, topicId: topic.id });
      }
    } catch (err) {
      console.error(`[Digest] Error searching topic "${topic.name}":`, err);
    }
  }

  // 3b. Search companies
  for (const company of activeCompanies) {
    try {
      const results = await searchCompany(company.name, 7, company.domain ?? undefined);
      for (const r of results) {
        allResults.push({ ...r, companyId: company.id });
      }
    } catch (err) {
      console.error(`[Digest] Error searching company "${company.name}":`, err);
    }
  }

  // 3c. RSS feeds
  const allFeeds = await db.select().from(feeds);
  for (const feed of allFeeds) {
    try {
      const rssResults = await fetchRSSFeed(feed.url, 5);
      for (const r of rssResults) {
        allResults.push({ ...r, topicId: feed.topicId });
      }
      await db.update(feeds).set({ lastChecked: new Date() }).where(eq(feeds.id, feed.id));
    } catch (err) {
      console.error(`[Digest] Error fetching RSS feed ${feed.url}:`, err);
    }
  }

  if (allResults.length === 0) {
    return { success: false, message: 'No results found from any source.' };
  }

  // 4. Dedup against articles already sent to this recipient
  const existingUrls = await db
    .select({ url: articles.url })
    .from(articles)
    .where(
      and(
        eq(articles.recipientEmail, cfg.email),
        inArray(articles.url, allResults.map((r) => r.url))
      )
    );

  const existingUrlSet = new Set(existingUrls.map((r) => r.url));
  const seenUrls = new Set<string>();
  const uniqueNewResults = allResults
    .filter((r) => !existingUrlSet.has(r.url))
    .filter((r) => {
      if (seenUrls.has(r.url)) return false;
      seenUrls.add(r.url);
      return true;
    });

  if (uniqueNewResults.length === 0) {
    return { success: false, message: 'All articles already seen. No new content to send.' };
  }

  const capped = uniqueNewResults.slice(0, cfg.maxArticlesPerDigest);

  // 5. AI summarize
  const contextParts = [
    ...activeTopics.map((t) => t.name),
    ...activeCompanies.map((c) => c.name),
  ];
  const digest = await summarizeArticles(
    capped.map((r): ArticleForSummary => ({
      title: r.title,
      url: r.url,
      source: r.source,
      text: r.text,
    })),
    contextParts.join(', ')
  );

  // 6. Store articles
  for (const result of capped) {
    try {
      await db.insert(articles).values({
        topicId: result.topicId ?? null,
        companyId: result.companyId ?? null,
        recipientEmail: cfg.email,
        url: result.url,
        title: result.title,
        summary: digest.articles.find((a) => a.url === result.url)?.summary ?? null,
        source: result.source,
        publishedAt: result.publishedDate ? new Date(result.publishedDate) : null,
      }).onConflictDoNothing();
    } catch (err) {
      console.error(`[Digest] Error storing article ${result.url}:`, err);
    }
  }

  // 7. Render + send email
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

  try {
    await sendDigestEmail(cfg.email, `Trident Digest — ${today}`, emailElement);

    await db.insert(digests).values({
      recipientEmail: cfg.email,
      articleCount: sortedArticles.length,
      status: 'sent',
    });

    revalidatePath('/');
    return {
      success: true,
      message: `Digest sent to ${cfg.email} with ${sortedArticles.length} articles.`,
    };
  } catch (err) {
    console.error('[Digest] Failed to send email:', err);

    await db.insert(digests).values({
      recipientEmail: cfg.email,
      articleCount: sortedArticles.length,
      status: 'failed',
    });

    revalidatePath('/');
    return { success: false, message: `Email failed to send: ${err}` };
  }
}
