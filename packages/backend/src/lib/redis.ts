const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

function parseRedisUrl(url: string): { host: string; port: number; username?: string; password?: string; db?: number } {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || 'localhost',
      port: parsed.port ? parseInt(parsed.port, 10) : 6379,
      username: parsed.username || undefined,
      password: parsed.password || undefined,
      db: parsed.pathname && parsed.pathname.length > 1 ? parseInt(parsed.pathname.slice(1), 10) : undefined,
    };
  } catch {
    return { host: 'localhost', port: 6379 };
  }
}

const parsed = parseRedisUrl(REDIS_URL);

/** Connection options for BullMQ Queue (maxRetriesPerRequest: 20 by default). */
export const queueConnection = {
  ...parsed,
  maxRetriesPerRequest: 20,
  enableReadyCheck: true,
  retryStrategy(times: number) {
    return Math.min(times * 100, 3000);
  },
};

/** Connection options for BullMQ Worker — maxRetriesPerRequest: null required for blocking. */
export const workerConnection = {
  ...parsed,
  maxRetriesPerRequest: null as number | null,
  enableReadyCheck: true,
  retryStrategy(times: number) {
    return Math.min(times * 100, 3000);
  },
};
