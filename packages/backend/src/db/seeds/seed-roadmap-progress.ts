import { db } from '../index';
import { mvpRoadmapTaskProgress } from '../schema';

// Tasks confirmed done based on code: modules, pages, schema files present in the repo.
// Remaining (not in this set) = still to do.
const DONE_TASKS = new Set([
  // Phase 1 — Фундамент (all 30)
  't-1-0', 't-1-1', 't-1-2',
  't-2-0', 't-2-1', 't-2-2',
  't-3-0', 't-3-1', 't-3-2',
  't-4-0', 't-4-1', 't-4-2',
  't-5-0', 't-5-1', 't-5-2',
  't-6-0', 't-6-1', 't-6-2',
  't-7-0', 't-7-1', 't-7-2',
  't-8-0', 't-8-1', 't-8-2',
  't-9-0', 't-9-1', 't-9-2',
  't-10-0', 't-10-1', 't-10-2',

  // Phase 2 — Заявки, доска, гео-поиск (all 45)
  't-11-0', 't-11-1', 't-11-2',
  't-12-0', 't-12-1', 't-12-2',
  't-13-0', 't-13-1', 't-13-2',
  't-14-0', 't-14-1', 't-14-2',
  't-15-0', 't-15-1', 't-15-2',
  't-16-0', 't-16-1', 't-16-2',
  't-17-0', 't-17-1', 't-17-2',
  't-18-0', 't-18-1', 't-18-2',
  't-19-0', 't-19-1', 't-19-2',
  't-20-0', 't-20-1', 't-20-2',
  't-21-0', 't-21-1', 't-21-2',
  't-22-0', 't-22-1', 't-22-2',
  't-23-0', 't-23-1', 't-23-2',
  't-24-0', 't-24-1', 't-24-2',
  't-25-0', 't-25-1', 't-25-2',

  // Phase 3 — Чат, трекинг, отзывы (41/45)
  't-26-0', 't-26-1', 't-26-2',
  't-27-0', 't-27-1', 't-27-2',
  't-28-0', 't-28-1', 't-28-2',
  't-29-0', 't-29-1', 't-29-2',
  't-30-0', 't-30-1', 't-30-2',
  't-31-0', 't-31-1', 't-31-2',
  't-32-0', 't-32-1', 't-32-2',
  't-33-0', 't-33-1', 't-33-2',
  't-34-0', 't-34-1', 't-34-2',
  't-35-0', 't-35-1', 't-35-2',
  't-36-0', 't-36-1', 't-36-2',
  't-37-0', 't-37-1', 't-37-2',
  't-38-0', 't-38-1',
  // t-38-2: BullMQ review reminder — NOT done
  // t-39-0: sort by rating — NOT done
  't-39-1', 't-39-2',
  't-40-0', 't-40-1', 't-40-2',

  // Phase 4 — Мобайл и запуск (partial)
  't-41-0', 't-41-1', 't-41-2',  // Capacitor + Android setup
  // t-42-0: @capacitor/geolocation — NOT done
  // t-42-1: watchPosition — NOT done
  't-42-2',  // Mailing система
  // t-43-*: mobile UI polish — NOT done
  // t-44-*: camera plugin, Android device test — NOT done
  't-45-0', 't-45-1', 't-45-2',  // CI/CD, VPS deploy, SSL
  // t-46-*: formal E2E testing — NOT done
  't-47-0', 't-47-1', 't-47-2',  // bug fixes, indexes, rate limiting
  // t-48-*: APK release, beta users, feedback — NOT done
  // t-49-0: fix from feedback — NOT done
  't-49-1', 't-49-2',  // admin extras, legal pages
  // t-50-*: Google Play, security review, launch — NOT done
]);

const ALL_TASK_IDS: string[] = [];
for (let day = 1; day <= 50; day++) {
  for (let i = 0; i <= 2; i++) {
    ALL_TASK_IDS.push(`t-${day}-${i}`);
  }
}

async function seedRoadmapProgress() {
  let inserted = 0;
  let skipped = 0;

  for (const taskId of ALL_TASK_IDS) {
    const result = await db
      .insert(mvpRoadmapTaskProgress)
      .values({
        taskId,
        isDone: DONE_TASKS.has(taskId),
        notes: '',
        updatedAt: new Date(),
      })
      .onConflictDoNothing();

    if ((result.rowCount ?? 0) > 0) inserted++;
    else skipped++;
  }

  console.log(`Roadmap progress seeded: ${inserted} inserted, ${skipped} skipped (already exist)`);
  console.log(`Done: ${DONE_TASKS.size}/150, Remaining: ${150 - DONE_TASKS.size}/150`);
}

seedRoadmapProgress().catch(console.error).finally(() => process.exit(0));
