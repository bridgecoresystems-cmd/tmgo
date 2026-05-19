import { db } from '../../db';
import { legalDocuments } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { NotFound } from '../../lib/errors';

type DocType = typeof legalDocuments.$inferSelect['docType'];
type Locale = typeof legalDocuments.$inferSelect['locale'];

function whereDoc(docType: string, locale: string) {
  return and(
    eq(legalDocuments.docType, docType as DocType),
    eq(legalDocuments.locale, locale as Locale),
  );
}

export function listLegalDocs() {
  return db.select().from(legalDocuments).orderBy(legalDocuments.docType, legalDocuments.locale);
}

export async function getLegalDoc(docType: string, locale: string) {
  const [doc] = await db.select().from(legalDocuments).where(whereDoc(docType, locale)).limit(1);
  if (!doc) throw new NotFound('Not found');
  return doc;
}

export async function upsertLegalDoc(
  docType: string,
  locale: string,
  userId: string,
  body: { title: string; content: string; version?: string; effectiveDate?: string | null },
) {
  const now = new Date();
  const existing = await db.select({ id: legalDocuments.id }).from(legalDocuments)
    .where(whereDoc(docType, locale)).limit(1);

  if (existing.length > 0) {
    const [updated] = await db.update(legalDocuments).set({
      title: body.title,
      content: body.content,
      version: body.version ?? '1.0',
      effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : null,
      updatedAt: now,
      updatedBy: userId,
    }).where(eq(legalDocuments.id, existing[0]!.id)).returning();
    return updated;
  }
  const [created] = await db.insert(legalDocuments).values({
    docType: docType as DocType,
    locale: locale as Locale,
    title: body.title,
    content: body.content,
    version: body.version ?? '1.0',
    effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : null,
    updatedAt: now,
    updatedBy: userId,
  }).returning();
  return created;
}

export async function setLegalDocPublished(docType: string, locale: string, isPublished: boolean) {
  const [doc] = await db.select({ id: legalDocuments.id }).from(legalDocuments)
    .where(whereDoc(docType, locale)).limit(1);
  if (!doc) throw new NotFound('Not found');
  await db.update(legalDocuments)
    .set(isPublished ? { isPublished: true, publishedAt: new Date() } : { isPublished: false })
    .where(eq(legalDocuments.id, doc.id));
  return { success: true };
}

export async function getPublishedLegalDoc(docType: string, locale: string) {
  const [doc] = await db.select({
    title: legalDocuments.title,
    content: legalDocuments.content,
    version: legalDocuments.version,
    effectiveDate: legalDocuments.effectiveDate,
    publishedAt: legalDocuments.publishedAt,
  }).from(legalDocuments)
    .where(and(whereDoc(docType, locale), eq(legalDocuments.isPublished, true)))
    .limit(1);
  if (!doc) throw new NotFound('Not found');
  return doc;
}
