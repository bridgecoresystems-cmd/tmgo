/**
 * Redis URL: Railway often injects REDIS_URL from the Redis plugin; some setups use REDIS_PRIVATE_URL.
 * In production, if neither is set, BullMQ is disabled (no default to localhost — there is no local Redis on Railway).
 */
const explicitRedis = process.env.REDIS_URL || process.env.REDIS_PRIVATE_URL;
const REDIS_URL =
  explicitRedis ||
  (process.env.NODE_ENV === 'production' ? '' : 'redis://localhost:6379');

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

const parsed = REDIS_URL ? parseRedisUrl(REDIS_URL) : null;

/** True when Redis URL is available (BullMQ can run). */
export function isRedisConfigured(): boolean {
  return parsed !== null;
}

/** Connection options for BullMQ Queue (maxRetriesPerRequest: 20 by default). */
export const queueConnection = parsed
  ? {
      ...parsed,
      maxRetriesPerRequest: 20,
      enableReadyCheck: true,
      retryStrategy(times: number) {
        return Math.min(times * 100, 3000);
      },
    }
  : null;

/** Connection options for BullMQ Worker — maxRetriesPerRequest: null required for blocking. */
export const workerConnection = parsed
  ? {
      ...parsed,
      maxRetriesPerRequest: null as number | null,
      enableReadyCheck: true,
      retryStrategy(times: number) {
        return Math.min(times * 100, 3000);
      },
    }
  : null;
