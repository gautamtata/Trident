import Exa from 'exa-js';

const exa = new Exa(process.env.EXA_API_KEY);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SearchResult {
  url: string;
  title: string;
  text: string;
  highlights: string[];
  exaSummary: string | null;
  publishedDate: string | null;
  source: string | null;
}

/** Shape returned by Exa when contents (text/highlights/summary) are requested. */
interface ExaResultWithContents {
  url: string;
  title?: string | null;
  text?: string | null;
  highlights?: string[] | null;
  summary?: string | null;
  publishedDate?: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDateNDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

/**
 * Build a reusable Exa `contents` config with capped text, highlights,
 * and an optional topic-aware summary.
 */
function buildContents(summaryQuery?: string) {
  return {
    text: { maxCharacters: 3000 },
    highlights: { maxCharacters: 500 },
    ...(summaryQuery ? { summary: { query: summaryQuery } } : {}),
  };
}

/** Normalize an Exa result into our SearchResult shape. */
function normalizeResult(r: ExaResultWithContents): SearchResult {
  return {
    url: r.url,
    title: r.title ?? 'Untitled',
    text: r.text ?? '',
    highlights: r.highlights ?? [],
    exaSummary: r.summary ?? null,
    publishedDate: r.publishedDate ?? null,
    source: extractDomain(r.url),
  };
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

// ---------------------------------------------------------------------------
// Search functions
// ---------------------------------------------------------------------------

/**
 * Search for a topic using Exa.
 * Returns normalized results with text, highlights, and Exa-generated summaries.
 */
export async function searchTopic(
  query: string,
  daysBack: number = 3
): Promise<SearchResult[]> {
  const response = await exa.search(query, {
    type: 'auto',
    numResults: 10,
    startPublishedDate: getDateNDaysAgo(daysBack),
    contents: buildContents(`Key developments about ${query}`),
  });

  return (response.results as ExaResultWithContents[]).map(normalizeResult);
}

/**
 * Search specifically for recent news articles.
 * Uses Exa's `category: "news"` for fresher, news-focused results.
 * Best for time-sensitive developments, announcements, and breaking news.
 */
export async function searchNews(
  query: string,
  daysBack: number = 3
): Promise<SearchResult[]> {
  const response = await exa.search(query, {
    type: 'auto',
    category: 'news',
    numResults: 10,
    startPublishedDate: getDateNDaysAgo(daysBack),
    contents: buildContents(`Latest news: ${query}`),
  });

  return (response.results as ExaResultWithContents[]).map(normalizeResult);
}

/**
 * Search for company-specific news.
 *
 * Strategy (two to three complementary searches):
 *  1. Recent news search -- standard `type:"auto"` with date filter to get
 *     fresh articles *about* the company.
 *  2. Company profile search -- `category:"company"` (no date/domain filters
 *     allowed by Exa for this category) to surface the company's own pages.
 *  3. (Optional) Domain-scoped search -- pulls content directly from the
 *     company's website when a domain is provided.
 */
export async function searchCompany(
  companyName: string,
  daysBack: number = 7,
  domain?: string
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const seen = new Set<string>();

  const push = (r: SearchResult) => {
    if (seen.has(r.url)) return;
    seen.add(r.url);
    results.push(r);
  };

  const summaryQuery = `Key developments and news about ${companyName}`;

  // 1. Recent news about the company (date-filtered, standard search)
  try {
    const newsResponse = await exa.search(
      `${companyName} latest news announcements funding product launches`,
      {
        type: 'auto',
        numResults: 10,
        startPublishedDate: getDateNDaysAgo(daysBack),
        contents: buildContents(summaryQuery),
      }
    );
    for (const r of newsResponse.results) push(normalizeResult(r as ExaResultWithContents));
  } catch (err) {
    console.warn(`[Exa] News search failed for "${companyName}":`, err);
  }

  // 2. Company profile search (category:"company" -- no date filters allowed)
  try {
    const companyResponse = await exa.search(
      companyName,
      {
        type: 'auto',
        category: 'company',
        numResults: 5,
        contents: buildContents(summaryQuery),
      }
    );
    for (const r of companyResponse.results) push(normalizeResult(r as ExaResultWithContents));
  } catch (err) {
    console.warn(`[Exa] Company category search failed for "${companyName}":`, err);
  }

  // 3. Domain-scoped search (content from the company's own website)
  if (domain) {
    try {
      const domainResponse = await exa.search(
        `${companyName} news updates`,
        {
          type: 'auto',
          numResults: 5,
          includeDomains: [domain],
          startPublishedDate: getDateNDaysAgo(daysBack),
          contents: buildContents(summaryQuery),
        }
      );
      for (const r of domainResponse.results) push(normalizeResult(r as ExaResultWithContents));
    } catch (err) {
      console.warn(`[Exa] Domain search failed for ${domain}:`, err);
    }
  }

  return results;
}
