import type { Post } from '@/types/blog';
import { Redis } from '@upstash/redis';
import 'server-only';

export const REDIS_POSTS_HASH_KEY = 'portfolio:blog:posts';

let redisInstance: Redis | null = null;

/**
 * Returns the Upstash Redis client instance, or null if credentials are not configured.
 */
export function getRedisClient(): Redis | null {
  if (redisInstance) {
    return redisInstance;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) {
    return null;
  }

  redisInstance = new Redis({ url, token });
  return redisInstance;
}

/**
 * Normalizes a raw object/parsed record into a valid Post type with ISO strings.
 */
function normalizePost(raw: unknown): Post | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const p = raw as Partial<Post>;
  if (!p.slug || !p.title || !p.content) {
    return null;
  }

  const cover = p.coverImage || p.image || '';
  const isoDate = p.date
    ? new Date(p.date).toISOString()
    : new Date().toISOString();
  const isoUpdatedDate = p.updatedDate
    ? new Date(p.updatedDate).toISOString()
    : isoDate;

  return {
    slug: String(p.slug),
    title: String(p.title),
    description: String(p.description || ''),
    content: String(p.content),
    coverImage: cover,
    image: cover,
    category: p.category || 'Engineering',
    youtubeId: p.youtubeId ? String(p.youtubeId) : undefined,
    tags: Array.isArray(p.tags) ? p.tags.map(String) : [],
    date: isoDate,
    publishDate: isoDate,
    updatedDate: isoUpdatedDate,
    isPublished: Boolean(p.isPublished),
  };
}

/**
 * List all posts stored in Upstash Redis.
 * Returns an empty array if Redis is not configured or if an error occurs.
 */
export async function listRedisPosts(): Promise<Post[]> {
  try {
    const redis = getRedisClient();
    if (!redis) {
      return [];
    }

    const records =
      await redis.hgetall<Record<string, unknown>>(REDIS_POSTS_HASH_KEY);
    if (!records) {
      return [];
    }

    const posts: Post[] = [];
    for (const value of Object.values(records)) {
      let parsed = value;
      if (typeof value === 'string') {
        try {
          parsed = JSON.parse(value);
        } catch {
          continue;
        }
      }

      const post = normalizePost(parsed);
      if (post) {
        posts.push(post);
      }
    }

    return posts;
  } catch (error) {
    console.warn(
      '[redis-posts] Failed to list posts from Upstash Redis:',
      error,
    );
    return [];
  }
}

/**
 * Get a single post from Upstash Redis by slug.
 */
export async function getRedisPostBySlug(slug: string): Promise<Post | null> {
  try {
    const redis = getRedisClient();
    if (!redis) {
      return null;
    }

    const raw = await redis.hget<unknown>(REDIS_POSTS_HASH_KEY, slug);
    if (!raw) {
      return null;
    }

    let parsed = raw;
    if (typeof raw === 'string') {
      try {
        parsed = JSON.parse(raw);
      } catch {
        return null;
      }
    }

    return normalizePost(parsed);
  } catch (error) {
    console.warn(
      `[redis-posts] Failed to get post "${slug}" from Upstash Redis:`,
      error,
    );
    return null;
  }
}

/**
 * Save or update a post in Upstash Redis under the single hash keyed by slug.
 */
export async function saveRedisPost(post: Post): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    throw new Error(
      'Upstash Redis credentials are not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.',
    );
  }

  const normalized = normalizePost(post);
  if (!normalized) {
    throw new Error(
      'Invalid post data: slug, title, and content are required.',
    );
  }

  // Ensure updatedDate reflects current modification
  normalized.updatedDate = new Date().toISOString();

  await redis.hset(REDIS_POSTS_HASH_KEY, {
    [normalized.slug]: JSON.stringify(normalized),
  });
}

/**
 * Delete a post from Upstash Redis by slug.
 */
export async function deleteRedisPost(slug: string): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) {
    throw new Error(
      'Upstash Redis credentials are not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.',
    );
  }

  const deletedCount = await redis.hdel(REDIS_POSTS_HASH_KEY, slug);
  return deletedCount > 0;
}
