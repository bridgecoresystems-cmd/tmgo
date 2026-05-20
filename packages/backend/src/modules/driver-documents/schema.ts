import { t } from 'elysia';

export const createDocBody = t.Object({
  doc_type: t.String(),
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
  permission_zone: t.Optional(t.Nullable(t.String())),
  notes: t.Optional(t.Nullable(t.String())),
  scan_url: t.Optional(t.Nullable(t.String())),
});

export const patchDocBody = t.Object({
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
  permission_zone: t.Optional(t.Nullable(t.String())),
  notes: t.Optional(t.Nullable(t.String())),
  scan_url: t.Optional(t.Nullable(t.String())),
});

export const renewDocBody = t.Object({
  country: t.Optional(t.Nullable(t.String())),
  series: t.Optional(t.Nullable(t.String())),
  number: t.Optional(t.Nullable(t.String())),
  issued_by: t.Optional(t.Nullable(t.String())),
  issued_at: t.Optional(t.Nullable(t.String())),
  expires_at: t.Optional(t.Nullable(t.String())),
  place_of_birth: t.Optional(t.Nullable(t.String())),
  residential_address: t.Optional(t.Nullable(t.String())),
  license_categories: t.Optional(t.Nullable(t.String())),
  permission_zone: t.Optional(t.Nullable(t.String())),
  notes: t.Optional(t.Nullable(t.String())),
  scan_url: t.Optional(t.Nullable(t.String())),
});

export const uploadDocBody = t.Object({
  file: t.File(),
  doc_type: t.Optional(t.String()),
});
