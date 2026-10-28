import { Redis } from '@upstash/redis';
import 'server-only';

import { normalizeProjectRecord } from '@/lib/project-validation';
import type { ProjectRecord } from '@/lib/project-validation';

export const REDIS_PROJECTS_HASH_KEY = 'portfolio:projects';

let redisInstance: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (redisInstance) {
    return redisInstance;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) {
    return null;
  }

  redisInstance = new Redis({ url, token, cache: 'default' });
  return redisInstance;
}

function parseRedisValue<T = unknown>(raw: unknown): T | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  let value = raw;
  while (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      break;
    }
  }

  return value && typeof value === 'object' ? (value as T) : null;
}

export async function listRedisProjects(): Promise<ProjectRecord[]> {
  try {
    const redis = getRedisClient();
    if (!redis) {
      return [];
    }

    const records = await redis.hgetall<Record<string, unknown>>(
      REDIS_PROJECTS_HASH_KEY,
    );
    if (!records) {
      return [];
    }

    const results: ProjectRecord[] = [];
    for (const value of Object.values(records)) {
      const normalized = normalizeProjectRecord(parseRedisValue(value));
      if (normalized) {
        results.push(normalized);
      }
    }

    return results.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch (error) {
    console.error(
      '[redis-projects] Failed to list project records from Redis:',
      error,
    );
    return [];
  }
}

export async function getRedisProjectBySlug(
  slug: string,
): Promise<ProjectRecord | null> {
  const normalizedSlug = slug.trim().toLowerCase();
  if (!normalizedSlug) {
    return null;
  }

  try {
    const redis = getRedisClient();
    if (!redis) {
      return null;
    }

    const raw = await redis.hget<unknown>(
      REDIS_PROJECTS_HASH_KEY,
      normalizedSlug,
    );
    if (!raw) {
      return null;
    }

    return normalizeProjectRecord(parseRedisValue(raw));
  } catch (error) {
    console.error(
      `[redis-projects] Failed to fetch project "${slug}" from Redis:`,
      error,
    );
    return null;
  }
}

export async function saveProjectRecord(project: ProjectRecord): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    return;
  }

  const normalized = normalizeProjectRecord(project);
  if (!normalized) {
    throw new Error('Project record is invalid and cannot be saved.');
  }

  const prepared = {
    ...normalized,
    updatedAt: new Date().toISOString(),
  };

  await redis.hset(REDIS_PROJECTS_HASH_KEY, {
    [prepared.slug]: JSON.stringify(prepared),
  });
}

export async function deleteProjectRecord(slug: string): Promise<boolean> {
  const normalizedSlug = slug.trim().toLowerCase();
  if (!normalizedSlug) {
    return false;
  }

  const redis = getRedisClient();
  if (!redis) {
    return false;
  }

  const deleted = await redis.hdel(REDIS_PROJECTS_HASH_KEY, normalizedSlug);
  return Number(deleted) > 0;
}
