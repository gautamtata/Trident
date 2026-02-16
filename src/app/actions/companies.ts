'use server';

import { db } from '@/db';
import { companies } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getCompanies() {
  return db.select().from(companies).orderBy(companies.createdAt);
}

export async function createCompany(formData: FormData) {
  const name = (formData.get('name') as string)?.trim();
  let domain = (formData.get('domain') as string)?.trim() || null;

  if (!name) {
    return { error: 'Company name is required' };
  }

  // Normalize domain: strip protocol and trailing slashes
  if (domain) {
    domain = domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/+$/, '');
  }

  await db.insert(companies).values({
    name,
    domain,
  });

  revalidatePath('/');
  return { success: true };
}

export async function toggleCompany(id: string, isActive: boolean) {
  await db.update(companies).set({ isActive }).where(eq(companies.id, id));
  revalidatePath('/');
}

export async function updateCompany(
  id: string,
  data: { name: string; domain: string | null },
) {
  if (!data.name?.trim()) {
    return { error: 'Company name is required' };
  }

  let domain = data.domain?.trim() || null;
  if (domain) {
    domain = domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/+$/, '');
  }

  await db
    .update(companies)
    .set({ name: data.name.trim(), domain })
    .where(eq(companies.id, id));

  revalidatePath('/');
  return { success: true };
}

export async function deleteCompany(id: string) {
  await db.delete(companies).where(eq(companies.id, id));
  revalidatePath('/');
}
