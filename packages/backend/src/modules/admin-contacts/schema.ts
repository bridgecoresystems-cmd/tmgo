import { t } from 'elysia';

export const updateStatusBody = t.Object({
  status: t.String(),
});
