import { t } from 'elysia';

export const contactBody = t.Object({
  name: t.String(),
  email: t.String(),
  message: t.String(),
});
