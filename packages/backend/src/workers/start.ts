/**
 * Standalone worker process. Use when running workers separately from API.
 * Example: bun run src/workers/start.ts
 */

import { startWorker } from '../lib/queues';

startWorker()
  .then((worker) => {
    if (!worker) {
      console.error('[BullMQ] Redis not configured — set REDIS_URL (or REDIS_PRIVATE_URL).');
      process.exit(1);
    }
    console.log('[BullMQ] Worker running. Press Ctrl+C to stop.');
  })
  .catch((err) => {
    console.error('[BullMQ] Worker failed:', err);
    process.exit(1);
  });
