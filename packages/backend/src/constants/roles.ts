// Единственный источник правды по ролям пользователей.
// Никаких магических строк 'admin'/'driver' в коде — только через ROLES.
export const ROLES = {
  CLIENT: 'client',
  DRIVER: 'driver',
  DISPATCHER: 'dispatcher',
  ADMIN: 'admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
