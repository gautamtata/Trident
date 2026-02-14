'use server';

import { db } from '@/db';
import { digests } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function getDigests() {
  return db.select().from(digests).orderBy(desc(digests.sentAt)).limit(20);
}
