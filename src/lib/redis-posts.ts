import { Redis } from '@upstash/redis';
import 'server-only';

import { calculateReadingTime } from '@/lib/blog-reading-time';
import { normalizeSlug } from '@/lib/blog-validation';
import { preprocessMdxContent } from '@/lib/mdx-sanitize';
import type { Post } from '@/types/blog';

export const REDIS_POSTS_HASH_KEY = 'portfolio:blog:posts';
const REDIS_POSTS_METADATA_HASH_KEY = 'portfolio:blog:post-metadata';
const REDIS_POSTS_METADATA_VERSION_KEY = 'portfolio:blog:post-metadata-version';
const REDIS_POSTS_METADATA_VERSION = '1';

export type RedisPostMetadata = Omit<Post, 'content'>;

const LIST_POST_METADATA_SCRIPT = `
if redis.call('GET', KEYS[3]) ~= ARGV[1] then
  local records = redis.call('HGETALL', KEYS[1])
  for index = 1, #records, 2 do
    local field = records[index]
    local ok, post = pcall(cjson.decode, records[index + 1])
    if ok and type(post) == 'table' and post.title then
      local metadata = {
        slug = post.slug or field,
        title = post.title,
        excerpt = post.description or '',
        category = post.category or 'Engineering',
        tags = post.tags or {},
        date = post.date,
        isPublished = post.isPublished
      }
      metadata.coverImage = post.coverImage or post.image
      metadata.image = post.image or post.coverImage
      metadata.youtubeId = post.youtubeId
      metadata.publishDate = post.publishDate
      metadata.updatedDate = post.updatedDate
      metadata.readingTime = post.readingTime
      redis.call('HSET', KEYS[2], field, cjson.encode(metadata))
    end
  end
  redis.call('SET', KEYS[3], ARGV[1])
end
return redis.call('HGETALL', KEYS[2])
`;

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

  redisInstance = new Redis({
    url,
    token,
    cache: 'default',
  });
  return redisInstance;
}

/**
 * Checks whether an error is Next.js internal dynamic-server bail-out error.
 * These errors must NEVER be swallowed, or Next.js static prerendering fails.
 */
function isDynamicServerError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  return (
    'digest' in error &&
    (error as { digest?: string }).digest === 'DYNAMIC_SERVER_USAGE'
  );
}

/**
 * Safely parses any date representation into an ISO string.
 * Falls back to the provided fallback or current ISO time if parsing fails or produces NaN.
 */
function safeIsoDate(input: unknown, fallback?: string): string {
  if (
    typeof input === 'string' ||
    typeof input === 'number' ||
    input instanceof Date
  ) {
    const d = new Date(input);
    if (!Number.isNaN(d.getTime())) {
      return d.toISOString();
    }
  }
  return fallback ?? new Date().toISOString();
}

/**
 * Tolerate both raw JSON strings and Upstash auto-deserialized objects.
 */
function parseRedisValue<T = unknown>(raw: unknown): T | null {
  if (raw === null || raw === undefined) return null;
  let val = raw;
  while (typeof val === 'string') {
    try {
      val = JSON.parse(val);
    } catch {
      break;
    }
  }
  return (val && typeof val === 'object' ? val : null) as T | null;
}

/**
 * Normalizes a raw object/parsed record into a valid Post type with ISO strings and safe defaults.
 */
export function normalizePostMetadata(raw: unknown): RedisPostMetadata | null {
  const parsed = parseRedisValue<
    Partial<Post> & {
      excerpt?: unknown;
    }
  >(raw);
  if (!parsed || typeof parsed !== 'object') {
    return null;
  }

  const slug = normalizeSlug(parsed.slug);
  const title = typeof parsed.title === 'string' ? parsed.title.trim() : '';
  if (!slug || !title) {
    return null;
  }

  const description =
    typeof parsed.description === 'string'
      ? parsed.description.trim()
      : typeof parsed.excerpt === 'string'
        ? parsed.excerpt.trim()
        : '';
  const rawCover = parsed.coverImage || parsed.image;
  const coverImage =
    typeof rawCover === 'string' && rawCover.trim().length > 0
      ? rawCover.trim()
      : undefined;

  const rawYoutube = parsed.youtubeId;
  const youtubeId =
    typeof rawYoutube === 'string' && rawYoutube.trim().length > 0
      ? rawYoutube.trim()
      : undefined;

  const rawTags = parsed.tags;
  const tags = Array.isArray(rawTags)
    ? rawTags.map((t) => String(t).trim()).filter(Boolean)
    : [];

  const isoDate = safeIsoDate(parsed.date);
  const isoUpdatedDate = safeIsoDate(parsed.updatedDate, isoDate);

  // Coerce isPublished strictly to boolean (handles "true", "1", true, etc.)
  const rawIsPub = (parsed as Record<string, unknown>).isPublished;
  let isPublished = false;
  if (typeof rawIsPub === 'boolean') {
    isPublished = rawIsPub;
  } else if (typeof rawIsPub === 'string') {
    const lower = rawIsPub.trim().toLowerCase();
    isPublished = lower === 'true' || lower === '1';
  } else if (typeof rawIsPub === 'number') {
    isPublished = rawIsPub === 1;
  }

  const readingTime =
    typeof parsed.readingTime === 'string' &&
    parsed.readingTime.trim().length > 0
      ? parsed.readingTime.trim()
      : undefined;

  return {
    slug,
    title,
    description,
    coverImage,
    image: coverImage,
    category:
      typeof parsed.category === 'string' && parsed.category.trim().length > 0
        ? parsed.category.trim()
        : 'Engineering',
    youtubeId,
    tags,
    date: isoDate,
    publishDate: isoDate,
    updatedDate: isoUpdatedDate,
    isPublished,
    readingTime,
  };
}

