import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { clientProfiles, clientIndividual, clientCompany } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserFromRequest } from '../../lib/auth';

export const cabinetClientProfileRoutes = new Elysia({ prefix: '/cabinet/client/profile' })
  .derive(async ({ request, set }) => {
    const user = await getUserFromRequest(request);
    if (!user) {
      set.status = 401;
      throw new Error('Unauthorized');
    }
    return { user };
  })

  // GET /cabinet/client/profile — получить профиль заказчика
  .get('/', async ({ user, set }) => {
    const [profile] = await db.select()
      .from(clientProfiles)
      .where(eq(clientProfiles.userId, user.id))
      .limit(1);

    if (!profile) {
      set.status = 404;
      return { error: 'profile_not_found' };
    }

    let details: Record<string, unknown> = {};
    if (profile.clientType === 'individual') {
      const [ind] = await db.select().from(clientIndividual)
        .where(eq(clientIndividual.profileId, profile.id)).limit(1);
      if (ind) details = ind as any;
    } else {
      const [comp] = await db.select().from(clientCompany)
        .where(eq(clientCompany.profileId, profile.id)).limit(1);
      if (comp) details = comp as any;
    }

    return { profile, details };
  })

  // POST /cabinet/client/profile — создать профиль заказчика
  .post('/', async ({ user, body, set }) => {
    const existing = await db.select().from(clientProfiles)
      .where(eq(clientProfiles.userId, user.id)).limit(1);
    if (existing.length > 0) {
      set.status = 400;
      return { error: 'profile_already_exists' };
    }

    const [profile] = await db.insert(clientProfiles).values({
      userId: user.id,
      clientType: body.clientType,
      countryCode: body.countryCode,
      displayName: body.displayName ?? null,
    }).returning();

    if (body.clientType === 'individual' && body.individual) {
      await db.insert(clientIndividual).values({
        profileId: profile.id,
        firstName: body.individual.firstName ?? null,
        lastName: body.individual.lastName ?? null,
        middleName: body.individual.middleName ?? null,
        docType: body.individual.docType ?? null,
        docNumber: body.individual.docNumber ?? null,
      });
    } else if (body.clientType === 'company' && body.company) {
      await db.insert(clientCompany).values({
        profileId: profile.id,
        companyName: body.company.companyName,
        legalForm: body.company.legalForm ?? null,
        taxId: body.company.taxId ?? null,
        regNumber: body.company.regNumber ?? null,
        bankName: body.company.bankName ?? null,
        bankAccount: body.company.bankAccount ?? null,
        bankSwift: body.company.bankSwift ?? null,
      });
    }

    return { profile };
  }, {
    body: t.Object({
      clientType: t.Union([t.Literal('individual'), t.Literal('company')]),
      countryCode: t.String({ minLength: 2, maxLength: 2 }),
      displayName: t.Optional(t.String()),
      individual: t.Optional(t.Object({
        firstName: t.Optional(t.String()),
        lastName: t.Optional(t.String()),
        middleName: t.Optional(t.String()),
        docType: t.Optional(t.String()),
        docNumber: t.Optional(t.String()),
      })),
      company: t.Optional(t.Object({
        companyName: t.String(),
        legalForm: t.Optional(t.String()),
        taxId: t.Optional(t.String()),
        regNumber: t.Optional(t.String()),
        bankName: t.Optional(t.String()),
        bankAccount: t.Optional(t.String()),
        bankSwift: t.Optional(t.String()),
      })),
    }),
  })

  // PATCH /cabinet/client/profile — обновить профиль
  .patch('/', async ({ user, body, set }) => {
    const [profile] = await db.select().from(clientProfiles)
      .where(eq(clientProfiles.userId, user.id)).limit(1);
    if (!profile) {
      set.status = 404;
      return { error: 'profile_not_found' };
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.displayName !== undefined) updateData.displayName = body.displayName;
    if (body.countryCode !== undefined) updateData.countryCode = body.countryCode;

    const [updated] = await db.update(clientProfiles)
      .set(updateData as any)
      .where(eq(clientProfiles.id, profile.id))
      .returning();

    if (profile.clientType === 'individual' && body.individual) {
      const [ind] = await db.select().from(clientIndividual)
        .where(eq(clientIndividual.profileId, profile.id)).limit(1);
      const indUpdate: Record<string, unknown> = { updatedAt: new Date() };
      if (body.individual.firstName !== undefined) indUpdate.firstName = body.individual.firstName;
      if (body.individual.lastName !== undefined) indUpdate.lastName = body.individual.lastName;
      if (body.individual.middleName !== undefined) indUpdate.middleName = body.individual.middleName;
      if (body.individual.docType !== undefined) indUpdate.docType = body.individual.docType;
      if (body.individual.docNumber !== undefined) indUpdate.docNumber = body.individual.docNumber;
      if (ind) {
        await db.update(clientIndividual).set(indUpdate as any).where(eq(clientIndividual.profileId, profile.id));
      } else {
        await db.insert(clientIndividual).values({ profileId: profile.id, ...indUpdate } as any);
      }
    }

    if (profile.clientType === 'company' && body.company) {
      const [comp] = await db.select().from(clientCompany)
        .where(eq(clientCompany.profileId, profile.id)).limit(1);
      const compUpdate: Record<string, unknown> = { updatedAt: new Date() };
      if (body.company.companyName !== undefined) compUpdate.companyName = body.company.companyName;
      if (body.company.legalForm !== undefined) compUpdate.legalForm = body.company.legalForm;
      if (body.company.taxId !== undefined) compUpdate.taxId = body.company.taxId;
      if (body.company.regNumber !== undefined) compUpdate.regNumber = body.company.regNumber;
      if (body.company.bankName !== undefined) compUpdate.bankName = body.company.bankName;
      if (body.company.bankAccount !== undefined) compUpdate.bankAccount = body.company.bankAccount;
      if (body.company.bankSwift !== undefined) compUpdate.bankSwift = body.company.bankSwift;
      if (comp) {
        await db.update(clientCompany).set(compUpdate as any).where(eq(clientCompany.profileId, profile.id));
      } else {
        await db.insert(clientCompany).values({ profileId: profile.id, ...compUpdate } as any);
      }
    }

    return { profile: updated };
  }, {
    body: t.Object({
      displayName: t.Optional(t.String()),
      countryCode: t.Optional(t.String()),
      individual: t.Optional(t.Object({
        firstName: t.Optional(t.String()),
        lastName: t.Optional(t.String()),
        middleName: t.Optional(t.String()),
        docType: t.Optional(t.String()),
        docNumber: t.Optional(t.String()),
      })),
      company: t.Optional(t.Object({
        companyName: t.Optional(t.String()),
        legalForm: t.Optional(t.String()),
        taxId: t.Optional(t.String()),
        regNumber: t.Optional(t.String()),
        bankName: t.Optional(t.String()),
        bankAccount: t.Optional(t.String()),
        bankSwift: t.Optional(t.String()),
      })),
    }),
  });
