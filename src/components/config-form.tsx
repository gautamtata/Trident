'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { upsertConfig } from '@/app/actions/config';

interface Config {
  id: string;
  email: string;
  cronSchedule: string;
  maxArticlesPerDigest: number;
  updatedAt: Date;
}

export function ConfigForm({ config }: { config: Config | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Digest Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={upsertConfig} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Recipient Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="dad@example.com"
              defaultValue={config?.email ?? ''}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cronSchedule">Cron Schedule (UTC)</Label>
            <Input
              id="cronSchedule"
              name="cronSchedule"
              placeholder="0 7 * * 1-5"
              defaultValue={config?.cronSchedule ?? '0 7 * * 1-5'}
            />
            <p className="text-xs text-muted-foreground">
              Default: weekday mornings at 7am UTC. Use{' '}
              <a
                href="https://crontab.guru"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                crontab.guru
              </a>{' '}
              to build expressions.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxArticlesPerDigest">Max Articles per Digest</Label>
            <Input
              id="maxArticlesPerDigest"
              name="maxArticlesPerDigest"
              type="number"
              min={1}
              max={50}
              defaultValue={config?.maxArticlesPerDigest ?? 15}
            />
          </div>

          <Button type="submit" className="w-full">
            {config ? 'Update Settings' : 'Save Settings'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
