import { db } from '../../db';
import { clientProfiles, clientIndividual, clientCompany } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { NotFound, BadRequest } from '../../lib/errors';

const INDIVIDUAL_FIELDS = ['firstName', 'lastName', 'middleName', 'docType', 'docNumber', 'phone',
  'addressPostal', 'addressRegion', 'addressCity', 'addressDistrict', 'addressStreet', 'addressHouse'] as const;
const COMPANY_FIELDS = ['companyName', 'shortName', 'legalForm', 'taxId', 'regNumber', 'website', 'phone',
  'additionalEmail', 'bankName', 'bankAccount', 'bankCode', 'bankSwift', 'bankCorrAccount',
  'addressPostal', 'addressRegion', 'addressCity', 'addressDistrict', 'addressStreet', 'addressHouse'] as const;

type Individual = Partial<Record<(typeof INDIVIDUAL_FIELDS)[number], string>>;
type Company = Partial<Record<(typeof COMPANY_FIELDS)[number], string>>;

export async function getProfile(userId: string) {
  const [profile] = await db.select()
    .from(clientProfiles)
    .where(eq(clientProfiles.userId, userId))
    .limit(1);

  if (!profile) throw new NotFound('profile_not_found');

  let details: Record<string, unknown> = {};
  if (profile.clientType === 'individual') {
    const [ind] = await db.select().from(clientIndividual)
      .where(eq(clientIndividual.profileId, profile.id)).limit(1);
    if (ind) details = ind;
  } else {
    const [comp] = await db.select().from(clientCompany)
      .where(eq(clientCompany.profileId, profile.id)).limit(1);
    if (comp) details = comp;
  }

  return { profile, details };
}

export async function createProfile(userId: string, body: {
  clientType: 'individual' | 'company'; countryCode: string;
  individual?: Individual; company?: Company;
}) {
  const existing = await db.select().from(clientProfiles)
    .where(eq(clientProfiles.userId, userId)).limit(1);
  if (existing.length > 0) throw new BadRequest('profile_already_exists');

  const displayName = body.clientType === 'individual'
    ? [body.individual?.firstName, body.individual?.lastName].filter(Boolean).join(' ') || null
    : body.company?.companyName || null;

  const [profile] = await db.insert(clientProfiles).values({
    userId,
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
}

export async function updateProfile(userId: string, body: {
  displayName?: string; countryCode?: string;
  individual?: Individual; company?: Company;
}) {
  const [profile] = await db.select().from(clientProfiles)
    .where(eq(clientProfiles.userId, userId)).limit(1);
  if (!profile) throw new NotFound('profile_not_found');

  const now = new Date();

  if (body.displayName !== undefined || body.countryCode !== undefined) {
    const upd: Record<string, unknown> = { updatedAt: now };
    if (body.displayName !== undefined) upd.displayName = body.displayName;
    if (body.countryCode !== undefined) upd.countryCode = body.countryCode;
    await db.update(clientProfiles).set(upd as Partial<typeof clientProfiles.$inferInsert>)
      .where(eq(clientProfiles.id, profile.id));
  }

  if (profile.clientType === 'individual' && body.individual) {
    const ind = body.individual;
    const upd: Record<string, unknown> = { updatedAt: now };
    for (const f of INDIVIDUAL_FIELDS) {
      if (ind[f] !== undefined) upd[f] = ind[f];
    }
    const [existing] = await db.select().from(clientIndividual)
      .where(eq(clientIndividual.profileId, profile.id)).limit(1);
    if (existing) {
      await db.update(clientIndividual).set(upd as Partial<typeof clientIndividual.$inferInsert>)
        .where(eq(clientIndividual.profileId, profile.id));
    } else {
      await db.insert(clientIndividual).values({ profileId: profile.id, ...upd } as typeof clientIndividual.$inferInsert);
    }
  }

  if (profile.clientType === 'company' && body.company) {
    const comp = body.company;
    const upd: Record<string, unknown> = { updatedAt: now };
    for (const f of COMPANY_FIELDS) {
      if (comp[f] !== undefined) upd[f] = comp[f];
    }
    const [existing] = await db.select().from(clientCompany)
      .where(eq(clientCompany.profileId, profile.id)).limit(1);
    if (existing) {
      await db.update(clientCompany).set(upd as Partial<typeof clientCompany.$inferInsert>)
        .where(eq(clientCompany.profileId, profile.id));
    } else {
      await db.insert(clientCompany).values({ profileId: profile.id, ...upd } as typeof clientCompany.$inferInsert);
    }
  }

  const [updated] = await db.select().from(clientProfiles)
    .where(eq(clientProfiles.id, profile.id)).limit(1);
  return { profile: updated };
}
