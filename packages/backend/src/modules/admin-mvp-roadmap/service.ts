import { db } from '../../db';
import { mvpRoadmapTaskProgress } from '../../db/schema';
import { MVP_ROADMAP_PHASES, allMvpRoadmapTaskIds } from '@tmgo/shared';
import { BadRequest } from '../../lib/errors';

const VALID_TASK_IDS = new Set(allMvpRoadmapTaskIds(MVP_ROADMAP_PHASES));

export async function getRoadmapProgress() {
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
}

export async function saveRoadmapProgress(
  userId: string,
  tasks: { taskId: string; isDone: boolean; notes: string }[],
) {
  if (!Array.isArray(tasks) || tasks.length === 0) throw new BadRequest('tasks array required');
  if (tasks.length > 200) throw new BadRequest('Too many tasks in one request');
  for (const item of tasks) {
    if (!VALID_TASK_IDS.has(item.taskId)) throw new BadRequest(`Invalid taskId: ${item.taskId}`);
    if (item.notes.length > 4000) throw new BadRequest('notes too long');
  }

  const now = new Date();
  for (const item of tasks) {
    await db
      .insert(mvpRoadmapTaskProgress)
      .values({
        taskId: item.taskId,
        isDone: item.isDone,
        notes: item.notes,
        updatedAt: now,
        updatedBy: userId,
      })
      .onConflictDoUpdate({
        target: mvpRoadmapTaskProgress.taskId,
        set: { isDone: item.isDone, notes: item.notes, updatedAt: now, updatedBy: userId },
      });
  }
  return { success: true as const, saved: tasks.length };
}
