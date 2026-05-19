import { t } from 'elysia';

export const createCitizenshipBody = t.Object({
  country: t.String(),
  acquired_at: t.Optional(t.Nullable(t.String())),
  scan_url: t.Optional(t.Nullable(t.String())),
});

export const revokeCitizenshipBody = t.Optional(t.Object({}));
