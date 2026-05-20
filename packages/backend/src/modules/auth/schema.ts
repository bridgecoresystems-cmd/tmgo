import { t } from 'elysia';

export const signInBody = t.Object({
  email: t.String({ format: 'email' }),
  password: t.String(),
  callbackURL: t.Optional(t.String()),
});

export const signUpBody = t.Object({
  email: t.String({ format: 'email' }),
  password: t.String(),
  name: t.Optional(t.String()),
  role: t.Optional(t.String()),
  callbackURL: t.Optional(t.String()),
});

export const changePasswordBody = t.Object({
  currentPassword: t.String(),
  newPassword: t.String(),
});

export const uploadAvatarBody = t.Object({
  file: t.File(),
});

export const updateProfileBody = t.Object({
  name: t.Optional(t.String()),
  phone: t.Optional(t.Nullable(t.String())),
});
