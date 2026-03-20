import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { mvpRoadmapTaskProgress } from '../../db/schema';
import { getUserFromRequest } from '../../lib/auth';
import { MVP_ROADMAP_PHASES, allMvpRoadmapTaskIds } from '@tmgo/shared';

const VALID_TASK_IDS = new Set(allMvpRoadmapTaskIds(MVP_ROADMAP_PHASES));

async function requireAdmin(request: Request, set: { status?: number }) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== 'admin') {
    set.status = 401;
    throw new Error('Unauthorized');
  }
  return user;
}

export const adminMvpRoadmapRoutes = new Elysia({ prefix: '/admin/mvp-roadmap' })
  .get('/progress', async ({ request, set }) => {
    await requireAdmin(request, set);
    const rows = await db.select().from(mvpRoadmapTaskProgress);
    return {
      tasks: rows.map((r) => ({
        taskId: r.taskId,
        isDone: r.isDone,
        notes: r.notes,
        updatedAt: r.updatedAt?.toISOString() ?? null,
        updatedBy: r.updatedBy,
      })),
    };
  })
  .patch('/progress', async ({ request, set, body }) => {
    const user = await requireAdmin(request, set);
    const now = new Date();
    if (!Array.isArray(body.tasks) || body.tasks.length === 0) {
      set.status = 400;
      return { error: 'tasks array required' };
    }
    if (body.tasks.length > 200) {
      set.status = 400;
      return { error: 'Too many tasks in one request' };
    }
    for (const item of body.tasks) {
      if (!VALID_TASK_IDS.has(item.taskId)) {
        set.status = 400;
        return { error: `Invalid taskId: ${item.taskId}` };
      }
      if (item.notes.length > 4000) {
        set.status = 400;
        return { error: 'notes too long' };
      }
    }
    for (const item of body.tasks) {
      await db
        .insert(mvpRoadmapTaskProgress)
        .values({
          taskId: item.taskId,
          isDone: item.isDone,
          notes: item.notes,
          updatedAt: now,
          updatedBy: user.id,
        })
        .onConflictDoUpdate({
          target: mvpRoadmapTaskProgress.taskId,
          set: {
            isDone: item.isDone,
            notes: item.notes,
            updatedAt: now,
            updatedBy: user.id,
          },
        });
    }
    return { success: true as const, saved: body.tasks.length };
  }, {
    body: t.Object({
      tasks: t.Array(
        t.Object({
          taskId: t.String({ minLength: 3, maxLength: 48 }),
          isDone: t.Boolean(),
          notes: t.String({ maxLength: 4000 }),
        }),
        { minItems: 1, maxItems: 200 },
      ),
    }),
  });
