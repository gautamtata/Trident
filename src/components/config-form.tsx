'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { upsertConfig } from '@/app/actions/config';

// Common timezones — using IANA names accepted by Trigger.dev
const TIMEZONES = [
  { value: 'Asia/Calcutta', label: 'India (IST)' },
  { value: 'Asia/Tokyo', label: 'Japan (JST)' },
  { value: 'Asia/Shanghai', label: 'China (CST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'America/New_York', label: 'New York (ET)' },
  { value: 'America/Chicago', label: 'Chicago (CT)' },
  { value: 'America/Denver', label: 'Denver (MT)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PT)' },
  { value: 'Pacific/Auckland', label: 'New Zealand (NZST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
] as const;

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
const MINUTES = [0, 15, 30, 45];

interface Config {
  id: string;
  email: string;
  cronSchedule: string;
  timezone: string;
  deliveryHour: number;
  deliveryMinute: number;
  frequency: 'daily' | 'weekdays' | 'weekly';
  maxArticlesPerDigest: number;
  updatedAt: Date;
}

function to12Hour(h24: number): { hour: number; ampm: 'AM' | 'PM' } {
  if (h24 === 0) return { hour: 12, ampm: 'AM' };
  if (h24 === 12) return { hour: 12, ampm: 'PM' };
  if (h24 > 12) return { hour: h24 - 12, ampm: 'PM' };
  return { hour: h24, ampm: 'AM' };
}

function to24Hour(hour12: number, ampm: 'AM' | 'PM'): number {
  if (ampm === 'AM') return hour12 === 12 ? 0 : hour12;
  return hour12 === 12 ? 12 : hour12 + 12;
}

export function ConfigForm({ config }: { config: Config | null }) {
  const defaultH = config?.deliveryHour ?? 6;
  const { hour: defaultHour12, ampm: defaultAmpm } = to12Hour(defaultH);

  // Normalize legacy 'Asia/Kolkata' -> 'Asia/Calcutta' (Trigger.dev compat)
  const savedTz = config?.timezone === 'Asia/Kolkata' ? 'Asia/Calcutta' : config?.timezone;
  const [timezone, setTimezone] = useState(savedTz ?? 'Asia/Calcutta');
  const [hour, setHour] = useState(String(defaultHour12));
  const [minute, setMinute] = useState(String(config?.deliveryMinute ?? 0));
  const [ampm, setAmpm] = useState<'AM' | 'PM'>(defaultAmpm);
  const [frequency, setFrequency] = useState(config?.frequency ?? 'daily');

  const [saving, setSaving] = useState(false);

  async function handleSubmit(formData: FormData) {
    const h24 = to24Hour(parseInt(hour, 10), ampm);
    formData.set('timezone', timezone);
    formData.set('deliveryHour', String(h24));
    formData.set('deliveryMinute', minute);
    formData.set('frequency', frequency);

    setSaving(true);
    try {
      await upsertConfig(formData);
      toast.success('Settings saved');
    } catch (err) {
      toast.error(`Failed to save: ${err}`);
    } finally {
      setSaving(false);
    }
  }

  const frequencyLabel =
    frequency === 'daily'
      ? 'Every day'
      : frequency === 'weekdays'
        ? 'Mon\u2013Fri'
        : 'Every Monday';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Digest Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-5">
          {/* Email */}
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

          {/* Delivery Schedule */}
          <div className="space-y-3">
            <Label>Delivery Schedule</Label>

            {/* Timezone */}
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Time picker row */}
            <div className="flex flex-wrap items-center gap-2">
              <Select value={hour} onValueChange={setHour}>
                <SelectTrigger className="w-[70px] sm:w-[80px] min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOURS_12.map((h) => (
                    <SelectItem key={h} value={String(h)}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span className="text-muted-foreground font-medium">:</span>

              <Select value={minute} onValueChange={setMinute}>
                <SelectTrigger className="w-[70px] sm:w-[80px] min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MINUTES.map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {String(m).padStart(2, '0')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={ampm} onValueChange={(v) => setAmpm(v as 'AM' | 'PM')}>
                <SelectTrigger className="w-[70px] sm:w-[80px] min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Frequency */}
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { value: 'daily', label: 'Every day' },
                  { value: 'weekdays', label: 'Weekdays' },
                  { value: 'weekly', label: 'Weekly' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFrequency(opt.value)}
                  className={`flex-1 sm:flex-none rounded-md border px-3 py-2 sm:py-1.5 text-sm font-medium transition-colors min-h-[44px] sm:min-h-0 ${
                    frequency === opt.value
                      ? 'border-zinc-900 bg-zinc-900 text-white'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <p className="text-xs sm:text-xs text-muted-foreground wrap-break-word">
              Digest delivered at {hour}:{String(minute).padStart(2, '0')} {ampm} {frequencyLabel} ({TIMEZONES.find((t) => t.value === timezone)?.label ?? timezone})
            </p>
          </div>

          {/* Max articles */}
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

          <Button type="submit" className="w-full min-h-[44px]" disabled={saving}>
            {saving ? 'Saving...' : config ? 'Update Settings' : 'Save Settings'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
