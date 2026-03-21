import { Queue, Worker } from 'bullmq';
import { isRedisConfigured, queueConnection, workerConnection } from './redis';
import { checkExpiringDocuments } from './document-expiry';

const QUEUE_NAME = 'tmgo-jobs';

export const documentExpiryJobName = 'document-expiry-check';

let queueInstance: Queue | null = null;

/** Queue for adding jobs. Reuses connection. */
export function getQueue(): Queue {
  if (!queueConnection) {
    throw new Error('Redis is not configured (set REDIS_URL or REDIS_PRIVATE_URL)');
  }
  if (!queueInstance) {
    queueInstance = new Queue(QUEUE_NAME, { connection: queueConnection });
  }
  return queueInstance;
}

/** Start worker and schedule repeatable jobs. Call once at app startup. */
export async function startWorker(): Promise<Worker | undefined> {
  if (!isRedisConfigured() || !queueConnection || !workerConnection) {
    console.warn(
      '[BullMQ] Redis not configured — background worker skipped. On Railway: add a Redis service and set REDIS_URL (or reference REDIS_PRIVATE_URL).',
    );
    return undefined;
  }

  const queue = getQueue();

  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      if (job.name === documentExpiryJobName) {
        await checkExpiringDocuments();
      }
    },
    { connection: workerConnection },
  );

  worker.on('completed', (job) => {
    console.log(`[BullMQ] Job ${job.id} (${job.name}) completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[BullMQ] Job ${job?.id} (${job?.name}) failed:`, err);
  });

  // Schedule document expiry check daily at 6:00 AM
  await queue.add(
    documentExpiryJobName,
    {},
    {
      repeat: { pattern: '0 0 6 * * *' },
      jobId: 'document-expiry-daily',
    },
  );

  console.log('[BullMQ] Worker started, document-expiry-check scheduled daily at 6:00');
  return worker;
}
