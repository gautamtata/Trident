'use server';

import { db } from '@/db';
import { config } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { schedules } from '@trigger.dev/sdk/v3';

type Frequency = 'daily' | 'weekdays' | 'weekly';

/**
 * Convert user-friendly schedule inputs into a cron expression.
 * The timezone is handled separately by Trigger.dev.
 */
function buildCron(hour: number, minute: number, frequency: Frequency): string {
  const time = `${minute} ${hour}`;
  switch (frequency) {
    case 'daily':
      return `${time} * * *`;
    case 'weekdays':
      return `${time} * * 1-5`;
    case 'weekly':
      return `${time} * * 1`; // Monday
    default:
      return `${time} * * *`;
  }
}

export async function getConfig() {
  const [cfg] = await db.select().from(config).limit(1);
  return cfg ?? null;
}

export async function upsertConfig(formData: FormData): Promise<void> {
  const email = formData.get('email') as string;
  const timezone = (formData.get('timezone') as string) || 'Asia/Calcutta';
  const deliveryHour = parseInt(formData.get('deliveryHour') as string, 10) || 6;
  const deliveryMinute = parseInt(formData.get('deliveryMinute') as string, 10) || 0;
  const frequency = (formData.get('frequency') as Frequency) || 'daily';
  const maxArticles = parseInt(formData.get('maxArticlesPerDigest') as string, 10) || 15;

  if (!email) {
    throw new Error('Email is required');
  }

  const cronSchedule = buildCron(deliveryHour, deliveryMinute, frequency);

  const existing = await getConfig();

  if (existing) {
    await db
      .update(config)
      .set({
        email,
        cronSchedule,
        timezone,
        deliveryHour,
        deliveryMinute,
        frequency,
        maxArticlesPerDigest: maxArticles,
        updatedAt: new Date(),
      })
      .where(eq(config.id, existing.id));
  } else {
    await db.insert(config).values({
      email,
      cronSchedule,
      timezone,
      deliveryHour,
      deliveryMinute,
      frequency,
      maxArticlesPerDigest: maxArticles,
    });
  }

  // Upsert the Trigger.dev schedule dynamically so the cron + timezone
  // are applied without needing a redeploy.
  try {
    await schedules.create({
      task: 'daily-digest',
      cron: cronSchedule,
      timezone,
      deduplicationKey: 'user-digest-schedule',
    });
  } catch (err) {
    // Non-fatal — the task will still run on its default schedule if this fails
    // (e.g. Trigger.dev not reachable in local dev without `npx trigger dev`)
    console.warn('[Config] Failed to upsert Trigger.dev schedule:', err);
  }

  revalidatePath('/');
}
