import 'server-only';

import { getRedisClient } from '@/lib/redis-posts';

export interface StoredCoverRecord {
  mime: string;
  data: string; // base64 string
  size: number;
  createdAt: string;
}

const COVER_KEY_PREFIX = 'blog:cover:';
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Safely parses Redis values which may be returned as raw strings or auto-deserialized objects.
 */
function parseCoverRecord(raw: unknown): StoredCoverRecord | null {
  if (!raw) return null;
  let val = raw;
  while (typeof val === 'string') {
    try {
      val = JSON.parse(val);
    } catch {
      break;
    }
  }

  if (!val || typeof val !== 'object') {
    return null;
  }

  const record = val as Partial<StoredCoverRecord>;
  if (
    typeof record.mime !== 'string' ||
    typeof record.data !== 'string' ||
    !record.mime.trim() ||
    !record.data.trim()
  ) {
    return null;
  }

  return {
    mime: record.mime.trim().toLowerCase(),
    data: record.data,
    size: typeof record.size === 'number' ? record.size : 0,
    createdAt:
      typeof record.createdAt === 'string'
        ? record.createdAt
        : new Date().toISOString(),
  };
}

/**
 * Stores a cover image buffer in Upstash Redis as a base64-encoded record.
 * Returns the generated UUID identifier.
 */
export async function saveCover(buffer: Buffer, mime: string): Promise<string> {
  const redis = getRedisClient();
  if (!redis) {
    throw new Error(
      'Upstash Redis credentials are not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.',
    );
  }

  const id = crypto.randomUUID().toLowerCase();
  const key = `${COVER_KEY_PREFIX}${id}`;
  const record: StoredCoverRecord = {
    mime: mime.trim().toLowerCase(),
    data: buffer.toString('base64'),
    size: buffer.length,
    createdAt: new Date().toISOString(),
  };

  try {
    await redis.set(key, JSON.stringify(record));
    return id;
  } catch (error) {
    console.error(`[redis-covers] Failed to save cover image ${id}:`, error);
    throw error;
  }
}

/**
 * Retrieves a cover image by ID from Upstash Redis and decodes it back to a Buffer.
 * Returns null if the cover does not exist or fails validation.
 */
export async function getCover(
  id: string,
): Promise<{ mime: string; buffer: Buffer } | null> {
  const cleanId = id.trim().toLowerCase();
  if (!UUID_REGEX.test(cleanId)) {
    return null;
  }

  const redis = getRedisClient();
  if (!redis) {
    return null;
  }

  const key = `${COVER_KEY_PREFIX}${cleanId}`;
  try {
    const raw = await redis.get<unknown>(key);
    if (!raw) {
      return null;
    }

    const record = parseCoverRecord(raw);
    if (!record) {
      console.warn(`[redis-covers] Corrupt cover record for id ${cleanId}`);
      return null;
    }

    const buffer = Buffer.from(record.data, 'base64');
    return {
      mime: record.mime,
      buffer,
    };
  } catch (error) {
    console.error(
      `[redis-covers] Failed to fetch cover image ${cleanId} from Redis:`,
      error,
    );
    return null;
  }
}

/**
 * Deletes a cover image from Upstash Redis by UUID.
 */
export async function deleteCover(id: string): Promise<boolean> {
  const cleanId = id.trim().toLowerCase();
  if (!UUID_REGEX.test(cleanId)) {
    return false;
  }

  const redis = getRedisClient();
  if (!redis) {
    return false;
  }

  const key = `${COVER_KEY_PREFIX}${cleanId}`;
  try {
    const deletedCount = await redis.del(key);
    return deletedCount > 0;
  } catch (error) {
    console.error(
      `[redis-covers] Failed to delete cover image ${cleanId}:`,
      error,
    );
    return false;
  }
}
