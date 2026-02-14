'use server';

import { db } from '@/db';
import { config } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getConfig() {
  const [cfg] = await db.select().from(config).limit(1);
  return cfg ?? null;
}

export async function upsertConfig(formData: FormData): Promise<void> {
  const email = formData.get('email') as string;
  const cronSchedule = formData.get('cronSchedule') as string;
  const maxArticles = parseInt(formData.get('maxArticlesPerDigest') as string, 10);

  if (!email) {
    throw new Error('Email is required');
  }

  const existing = await getConfig();

  if (existing) {
    await db
      .update(config)
      .set({
        email,
        cronSchedule: cronSchedule || '0 7 * * 1-5',
        maxArticlesPerDigest: maxArticles || 15,
        updatedAt: new Date(),
      })
      .where(eq(config.id, existing.id));
  } else {
    await db.insert(config).values({
      email,
      cronSchedule: cronSchedule || '0 7 * * 1-5',
      maxArticlesPerDigest: maxArticles || 15,
    });
  }

  revalidatePath('/');
}
