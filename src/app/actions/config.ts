'use server';

import { digestConfig } from '@/lib/digest-config';

export async function getConfig() {
  return {
    email: digestConfig.recipients.join(', '),
    cronSchedule: digestConfig.cron,
    timezone: digestConfig.timezone,
    deliveryHour: 6,
    deliveryMinute: 0,
    frequency: 'weekly' as const,
    maxArticlesPerDigest: digestConfig.maxArticlesPerDigest,
  };
}
