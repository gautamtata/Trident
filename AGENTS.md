# Trident

AI-powered industry intelligence digests. Searches the web, summarizes with AI, and delivers curated email digests on a schedule. Built as a personal tool -- no auth, single-user.

## Tech Stack

- **Next.js 16** (App Router) -- dashboard UI and server actions
- **Vercel AI SDK v6** (`ai`) -- `ToolLoopAgent` for agentic search, `generateText` for summarization
- **@ai-sdk/openai** -- OpenAI provider (gpt-4o-mini)
- **Trigger.dev v4** (`@trigger.dev/sdk`) -- scheduled cron tasks for the digest pipeline
- **Exa** (`exa-js`) -- web search API (`searchAndContents`) for finding articles and news
- **Resend** + **React Email** (`@react-email/components`) -- email delivery with JSX templates
- **Drizzle ORM** + **PostgreSQL** (Supabase) -- database with `node-postgres` driver
- **Tailwind CSS v4** + **shadcn/ui** (`radix-ui`) -- dashboard components
- **rss-parser** -- optional RSS feed ingestion
- **Zod v4** -- schema validation for AI tool inputs
- **Bun and Bunx** -- Package manager

## Project Structure

```
src/
  app/
    page.tsx              # Dashboard (server component, force-dynamic)
    layout.tsx            # Root layout (light mode, Geist font)
    actions/
      topics.ts           # Server actions: CRUD for topics
      companies.ts        # Server actions: CRUD for companies
      config.ts           # Server actions: upsert config (schedule, email) + Trigger.dev schedule sync
      digests.ts          # Server actions: fetch digest history
  components/
    topic-form.tsx        # Client: dialog to add a new topic
    topic-list.tsx        # Client: list topics with pause/resume/delete
    company-form.tsx      # Client: dialog to add a company (name + optional domain)
    company-list.tsx      # Client: list companies with pause/resume/delete
    config-form.tsx       # Client: settings form (timezone, time, frequency, email)
    digest-history.tsx    # Server: table of past digest sends
    ui/                   # shadcn/ui primitives (button, card, table, badge, etc.)
  db/
    schema.ts             # Drizzle schema: topics, companies, articles, feeds, digests, config
    index.ts              # DB connection (node-postgres, Supabase SSL)
    migrate.ts            # Migration runner
    migrations/           # Generated SQL migrations
  lib/
    exa.ts                # Exa search wrapper (searchTopic, searchCompany)
    agent.ts              # AI agent (ToolLoopAgent) + summarizeArticles (generateText)
    resend.ts             # Resend email send wrapper
    rss.ts                # RSS feed fetcher (rss-parser)
    email/
      digest-template.tsx # React Email template for the digest
    utils.ts              # cn() tailwind merge helper
  trigger/
    digest.ts             # Trigger.dev scheduled task: the full digest pipeline
trigger.config.ts         # Trigger.dev project config
drizzle.config.ts         # Drizzle Kit config (migrations, schema path)
```

## Database Tables

- **topics** -- what to track (vertical, company, or keyword + Exa search query)
- **companies** -- companies to monitor (name + optional domain for domain-scoped search)
- **articles** -- every result found, deduped by (URL + recipientEmail) so each subscriber gets independent dedup (FK to topics or companies)
- **feeds** -- RSS feed URLs linked to topics
- **digests** -- history of sent email digests (status: sent/failed)
- **config** -- single-row settings (email, timezone, delivery time, frequency, max articles)

## Digest Pipeline (Trigger.dev dynamic schedule)

Schedule is configured via the dashboard (timezone, time, frequency) and synced to Trigger.dev via `schedules.create()` with `deduplicationKey`:

1. Fetch config, active topics, and active companies from DB
2. For each topic, search via Exa (`searchAndContents`)
3. For each company, search via Exa with `category:"company"` + optional domain filtering
4. Fetch any linked RSS feeds
5. Dedup new results against stored article URLs
6. AI summarize and rank articles (`generateText` with gpt-4o-mini)
7. Store new articles in DB
8. Render React Email template
9. Send via Resend
10. Log digest record

## Key Conventions

- Server actions in `src/app/actions/` -- all DB mutations go through these
- `src/lib/` for standalone service modules (exa, agent, resend, rss)
- `src/trigger/` for Trigger.dev task files (auto-detected by `trigger.config.ts`)
- No auth -- single-user tool, config stores the recipient email
- All imports use `@/` path alias mapped to `./src/*`
- Light mode only
- Follow React best practices from `.agents/skills/vercel-react-best-practices/AGENTS.md`

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `EXA_API_KEY` | Exa web search API key |
| `RESEND_API_KEY` | Resend email API key |
| `RESEND_FROM_EMAIL` | Sender address (default: `onboarding@resend.dev`) |
| `TRIGGER_SECRET_KEY` | Trigger.dev secret key |
| `TRIGGER_PROJECT_ID` | Trigger.dev project ref |
| `OPENAI_API_KEY` | OpenAI API key for AI SDK |

## Commands

```bash
bun dev              # Start Next.js dev server
bun run db:migrate   # Run Drizzle migrations
npx trigger dev      # Start Trigger.dev worker locally
npx drizzle-kit generate  # Generate new migration after schema changes
```
