import { Separator } from '@/components/ui/separator';
import { TopicForm } from '@/components/topic-form';
import { TopicList } from '@/components/topic-list';
import { ConfigForm } from '@/components/config-form';
import { DigestHistory } from '@/components/digest-history';
import { getTopics } from '@/app/actions/topics';
import { getConfig } from '@/app/actions/config';
import { getDigests } from '@/app/actions/digests';

// Force dynamic rendering -- page fetches from DB
export const dynamic = 'force-dynamic';

export default async function Home() {
  const [topicsData, configData, digestsData] = await Promise.all([
    getTopics(),
    getConfig(),
    getDigests(),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                Trident
              </h1>
              <p className="text-sm text-zinc-500">
                AI-powered industry intelligence digests
              </p>
            </div>
            <TopicForm />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 py-8 space-y-8">
        {/* Topics Section */}
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">
            Topics ({topicsData.length})
          </h2>
          <TopicList topics={topicsData} />
        </section>

        <Separator />

        {/* Two column layout for config and digests */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Config */}
          <section>
            <ConfigForm config={configData} />
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
