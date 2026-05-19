import { t } from 'elysia';

export const patchProgressBody = t.Object({
  tasks: t.Array(
    t.Object({
      taskId: t.String({ minLength: 3, maxLength: 48 }),
      isDone: t.Boolean(),
      notes: t.String({ maxLength: 4000 }),
    }),
    { minItems: 1, maxItems: 200 },
  ),
});