/**
 * Normalizes a complete post record, including its MDX body.
 */
export function normalizePost(raw: unknown): Post | null {
  const parsed = parseRedisValue<Partial<Post>>(raw);
  if (!parsed || typeof parsed.content !== 'string') {
    return null;
  }

  const content = preprocessMdxContent(parsed.content);
  if (!content) {
    return null;
  }

  const metadata = normalizePostMetadata(parsed);
  return metadata
    ? {
        ...metadata,
        content,
        readingTime: metadata.readingTime || calculateReadingTime(content),
      }
    : null;
}

/**
 * List metadata for posts stored in Upstash Redis without transferring MDX bodies.
 * Returns an empty array if Redis is not configured or if an error occurs.
 */
export async function listRedisPosts(): Promise<RedisPostMetadata[]> {
  try {
    const redis = getRedisClient();
    if (!redis) {
      return [];
    }

    const records = await redis.eval<unknown[]>(
      LIST_POST_METADATA_SCRIPT,
      [
        REDIS_POSTS_HASH_KEY,
        REDIS_POSTS_METADATA_HASH_KEY,
        REDIS_POSTS_METADATA_VERSION_KEY,
      ],
      [REDIS_POSTS_METADATA_VERSION],
    );
    if (!Array.isArray(records)) {
      return [];
    }

    const posts: RedisPostMetadata[] = [];
    for (let index = 1; index < records.length; index += 2) {
      try {
        const post = normalizePostMetadata(records[index]);
        if (post) {
          posts.push(post);
        }
      } catch (postError) {
        console.warn(
          '[redis-posts] Failed to normalize post record, skipping:',
          postError,
        );
      }
    }

    return posts;
  } catch (error) {
    if (isDynamicServerError(error)) {
      throw error;
    }
    console.error(
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
  const normalizedSlug = normalizeSlug(slug);
  if (!normalizedSlug) {
    return null;
  }

  try {
    const redis = getRedisClient();
    if (!redis) {
      return null;
    }

    let raw = await redis.hget<unknown>(REDIS_POSTS_HASH_KEY, normalizedSlug);
    // Tolerate historical unnormalized slugs if direct lookup misses
    if (!raw && slug !== normalizedSlug) {
      raw = await redis.hget<unknown>(REDIS_POSTS_HASH_KEY, slug);
    }

    if (!raw) {
      return null;
    }

    return normalizePost(raw);
  } catch (error) {
    if (isDynamicServerError(error)) {
      throw error;
    }
    console.error(
      `[redis-posts] Failed to get post "${normalizedSlug}" from Upstash Redis:`,
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

  const metadata = {
    slug: normalized.slug,
    title: normalized.title,
    excerpt: normalized.description,
    coverImage: normalized.coverImage,
    image: normalized.image,
    category: normalized.category,
    youtubeId: normalized.youtubeId,
    tags: normalized.tags,
    date: normalized.date,
    publishDate: normalized.publishDate,
    updatedDate: normalized.updatedDate,
    isPublished: normalized.isPublished,
    readingTime: normalized.readingTime,
  };

  try {
    await redis.hset(REDIS_POSTS_HASH_KEY, {
      [normalized.slug]: JSON.stringify(normalized),
    });
    await redis.hset(REDIS_POSTS_METADATA_HASH_KEY, {
      [normalized.slug]: JSON.stringify(metadata),
    });
  } catch (error) {
    console.error(
      `[redis-posts] Failed to save post "${normalized.slug}" to Upstash Redis:`,
      error,
    );
    throw error;
  }
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

  const normalizedSlug = normalizeSlug(slug);
  try {
    let deletedCount = await redis.hdel(REDIS_POSTS_HASH_KEY, normalizedSlug);
    if (deletedCount === 0 && slug !== normalizedSlug) {
      deletedCount = await redis.hdel(REDIS_POSTS_HASH_KEY, slug);
    }
    await redis.hdel(REDIS_POSTS_METADATA_HASH_KEY, normalizedSlug);
    if (slug !== normalizedSlug) {
      await redis.hdel(REDIS_POSTS_METADATA_HASH_KEY, slug);
    }
    return deletedCount > 0;
  } catch (error) {
    console.error(
      `[redis-posts] Failed to delete post "${normalizedSlug}" from Upstash Redis:`,
      error,
    );
    throw error;
  }
}
