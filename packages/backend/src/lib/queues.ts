import { Queue, Worker } from 'bullmq';
import { queueConnection, workerConnection } from './redis';
import { checkExpiringDocuments } from './document-expiry';

const QUEUE_NAME = 'tmgo-jobs';

export const documentExpiryJobName = 'document-expiry-check';

let queueInstance: Queue | null = null;

/** Queue for adding jobs. Reuses connection. */
export function getQueue(): Queue {
  if (!queueInstance) {
    queueInstance = new Queue(QUEUE_NAME, { connection: queueConnection });
  }
  return queueInstance;
}

/** Start worker and schedule repeatable jobs. Call once at app startup. */
export async function startWorker(): Promise<Worker> {
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
