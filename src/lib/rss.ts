import Parser from 'rss-parser';
import type { SearchResult } from './exa';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Trident/1.0 (RSS Reader)',
  },
});

/**
 * Fetch and parse an RSS feed, returning results in the same format
 * as Exa search results for seamless integration into the digest pipeline.
 */
export async function fetchRSSFeed(
  feedUrl: string,
  maxItems: number = 10
): Promise<SearchResult[]> {
  try {
    const feed = await parser.parseURL(feedUrl);

    const items = (feed.items ?? []).slice(0, maxItems);

    return items.map((item) => ({
      url: item.link ?? '',
      title: item.title ?? 'Untitled',
      text: item.contentSnippet ?? item.content ?? '',
      publishedDate: item.isoDate ?? item.pubDate ?? null,
      source: extractDomain(feedUrl),
    }));
  } catch (err) {
    console.error(`[RSS] Failed to fetch feed ${feedUrl}:`, err);
    return [];
  }
}

/**
 * Fetch multiple RSS feeds in parallel and combine results.
 */
export async function fetchMultipleFeeds(
  feedUrls: string[],
  maxItemsPerFeed: number = 5
): Promise<SearchResult[]> {
  const results = await Promise.allSettled(
    feedUrls.map((url) => fetchRSSFeed(url, maxItemsPerFeed))
  );

  return results.flatMap((result) =>
    result.status === 'fulfilled' ? result.value : []
  );
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'rss';
  }
}

// Curated RSS feeds for robotics industry
export const ROBOTICS_RSS_FEEDS = [
  'https://spectrum.ieee.org/feeds/topic/robotics.rss',
  'https://www.therobotreport.com/feed/',
  'https://techcrunch.com/category/robotics/feed/',
];
