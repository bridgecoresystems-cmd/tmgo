import { t } from 'elysia';

export const tIndividual = t.Optional(t.Object({
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

export const tCompany = t.Optional(t.Object({
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

export const createProfileBody = t.Object({
  clientType: t.Union([t.Literal('individual'), t.Literal('company')]),
  countryCode: t.String({ minLength: 2, maxLength: 2 }),
  individual: tIndividual,
  company: tCompany,
});

export const patchProfileBody = t.Object({
  displayName: t.Optional(t.String()),
  countryCode: t.Optional(t.String()),
  individual: tIndividual,
  company: tCompany,
});
