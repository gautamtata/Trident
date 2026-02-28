'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Config {
  email: string;
  cronSchedule: string;
  timezone: string;
  deliveryHour: number;
  deliveryMinute: number;
  frequency: 'daily' | 'weekdays' | 'weekly';
  maxArticlesPerDigest: number;
}

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Every day',
  weekdays: 'Mon–Fri',
  weekly: 'Every Monday',
};

export function ConfigForm({ config }: { config: Config | null }) {
  if (!config) return null;

  const { hour, ampm } = to12Hour(config.deliveryHour);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Digest Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <Row label="Recipients" value={config.email} />
        <Row
          label="Schedule"
          value={`${hour}:${String(config.deliveryMinute).padStart(2, '0')} ${ampm} ${FREQUENCY_LABELS[config.frequency] ?? config.frequency}`}
        />
        <Row label="Timezone" value={config.timezone} />
        <Row label="Max articles" value={String(config.maxArticlesPerDigest)} />
        <p className="text-xs text-muted-foreground pt-2">
          Edit src/lib/digest-config.ts to change these settings.
        </p>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function to12Hour(h24: number): { hour: number; ampm: 'AM' | 'PM' } {
  if (h24 === 0) return { hour: 12, ampm: 'AM' };
  if (h24 === 12) return { hour: 12, ampm: 'PM' };
  if (h24 > 12) return { hour: h24 - 12, ampm: 'PM' };
  return { hour: h24, ampm: 'AM' };
}
