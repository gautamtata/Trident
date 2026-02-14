'use server';

import { db } from '@/db';
import { topics } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getTopics() {
  return db.select().from(topics).orderBy(topics.createdAt);
}

export async function createTopic(formData: FormData) {
  const name = formData.get('name') as string;
  const type = formData.get('type') as 'vertical' | 'company' | 'keyword';
  const searchQuery = formData.get('searchQuery') as string;

  if (!name || !searchQuery) {
    return { error: 'Name and search query are required' };
  }

  await db.insert(topics).values({
    name,
    type: type || 'keyword',
    searchQuery,
  });

  revalidatePath('/');
  return { success: true };
}

export async function toggleTopic(id: string, isActive: boolean) {
  await db.update(topics).set({ isActive }).where(eq(topics.id, id));
  revalidatePath('/');
}

export async function deleteTopic(id: string) {
  await db.delete(topics).where(eq(topics.id, id));
  revalidatePath('/');
}
