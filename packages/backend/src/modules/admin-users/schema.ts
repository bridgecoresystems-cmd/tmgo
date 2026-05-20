import { t } from 'elysia';

export const createUserBody = t.Object({
  email: t.String(),
  password: t.String(),
  name: t.Optional(t.String()),
  role: t.Union([t.Literal('admin'), t.Literal('dispatcher')]),
});

export const updateUserBody = t.Object({
  role: t.Optional(t.Union([
    t.Literal('client'),
    t.Literal('driver'),
    t.Literal('dispatcher'),
    t.Literal('admin'),
  ])),
  name: t.Optional(t.String()),
});

const extraPassportItem = t.Object({
  passport_series: t.Optional(t.Nullable(t.String())),
  passport_number: t.Optional(t.Nullable(t.String())),
  passport_issue_date: t.Optional(t.Nullable(t.String())),
  passport_expiry_date: t.Optional(t.Nullable(t.String())),
  passport_issued_by: t.Optional(t.Nullable(t.String())),
  place_of_birth: t.Optional(t.Nullable(t.String())),
  residential_address: t.Optional(t.Nullable(t.String())),
  passport_scan_url: t.Optional(t.Nullable(t.String())),
  is_active: t.Optional(t.Nullable(t.Boolean())),
});

export const updateDriverProfileBody = t.Object({
  surname: t.Optional(t.Nullable(t.String())),
  given_name: t.Optional(t.Nullable(t.String())),
  patronymic: t.Optional(t.Nullable(t.String())),
  date_of_birth: t.Optional(t.Nullable(t.String())),
  citizenship: t.Optional(t.Nullable(t.String())),
  gender: t.Optional(t.Nullable(t.String())),
  status: t.Optional(t.Nullable(t.String())),
  employment_category: t.Optional(t.Nullable(t.String())),
  company_name: t.Optional(t.Nullable(t.String())),
  license_number: t.Optional(t.Nullable(t.String())),
  license_expiry: t.Optional(t.Nullable(t.String())),
  license_categories: t.Optional(t.Nullable(t.String())),
  license_issue_date: t.Optional(t.Nullable(t.String())),
  license_issued_by: t.Optional(t.Nullable(t.String())),
  license_scan_url: t.Optional(t.Nullable(t.String())),
  has_international_license: t.Optional(t.Nullable(t.Boolean())),
  international_license_number: t.Optional(t.Nullable(t.String())),
  international_license_validity: t.Optional(t.Nullable(t.String())),
  last_medical_examination_date: t.Optional(t.Nullable(t.String())),
  hire_source: t.Optional(t.Nullable(t.String())),
  attached_documents: t.Optional(t.Nullable(t.String())),
  phone: t.Optional(t.Nullable(t.String())),
  additional_emails: t.Optional(t.Nullable(t.String())),
  inn: t.Optional(t.Nullable(t.String())),
  address: t.Optional(t.Nullable(t.String())),
  passport_series: t.Optional(t.Nullable(t.String())),
  passport_number: t.Optional(t.Nullable(t.String())),
  passport_issue_date: t.Optional(t.Nullable(t.String())),
  passport_expiry_date: t.Optional(t.Nullable(t.String())),
  passport_issued_by: t.Optional(t.Nullable(t.String())),
  place_of_birth: t.Optional(t.Nullable(t.String())),
  residential_address: t.Optional(t.Nullable(t.String())),
  passport_scan_url: t.Optional(t.Nullable(t.String())),
  passport_is_active: t.Optional(t.Nullable(t.Boolean())),
  permission_entry_zone: t.Optional(t.Nullable(t.String())),
  permission_issue_date: t.Optional(t.Nullable(t.String())),
  permission_validity_date: t.Optional(t.Nullable(t.String())),
  medical_certificate: t.Optional(t.Nullable(t.String())),
  medical_certificate_scan_url: t.Optional(t.Nullable(t.String())),
  technical_minimum_certificate: t.Optional(t.Nullable(t.String())),
  tachograph_card_number: t.Optional(t.Nullable(t.String())),
  other_permits: t.Optional(t.Nullable(t.String())),
  bank_name: t.Optional(t.Nullable(t.String())),
  bank_account: t.Optional(t.Nullable(t.String())),
  bank_bik: t.Optional(t.Nullable(t.String())),
  extra_passports: t.Optional(t.Array(extraPassportItem)),
  hidden_fields: t.Optional(t.Array(t.String())),
});

export const uploadFileBody = t.Object({ file: t.File() });

export const uploadExtraPassportBody = t.Object({
  file: t.File(),
  index: t.Optional(t.Union([t.Number(), t.String()])),
});

export const uploadDocumentBody = t.Object({
  file: t.File(),
  doc_type: t.Optional(t.String()),
});

export const updateDocumentBody = t.Object({
  country: t.Optional(t.Nullable(t.String())),
  series: t.Optional(t.Nullable(t.String())),
  number: t.Optional(t.Nullable(t.String())),
  issued_by: t.Optional(t.Nullable(t.String())),
  issued_at: t.Optional(t.Nullable(t.String())),
  expires_at: t.Optional(t.Nullable(t.String())),
  place_of_birth: t.Optional(t.Nullable(t.String())),
  residential_address: t.Optional(t.Nullable(t.String())),
  license_categories: t.Optional(t.Nullable(t.String())),
  allowed_classes: t.Optional(t.Array(t.String())),
  scan_url: t.Optional(t.Nullable(t.String())),
});

export const updateDocumentStatusBody = t.Object({ status: t.String() });

export const createDocumentBody = t.Object({
  doc_type: t.Union([
    t.Literal('passport'),
    t.Literal('drivers_license'),
    t.Literal('visa'),
    t.Literal('medical_certificate'),
    t.Literal('tachograph_card'),
    t.Literal('technical_minimum_cert'),
    t.Literal('adr_certificate'),
  ]),
  country: t.Optional(t.Nullable(t.String())),
  series: t.Optional(t.Nullable(t.String())),
  number: t.Optional(t.Nullable(t.String())),
  issued_by: t.Optional(t.Nullable(t.String())),
  issued_at: t.Optional(t.Nullable(t.String())),
  expires_at: t.Optional(t.Nullable(t.String())),
  place_of_birth: t.Optional(t.Nullable(t.String())),
  residential_address: t.Optional(t.Nullable(t.String())),
  license_categories: t.Optional(t.Nullable(t.String())),
  allowed_classes: t.Optional(t.Array(t.String())),
  scan_url: t.Optional(t.Nullable(t.String())),
});
