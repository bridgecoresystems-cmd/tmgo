import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { clientProfiles, clientIndividual, clientCompany } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { getUserFromRequest } from '../../lib/auth';

const tIndividual = t.Optional(t.Object({
  firstName: t.Optional(t.String()),
  lastName: t.Optional(t.String()),
  middleName: t.Optional(t.String()),
  docType: t.Optional(t.String()),
  docNumber: t.Optional(t.String()),
  phone: t.Optional(t.String()),
  addressPostal: t.Optional(t.String()),
  addressRegion: t.Optional(t.String()),
  addressCity: t.Optional(t.String()),
  addressDistrict: t.Optional(t.String()),
  addressStreet: t.Optional(t.String()),
  addressHouse: t.Optional(t.String()),
}));

const tCompany = t.Optional(t.Object({
  companyName: t.Optional(t.String()),
  shortName: t.Optional(t.String()),
  legalForm: t.Optional(t.String()),
  taxId: t.Optional(t.String()),
  regNumber: t.Optional(t.String()),
  website: t.Optional(t.String()),
  phone: t.Optional(t.String()),
  additionalEmail: t.Optional(t.String()),
  bankName: t.Optional(t.String()),
  bankAccount: t.Optional(t.String()),
  bankCode: t.Optional(t.String()),
  bankSwift: t.Optional(t.String()),
  bankCorrAccount: t.Optional(t.String()),
  addressPostal: t.Optional(t.String()),
  addressRegion: t.Optional(t.String()),
  addressCity: t.Optional(t.String()),
  addressDistrict: t.Optional(t.String()),
  addressStreet: t.Optional(t.String()),
  addressHouse: t.Optional(t.String()),
}));

export const cabinetClientProfileRoutes = new Elysia({ prefix: '/cabinet/client/profile' })
  .derive(async ({ request, set }) => {
    const user = await getUserFromRequest(request);
    if (!user) {
      set.status = 401;
      throw new Error('Unauthorized');
    }
    return { user };
  })

  // GET — получить профиль заказчика
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

  // POST — создать профиль заказчика
  .post('/', async ({ user, body, set }) => {
    const existing = await db.select().from(clientProfiles)
      .where(eq(clientProfiles.userId, user.id)).limit(1);
    if (existing.length > 0) {
      set.status = 400;
      return { error: 'profile_already_exists' };
    }

    const displayName = body.clientType === 'individual'
      ? [body.individual?.firstName, body.individual?.lastName].filter(Boolean).join(' ') || null
      : body.company?.companyName || null;

    const [profile] = await db.insert(clientProfiles).values({
      userId: user.id,
      clientType: body.clientType,
      countryCode: body.countryCode,
      displayName,
    }).returning();

    if (body.clientType === 'individual' && body.individual) {
      const ind = body.individual;
      await db.insert(clientIndividual).values({
        profileId: profile.id,
        firstName: ind.firstName ?? null,
        lastName: ind.lastName ?? null,
        middleName: ind.middleName ?? null,
        docType: ind.docType ?? null,
        docNumber: ind.docNumber ?? null,
        phone: ind.phone ?? null,
        addressPostal: ind.addressPostal ?? null,
        addressRegion: ind.addressRegion ?? null,
        addressCity: ind.addressCity ?? null,
        addressDistrict: ind.addressDistrict ?? null,
        addressStreet: ind.addressStreet ?? null,
        addressHouse: ind.addressHouse ?? null,
      });
    } else if (body.clientType === 'company' && body.company) {
      const comp = body.company;
      await db.insert(clientCompany).values({
        profileId: profile.id,
        companyName: comp.companyName ?? '',
        shortName: comp.shortName ?? null,
        legalForm: comp.legalForm ?? null,
        taxId: comp.taxId ?? null,
        regNumber: comp.regNumber ?? null,
        website: comp.website ?? null,
        phone: comp.phone ?? null,
        additionalEmail: comp.additionalEmail ?? null,
        bankName: comp.bankName ?? null,
        bankAccount: comp.bankAccount ?? null,
        bankCode: comp.bankCode ?? null,
        bankSwift: comp.bankSwift ?? null,
        bankCorrAccount: comp.bankCorrAccount ?? null,
        addressPostal: comp.addressPostal ?? null,
        addressRegion: comp.addressRegion ?? null,
        addressCity: comp.addressCity ?? null,
        addressDistrict: comp.addressDistrict ?? null,
        addressStreet: comp.addressStreet ?? null,
        addressHouse: comp.addressHouse ?? null,
      });
    }

    return { profile };
  }, {
    body: t.Object({
      clientType: t.Union([t.Literal('individual'), t.Literal('company')]),
      countryCode: t.String({ minLength: 2, maxLength: 2 }),
      individual: tIndividual,
      company: tCompany,
    }),
  })

  // PATCH — обновить профиль
  .patch('/', async ({ user, body, set }) => {
    const [profile] = await db.select().from(clientProfiles)
      .where(eq(clientProfiles.userId, user.id)).limit(1);
    if (!profile) {
      set.status = 404;
      return { error: 'profile_not_found' };
    }

    const now = new Date();

    if (body.displayName !== undefined || body.countryCode !== undefined) {
      const upd: Record<string, unknown> = { updatedAt: now };
      if (body.displayName !== undefined) upd.displayName = body.displayName;
      if (body.countryCode !== undefined) upd.countryCode = body.countryCode;
      await db.update(clientProfiles).set(upd as any).where(eq(clientProfiles.id, profile.id));
    }

    if (profile.clientType === 'individual' && body.individual) {
      const ind = body.individual;
      const upd: Record<string, unknown> = { updatedAt: now };
      const fields = ['firstName','lastName','middleName','docType','docNumber','phone',
        'addressPostal','addressRegion','addressCity','addressDistrict','addressStreet','addressHouse'] as const;
      for (const f of fields) {
        if ((ind as any)[f] !== undefined) upd[f] = (ind as any)[f];
      }
      const [existing] = await db.select().from(clientIndividual)
        .where(eq(clientIndividual.profileId, profile.id)).limit(1);
      if (existing) {
        await db.update(clientIndividual).set(upd as any).where(eq(clientIndividual.profileId, profile.id));
      } else {
        await db.insert(clientIndividual).values({ profileId: profile.id, ...upd } as any);
      }
    }

    if (profile.clientType === 'company' && body.company) {
      const comp = body.company;
      const upd: Record<string, unknown> = { updatedAt: now };
      const fields = ['companyName','shortName','legalForm','taxId','regNumber','website','phone',
        'additionalEmail','bankName','bankAccount','bankCode','bankSwift','bankCorrAccount',
        'addressPostal','addressRegion','addressCity','addressDistrict','addressStreet','addressHouse'] as const;
      for (const f of fields) {
        if ((comp as any)[f] !== undefined) upd[f] = (comp as any)[f];
      }
      const [existing] = await db.select().from(clientCompany)
        .where(eq(clientCompany.profileId, profile.id)).limit(1);
      if (existing) {
        await db.update(clientCompany).set(upd as any).where(eq(clientCompany.profileId, profile.id));
      } else {
        await db.insert(clientCompany).values({ profileId: profile.id, ...upd } as any);
      }
    }

    const [updated] = await db.select().from(clientProfiles)
      .where(eq(clientProfiles.id, profile.id)).limit(1);
    return { profile: updated };
  }, {
    body: t.Object({
      displayName: t.Optional(t.String()),
      countryCode: t.Optional(t.String()),
      individual: tIndividual,
      company: tCompany,
    }),
  });
