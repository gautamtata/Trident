import { ToolLoopAgent, tool, stepCountIs, generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { searchTopic, searchCompany, type SearchResult } from './exa';

// ---------------------------------------------------------------------------
// 1. Agentic search – the AI decides what to search for
// ---------------------------------------------------------------------------

export const researchAgent = new ToolLoopAgent({
  model: openai('gpt-4o-mini'),
  instructions: `You are an industry intelligence analyst. Given a broad topic, 
you proactively search for the most important recent developments, news, and insights.
Break the topic into specific sub-queries and search for each. 
For company topics, search for the company specifically.
Return all the raw results you find — do not summarize yet.`,
  tools: {
    searchWeb: tool({
      description: 'Search the web for recent articles on a topic. Use specific, targeted queries.',
      inputSchema: z.object({
        query: z.string().describe('The search query'),
        daysBack: z.number().optional().describe('How many days back to search (default 3)'),
      }),
      execute: async ({ query, daysBack }) => {
        const results = await searchTopic(query, daysBack ?? 3);
        return results.map((r) => ({
          url: r.url,
          title: r.title,
          source: r.source,
          publishedDate: r.publishedDate,
          textPreview: r.text.slice(0, 500),
        }));
      },
    }),
    searchCompanyNews: tool({
      description: 'Search for recent news about a specific company.',
      inputSchema: z.object({
        companyName: z.string().describe('The company name to search for'),
      }),
      execute: async ({ companyName }) => {
        const results = await searchCompany(companyName);
        return results.map((r) => ({
          url: r.url,
          title: r.title,
          source: r.source,
          publishedDate: r.publishedDate,
          textPreview: r.text.slice(0, 500),
        }));
      },
    }),
  },
  stopWhen: stepCountIs(10),
});

// ---------------------------------------------------------------------------
// 2. Summarizer – takes raw articles, returns ranked summaries + briefing
// ---------------------------------------------------------------------------

export interface ArticleForSummary {
  title: string;
  url: string;
  source: string | null;
  text: string;
}

export interface DigestSummary {
  executiveBriefing: string;
  articles: Array<{
    title: string;
    url: string;
    source: string | null;
    summary: string;
    relevanceScore: number;
  }>;
}

export async function summarizeArticles(
  articles: ArticleForSummary[],
  topicContext: string
): Promise<DigestSummary> {
  const articleList = articles
    .map(
      (a, i) =>
        `[Article ${i + 1}]\nTitle: ${a.title}\nSource: ${a.source}\nURL: ${a.url}\nContent: ${a.text.slice(0, 1500)}\n`
    )
    .join('\n---\n');

  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    prompt: `You are an industry intelligence analyst preparing a digest about: ${topicContext}

Here are the articles found today:

${articleList}

Please produce a JSON response with this exact structure:
{
  "executiveBriefing": "A 2-3 sentence executive summary of the most important developments",
  "articles": [
    {
      "title": "Article title",
      "url": "article url",
      "source": "domain",
      "summary": "2-3 sentence summary of this article's key insights",
      "relevanceScore": 8
    }
  ]
}

Rules:
- Rank articles by relevance (10 = most relevant, 1 = least)
- Include ALL articles, sorted by relevance score descending
- Write summaries that are insightful, not just restatements of the title
- The executive briefing should highlight the 2-3 most important takeaways
- Return ONLY valid JSON, no markdown fences`,
  });

  try {
    const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned) as DigestSummary;
  } catch {
    // Fallback if parsing fails
    return {
      executiveBriefing: 'Unable to generate executive briefing. See individual articles below.',
      articles: articles.map((a) => ({
        title: a.title,
        url: a.url,
        source: a.source,
        summary: 'Summary unavailable.',
        relevanceScore: 5,
      })),
    };
  }
}
