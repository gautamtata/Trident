import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { and, eq, inArray } from 'drizzle-orm';
import React from 'react';
import { db } from '@/db';
import { articles, companies, digests, feeds, topics } from '@/db/schema';
import { type SearchResult } from '@/lib/exa';
import { fetchRSSFeed } from '@/lib/rss';
import { createResearchAgent, summarizeArticles, type ArticleForSummary } from '@/lib/agent';
import { DigestEmail } from '@/lib/email/digest-template';
import { sendDigestEmail } from '@/lib/resend';
import { digestConfig } from '@/lib/digest-config';

interface TaggedResult extends SearchResult {
  topicId?: string;
  companyId?: string;
}

async function handler(_req: Request) {
  console.log(`[Digest] Starting digest run at ${new Date().toISOString()}`);

  const { recipients, maxArticlesPerDigest } = digestConfig;

  // 1. Fetch all active topics and companies
  const activeTopics = await db
    .select()
    .from(topics)
    .where(eq(topics.isActive, true));

  const activeCompanies = await db
    .select()
    .from(companies)
    .where(eq(companies.isActive, true));

  if (activeTopics.length === 0 && activeCompanies.length === 0) {
    console.log('[Digest] No active topics or companies. Skipping.');
    return new Response('No active topics or companies', { status: 200 });
  }

  console.log(
    `[Digest] Processing ${activeTopics.length} topics + ${activeCompanies.length} companies`
  );

  // 2. Research each topic and company using AI agents (parallel)
  const researchPromises = [
    ...activeTopics.map(async (topic): Promise<TaggedResult[]> => {
      try {
        const { agent, collectedResults } = createResearchAgent();

        const prompt =
          topic.type === 'company'
            ? `Research the company "${topic.name}". Find recent news, product launches, funding, and competitive developments. Search query hint: ${topic.searchQuery}`
            : `Research the topic "${topic.name}". Find the most important recent developments, breakthroughs, and news. Search query hint: ${topic.searchQuery}`;

        await agent.generate({ prompt });

        console.log(
          `[Digest] Agent found ${collectedResults.length} results for topic "${topic.name}"`
        );
        return collectedResults.map((r) => ({ ...r, topicId: topic.id }));
      } catch (err) {
        console.error(`[Digest] Error researching topic "${topic.name}":`, err);
        return [];
      }
    }),

    ...activeCompanies.map(async (company): Promise<TaggedResult[]> => {
      try {
        const { agent, collectedResults } = createResearchAgent();

        const domainHint = company.domain
          ? ` Their website is ${company.domain}.`
          : '';

        await agent.generate({
          prompt: `Research the company "${company.name}".${domainHint} Find recent news, announcements, product launches, funding rounds, and strategic developments.`,
        });

        console.log(
          `[Digest] Agent found ${collectedResults.length} results for company "${company.name}"`
        );
        return collectedResults.map((r) => ({ ...r, companyId: company.id }));
      } catch (err) {
        console.error(
          `[Digest] Error researching company "${company.name}":`,
          err
        );
        return [];
      }
    }),
  ];

  const researchResults = await Promise.all(researchPromises);
  const allResults: TaggedResult[] = researchResults.flat();

  // 2b. Also fetch from any RSS feeds linked to topics
  const allFeeds = await db.select().from(feeds);
  for (const feed of allFeeds) {
    try {
      const rssResults = await fetchRSSFeed(feed.url, 5);
      console.log(`[Digest] Found ${rssResults.length} RSS items from ${feed.url}`);
      for (const r of rssResults) {
        allResults.push({ ...r, topicId: feed.topicId });
      }
      await db.update(feeds).set({ lastChecked: new Date() }).where(eq(feeds.id, feed.id));
    } catch (err) {
      console.error(`[Digest] Error fetching RSS feed ${feed.url}:`, err);
    }
  }

  if (allResults.length === 0) {
    console.log('[Digest] No results found across all sources. Skipping.');
    return new Response('No results found', { status: 200 });
  }

  // 3. Dedup against previously stored articles for all recipients
  const existingUrls = await db
    .select({ url: articles.url })
    .from(articles)
    .where(
      and(
        inArray(articles.recipientEmail, [...recipients]),
        inArray(
          articles.url,
          allResults.map((r) => r.url)
        )
      )
    );

  const existingUrlSet = new Set(existingUrls.map((r) => r.url));
  const newResults = allResults.filter((r) => !existingUrlSet.has(r.url));

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
    return new Response('All articles already seen', { status: 200 });
  }

  const capped = uniqueNewResults.slice(0, maxArticlesPerDigest);

  // 4. AI summarize & rank
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
    highlights: r.highlights,
    exaSummary: r.exaSummary,
  }));

  console.log('[Digest] Summarizing articles with AI (structured output)...');
  const digest = await summarizeArticles(articlesForSummary, topicContext);

  // 5. Store new articles in DB (one row per recipient for dedup tracking)
  for (const result of capped) {
    for (const recipientEmail of recipients) {
      try {
        await db.insert(articles).values({
          topicId: result.topicId ?? null,
          companyId: result.companyId ?? null,
          recipientEmail,
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
  }

  // 6. Render email & send
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
    await sendDigestEmail(
      [...recipients],
      `Industry Deep Search — Digest — ${today}`,
      emailElement
    );

    for (const recipientEmail of recipients) {
      await db.insert(digests).values({
        recipientEmail,
        articleCount: sortedArticles.length,
        status: 'sent',
      });
    }

    console.log(`[Digest] Successfully sent digest with ${sortedArticles.length} articles to ${recipients.join(', ')}`);
    return new Response(`Sent ${sortedArticles.length} articles to ${recipients.join(', ')}`, { status: 200 });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('[Digest] Failed to send email:', errorMessage);

    for (const recipientEmail of recipients) {
      await db.insert(digests).values({
        recipientEmail,
        articleCount: sortedArticles.length,
        status: 'failed',
        error: errorMessage.slice(0, 500),
      });
    }

    return new Response(`Failed to send email: ${errorMessage}`, { status: 500 });
  }
}

// QStash signature verification — only QStash can call this endpoint
export const POST = verifySignatureAppRouter(handler);
