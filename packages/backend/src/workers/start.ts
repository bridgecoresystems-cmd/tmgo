/**
 * Standalone worker process. Use when running workers separately from API.
 * Example: bun run src/workers/start.ts
 */

import { startWorker } from '../lib/queues';

startWorker()
  .then(() => {
    console.log('[BullMQ] Worker running. Press Ctrl+C to stop.');
  })
  .catch((err) => {
    console.error('[BullMQ] Worker failed:', err);
    process.exit(1);
  });
