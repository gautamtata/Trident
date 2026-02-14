import Exa from 'exa-js';

const exa = new Exa(process.env.EXA_API_KEY);

export interface SearchResult {
  url: string;
  title: string;
  text: string;
  publishedDate: string | null;
  source: string | null;
}

function getDateNDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

/**
 * Search for a topic using Exa's searchAndContents.
 * Returns normalized results with text content for AI summarization.
 */
export async function searchTopic(
  query: string,
  daysBack: number = 3
): Promise<SearchResult[]> {
  const response = await exa.searchAndContents(query, {
    type: 'auto',
    numResults: 10,
    text: true,
    startPublishedDate: getDateNDaysAgo(daysBack),
  });

  return response.results.map((r) => ({
    url: r.url,
    title: r.title ?? 'Untitled',
    text: r.text ?? '',
    publishedDate: r.publishedDate ?? null,
    source: extractDomain(r.url),
  }));
}

/**
 * Search for company-specific news.
 *
 * Strategy (two complementary searches):
 *  1. Recent news search -- standard `type:"auto"` with date filter to get
 *     fresh articles *about* the company.
 *  2. Company profile search -- `category:"company"` (no date/domain filters
 *     allowed by Exa for this category) to surface the company's own pages.
 *
 * If a domain is provided, a third domain-scoped search pulls content
 * directly from the company's website.
 */
export async function searchCompany(
  companyName: string,
  daysBack: number = 7,
  domain?: string
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const seen = new Set<string>();

  const push = (r: { url: string; title?: string | null; text?: string | null; publishedDate?: string | null }) => {
    if (seen.has(r.url)) return;
    seen.add(r.url);
    results.push({
      url: r.url,
      title: r.title ?? 'Untitled',
      text: r.text ?? '',
      publishedDate: r.publishedDate ?? null,
      source: extractDomain(r.url),
    });
  };

  // 1. Recent news about the company (date-filtered, standard search)
  try {
    const newsResponse = await exa.searchAndContents(
      `${companyName} latest news announcements funding product launches`,
      {
        type: 'auto',
        numResults: 10,
        text: true,
        startPublishedDate: getDateNDaysAgo(daysBack),
      }
    );
    for (const r of newsResponse.results) push(r);
  } catch (err) {
    console.warn(`[Exa] News search failed for "${companyName}":`, err);
  }

  // 2. Company profile search (category:"company" -- no date filters allowed)
  try {
    const companyResponse = await exa.searchAndContents(
      companyName,
      {
        type: 'auto',
        category: 'company' as never,
        numResults: 5,
        text: true,
      }
    );
    for (const r of companyResponse.results) push(r);
  } catch (err) {
    console.warn(`[Exa] Company category search failed for "${companyName}":`, err);
  }

  // 3. Domain-scoped search (content from the company's own website)
  if (domain) {
    try {
      const domainResponse = await exa.searchAndContents(
        `${companyName} news updates`,
        {
          type: 'auto',
          numResults: 5,
          text: true,
          includeDomains: [domain],
          startPublishedDate: getDateNDaysAgo(daysBack),
        }
      );
      for (const r of domainResponse.results) push(r);
    } catch (err) {
      console.warn(`[Exa] Domain search failed for ${domain}:`, err);
    }
  }

  return results;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}
