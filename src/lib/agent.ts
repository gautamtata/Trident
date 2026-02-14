import { ToolLoopAgent, tool, stepCountIs, generateText, Output } from 'ai';
import { z } from 'zod';
import { searchTopic, searchCompany, searchNews, type SearchResult } from './exa';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns a human-readable date string for injecting into prompts. */
function currentDateString(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// 1. Research Agent Factory
// ---------------------------------------------------------------------------
//
// Creates a fresh research agent with the current date baked into its
// instructions. Returns the agent instance AND a mutable array that the
// tool closures push raw SearchResults into, so the caller can access them
// for dedup / storage without parsing the agent's text output.
// ---------------------------------------------------------------------------

export function createResearchAgent() {
  const collectedResults: SearchResult[] = [];

  const agent = new ToolLoopAgent({
    model: 'google/gemini-3-pro-preview',
    instructions: `You are an industry intelligence analyst. Today is ${currentDateString()}.

Your job is to find the most important recent developments, news, and insights
for the research task you are given.

Methodology:
1. Break the topic into 2-4 specific, targeted sub-queries that cover different
   angles (e.g. product launches, funding, market trends, technical breakthroughs).
2. Use searchWeb for general research and technical content, searchNews for
   time-sensitive news and announcements, and searchCompanyNews for company-
   specific intelligence.
3. Review the results you get back. If coverage feels thin on an important angle,
   do one more targeted search.
4. When you have sufficient coverage, stop searching. Do NOT summarize — just
   confirm you've completed your research.

Be specific in your queries. Instead of "AI news", search for "LLM inference
cost reduction 2026" or "OpenAI GPT-5 announcement". Specificity yields
better results.`,
    tools: {
      searchWeb: tool({
        description:
          'Search the web for recent articles, blog posts, and research. Best for broad or technical topics.',
        inputSchema: z.object({
          query: z.string().describe('A specific, targeted search query'),
          daysBack: z
            .number()
            .optional()
            .describe('How many days back to search (default 3)'),
        }),
        execute: async ({ query, daysBack }) => {
          const results = await searchTopic(query, daysBack ?? 3);
          collectedResults.push(...results);
          return results.map((r) => ({
            url: r.url,
            title: r.title,
            source: r.source,
            publishedDate: r.publishedDate,
            highlights: r.highlights,
            summary: r.exaSummary,
          }));
        },
      }),

      searchNews: tool({
        description:
          'Search specifically for recent news articles. Best for time-sensitive developments, announcements, and breaking news.',
        inputSchema: z.object({
          query: z.string().describe('A specific news search query'),
          daysBack: z
            .number()
            .optional()
            .describe('How many days back to search (default 3)'),
        }),
        execute: async ({ query, daysBack }) => {
          const results = await searchNews(query, daysBack ?? 3);
          collectedResults.push(...results);
          return results.map((r) => ({
            url: r.url,
            title: r.title,
            source: r.source,
            publishedDate: r.publishedDate,
            highlights: r.highlights,
            summary: r.exaSummary,
          }));
        },
      }),

      searchCompanyNews: tool({
        description:
          'Search for news, announcements, and updates about a specific company. Includes company profile results.',
        inputSchema: z.object({
          companyName: z.string().describe('The company name to search for'),
          domain: z
            .string()
            .optional()
            .describe(
              'Optional company domain (e.g. openai.com) for domain-scoped results'
            ),
        }),
        execute: async ({ companyName, domain }) => {
          const results = await searchCompany(companyName, 7, domain);
          collectedResults.push(...results);
          return results.map((r) => ({
            url: r.url,
            title: r.title,
            source: r.source,
            publishedDate: r.publishedDate,
            highlights: r.highlights,
            summary: r.exaSummary,
          }));
        },
      }),
    },
    stopWhen: stepCountIs(5),
  });

  return { agent, collectedResults };
}

// ---------------------------------------------------------------------------
// 2. Summarizer – structured output via Output.object(), no JSON parsing
// ---------------------------------------------------------------------------

const digestSummarySchema = z.object({
  executiveBriefing: z
    .string()
    .describe(
      'A 2-3 sentence executive summary highlighting the most important developments and takeaways'
    ),
  articles: z
    .array(
      z.object({
        title: z.string(),
        url: z.string(),
        source: z.string().nullable(),
        summary: z
          .string()
          .describe(
            '2-3 sentence insightful summary — go beyond restating the title'
          ),
        relevanceScore: z
          .number()
          .min(1)
          .max(10)
          .describe('Relevance score: 10 = most relevant, 1 = least'),
      })
    )
    .describe('All articles ranked by relevance score descending'),
});

export interface ArticleForSummary {
  title: string;
  url: string;
  source: string | null;
  text: string;
  highlights?: string[];
  exaSummary?: string | null;
}

/** Infer DigestSummary from the Zod schema so types stay in sync. */
export type DigestSummary = z.infer<typeof digestSummarySchema>;

export async function summarizeArticles(
  articles: ArticleForSummary[],
  topicContext: string
): Promise<DigestSummary> {
  const articleList = articles
    .map((a, i) => {
      const parts = [
        `[Article ${i + 1}]`,
        `Title: ${a.title}`,
        `Source: ${a.source ?? 'unknown'}`,
        `URL: ${a.url}`,
      ];

      // Prefer Exa summary > highlights > raw text for richer context
      if (a.exaSummary) {
        parts.push(`Summary: ${a.exaSummary}`);
      }
      if (a.highlights && a.highlights.length > 0) {
        parts.push(`Key excerpts: ${a.highlights.join(' … ')}`);
      }
      // Always include some raw text for depth
      parts.push(`Content: ${a.text.slice(0, 1500)}`);

      return parts.join('\n');
    })
    .join('\n---\n');

  const { output } = await generateText({
    model: 'google/gemini-3-pro-preview',
    output: Output.object({
      schema: digestSummarySchema,
    }),
    system: `You are an industry intelligence analyst preparing a daily digest.
Today is ${currentDateString()}.

Rules:
- Rank articles by relevance (10 = most relevant, 1 = least).
- Include ALL articles in your output, sorted by relevance score descending.
- Write summaries that are insightful, not just restatements of headlines.
- The executive briefing should highlight the 2-3 most important takeaways across all articles.`,
    prompt: `Prepare a digest about: ${topicContext}

Here are the articles found today:

${articleList}`,
  });

  return output;
}
