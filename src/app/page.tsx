import { Separator } from '@/components/ui/separator';
import { TopicForm } from '@/components/topic-form';
import { TopicList } from '@/components/topic-list';
import { CompanyForm } from '@/components/company-form';
import { CompanyList } from '@/components/company-list';
import { ConfigForm } from '@/components/config-form';
import { SendDigestButton } from '@/components/send-digest-button';
import { DigestHistory } from '@/components/digest-history';
import { getTopics } from '@/app/actions/topics';
import { getCompanies } from '@/app/actions/companies';
import { getConfig } from '@/app/actions/config';
import { getDigests } from '@/app/actions/digests';

// Force dynamic rendering -- page fetches from DB
export const dynamic = 'force-dynamic';

export default async function Home() {
  const [topicsData, companiesData, configData, digestsData] = await Promise.all([
    getTopics(),
    getCompanies(),
    getConfig(),
    getDigests(),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-4xl px-4 md:px-6 py-4 md:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900">
                Industry Deep Search
              </h1>
              <p className="text-xs md:text-sm text-zinc-500">
                AI-powered industry intelligence digests
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <CompanyForm />
              <TopicForm />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8">
        {/* Companies Section */}
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">
            Companies ({companiesData.length})
          </h2>
          <CompanyList companies={companiesData} />
        </section>

        <Separator />

        {/* Topics Section */}
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">
            Topics ({topicsData.length})
          </h2>
          <TopicList topics={topicsData} />
        </section>

        <Separator />

        {/* Two column layout for config and digests */}
        <div className="grid gap-6 md:gap-8 md:grid-cols-2">
          {/* Config */}
          <section className="space-y-4">
            <ConfigForm config={configData} />
            <SendDigestButton />
          </section>

          {/* Digest History */}
          <section>
            <DigestHistory digests={digestsData} />
          </section>
        </div>
      </main>
    </div>
  );
}
