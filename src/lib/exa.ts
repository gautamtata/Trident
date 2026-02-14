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
 * Search for company-specific news using domain filtering.
 */
export async function searchCompany(
  companyName: string,
  daysBack: number = 7
): Promise<SearchResult[]> {
  const response = await exa.searchAndContents(
    `${companyName} latest news announcements`,
    {
      type: 'auto',
      numResults: 10,
      text: true,
      startPublishedDate: getDateNDaysAgo(daysBack),
    }
  );

  return response.results.map((r) => ({
    url: r.url,
    title: r.title ?? 'Untitled',
    text: r.text ?? '',
    publishedDate: r.publishedDate ?? null,
    source: extractDomain(r.url),
  }));
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}
