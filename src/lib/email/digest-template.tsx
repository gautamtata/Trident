import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface DigestArticle {
  title: string;
  url: string;
  source: string | null;
  summary: string;
  relevanceScore: number;
}

interface DigestEmailProps {
  executiveBriefing: string;
  articles: DigestArticle[];
  date: string;
  topicNames: string[];
}

export function DigestEmail({
  executiveBriefing,
  articles,
  date,
  topicNames,
}: DigestEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Industry Deep Search — Digest — {date}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logoText}>INDUSTRY DEEP SEARCH</Text>
            <Text style={tagline}>Industry Intelligence Digest</Text>
          </Section>

          {/* Date & Topics */}
          <Section style={metaSection}>
            <Text style={dateText}>{date}</Text>
            <Text style={topicsText}>
              Tracking: {topicNames.join(' · ')}
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Executive Briefing */}
          <Section style={briefingSection}>
            <Heading as="h2" style={sectionHeading}>
              Executive Briefing
            </Heading>
            <Text style={briefingText}>{executiveBriefing}</Text>
          </Section>

          <Hr style={divider} />

          {/* Articles */}
          <Section>
            <Heading as="h2" style={sectionHeading}>
              Top Stories ({articles.length})
            </Heading>

            {articles.map((article, index) => (
              <Section key={index} style={articleCard}>
                <Text style={articleIndex}>#{index + 1}</Text>
                <Link href={article.url} style={articleTitle}>
                  {article.title}
                </Link>
                <Text style={articleMeta}>
                  {article.source ?? 'Unknown source'} · Relevance: {article.relevanceScore}/10
                </Text>
                <Text style={articleSummary}>{article.summary}</Text>
              </Section>
            ))}
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Powered by Industry Deep Search — AI-first industry intelligence.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default DigestEmail;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const main: React.CSSProperties = {
  backgroundColor: '#f8f9fa',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container: React.CSSProperties = {
  margin: '0 auto',
  padding: '32px 24px',
  maxWidth: '600px',
};

const header: React.CSSProperties = {
  textAlign: 'center' as const,
  paddingBottom: '16px',
};

const logoText: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: '700',
  letterSpacing: '4px',
  color: '#0f172a',
  margin: '0',
};

const tagline: React.CSSProperties = {
  fontSize: '13px',
  color: '#64748b',
  margin: '4px 0 0 0',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
};

const metaSection: React.CSSProperties = {
  textAlign: 'center' as const,
  paddingBottom: '8px',
};

const dateText: React.CSSProperties = {
  fontSize: '14px',
  color: '#475569',
  margin: '0',
  fontWeight: '600',
};

const topicsText: React.CSSProperties = {
  fontSize: '12px',
  color: '#94a3b8',
  margin: '4px 0 0 0',
};

const divider: React.CSSProperties = {
  borderTop: '1px solid #e2e8f0',
  margin: '24px 0',
};

const briefingSection: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  padding: '20px 24px',
  border: '1px solid #e2e8f0',
};

const sectionHeading: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: '700',
  color: '#0f172a',
  margin: '0 0 12px 0',
};

const briefingText: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#334155',
  margin: '0',
};

const articleCard: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  padding: '16px 20px',
  border: '1px solid #e2e8f0',
  marginBottom: '12px',
};

const articleIndex: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: '700',
  color: '#94a3b8',
  margin: '0 0 4px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const articleTitle: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: '600',
  color: '#0f172a',
  textDecoration: 'none',
  lineHeight: '1.4',
};

const articleMeta: React.CSSProperties = {
  fontSize: '12px',
  color: '#94a3b8',
  margin: '4px 0 8px 0',
};

const articleSummary: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: '1.5',
  color: '#475569',
  margin: '0',
};

const footer: React.CSSProperties = {
  textAlign: 'center' as const,
};

const footerText: React.CSSProperties = {
  fontSize: '12px',
  color: '#94a3b8',
  margin: '0',
};
