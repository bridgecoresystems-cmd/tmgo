import { t } from 'elysia';

// Загрузка вложения в чат — одна картинка за раз.
export const uploadBody = t.Object({ file: t.File() });
