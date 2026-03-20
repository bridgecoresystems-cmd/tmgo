import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { legalDocuments } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserFromRequest } from '../../lib/auth';

const docTypeValues = ['agreement', 'privacy', 'rules'] as const;
const localeValues = ['ru', 'en', 'tk'] as const;

async function requireAdmin(request: Request, set: { status: number }) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== 'admin') {
    set.status = 401;
    throw new Error('Unauthorized');
  }
  return user;
}

export const adminLegalDocsRoutes = new Elysia({ prefix: '/admin/legal-docs' })

  // GET / — все документы
  .get('/', async ({ request, set }) => {
    await requireAdmin(request, set);
    return db.select().from(legalDocuments).orderBy(legalDocuments.docType, legalDocuments.locale);
  })

  // GET /:docType/:locale — один документ
  .get('/:docType/:locale', async ({ request, set, params }) => {
    await requireAdmin(request, set);
    const [doc] = await db.select().from(legalDocuments)
      .where(and(
        eq(legalDocuments.docType, params.docType as any),
        eq(legalDocuments.locale, params.locale as any),
      )).limit(1);
    if (!doc) { set.status = 404; return { error: 'Not found' }; }
    return doc;
  })

  // PUT /:docType/:locale — upsert
  .put('/:docType/:locale', async ({ request, set, params, body }) => {
    const user = await requireAdmin(request, set);
    const now = new Date();
    const existing = await db.select({ id: legalDocuments.id }).from(legalDocuments)
      .where(and(
        eq(legalDocuments.docType, params.docType as any),
        eq(legalDocuments.locale, params.locale as any),
      )).limit(1);

    if (existing.length > 0) {
      const [updated] = await db.update(legalDocuments).set({
        title: body.title,
        content: body.content,
        version: body.version ?? '1.0',
        effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : null,
        updatedAt: now,
        updatedBy: user.id,
      }).where(eq(legalDocuments.id, existing[0]!.id)).returning();
      return updated;
    } else {
      const [created] = await db.insert(legalDocuments).values({
        docType: params.docType as any,
        locale: params.locale as any,
        title: body.title,
        content: body.content,
        version: body.version ?? '1.0',
        effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : null,
        updatedAt: now,
        updatedBy: user.id,
      }).returning();
      return created;
    }
  }, {
    body: t.Object({
      title: t.String({ minLength: 1 }),
      content: t.String({ minLength: 1 }),
      version: t.Optional(t.String()),
      effectiveDate: t.Optional(t.Nullable(t.String())),
    }),
  })

  // POST /:docType/:locale/publish
  .post('/:docType/:locale/publish', async ({ request, set, params }) => {
    await requireAdmin(request, set);
    const [doc] = await db.select({ id: legalDocuments.id }).from(legalDocuments)
      .where(and(
        eq(legalDocuments.docType, params.docType as any),
        eq(legalDocuments.locale, params.locale as any),
      )).limit(1);
    if (!doc) { set.status = 404; return { error: 'Not found' }; }
    await db.update(legalDocuments).set({ isPublished: true, publishedAt: new Date() })
      .where(eq(legalDocuments.id, doc.id));
    return { success: true };
  })

  // POST /:docType/:locale/unpublish
  .post('/:docType/:locale/unpublish', async ({ request, set, params }) => {
    await requireAdmin(request, set);
    const [doc] = await db.select({ id: legalDocuments.id }).from(legalDocuments)
      .where(and(
        eq(legalDocuments.docType, params.docType as any),
        eq(legalDocuments.locale, params.locale as any),
      )).limit(1);
    if (!doc) { set.status = 404; return { error: 'Not found' }; }
    await db.update(legalDocuments).set({ isPublished: false })
      .where(eq(legalDocuments.id, doc.id));
    return { success: true };
  });

// Public route (no auth required)
export const publicLegalDocsRoutes = new Elysia({ prefix: '/legal' })
  .get('/:docType/:locale', async ({ params, set }) => {
    const [doc] = await db.select({
      title: legalDocuments.title,
      content: legalDocuments.content,
      version: legalDocuments.version,
      effectiveDate: legalDocuments.effectiveDate,
      publishedAt: legalDocuments.publishedAt,
    }).from(legalDocuments)
      .where(and(
        eq(legalDocuments.docType, params.docType as any),
        eq(legalDocuments.locale, params.locale as any),
        eq(legalDocuments.isPublished, true),
      )).limit(1);
    if (!doc) { set.status = 404; return { error: 'Not found' }; }
    return doc;
  });
