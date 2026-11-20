import 'server-only';
import { z } from 'zod';

import { lifeOuttakeSeeds } from '@/config/LifeOuttakes';
import { extractCoverId } from '@/lib/blog-validation';
import { getRedisClient } from '@/lib/redis-posts';

const LIFE_OUTTAKES_KEY = 'portfolio:life-outtakes';
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATIC_IMAGE_REGEX = /^\/assets\/life-outtakes\/[a-z0-9-]+\.webp$/i;

function isValidLifeOuttakeImage(value: string) {
  return extractCoverId(value) !== null || STATIC_IMAGE_REGEX.test(value);
}

const lifeOuttakeSchema = z.object({
  id: z.string().regex(UUID_REGEX),
  imageUrl: z.string().refine(isValidLifeOuttakeImage),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  caption: z.string().trim().min(1).max(240),
  altText: z.string().trim().min(1).max(200),
  collection: z.string().trim().max(40),
  isPublished: z.boolean(),
  order: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const lifeOuttakeFormSchema = z.object({
  id: z.string().regex(UUID_REGEX, 'The photo ID is invalid.').optional(),
  imageUrl: z
    .string()
    .trim()
    .min(1, 'Upload a photo before saving.')
    .refine(isValidLifeOuttakeImage, 'Choose a valid uploaded photo.'),
  width: z.preprocess(
    (value) =>
      value === '' || value === undefined ? undefined : Number(value),
    z.number().int().positive().max(12_000).optional(),
  ),
  height: z.preprocess(
    (value) =>
      value === '' || value === undefined ? undefined : Number(value),
    z.number().int().positive().max(12_000).optional(),
  ),
  caption: z
    .string()
    .trim()
    .min(1, 'Write a caption for this moment.')
    .max(240, 'Captions must be 240 characters or fewer.'),
  altText: z
    .string()
    .trim()
    .min(1, 'Add alt text describing the photo.')
    .max(200, 'Alt text must be 200 characters or fewer.'),
  collection: z
    .string()
    .trim()
    .max(40, 'Collections must be 40 characters or fewer.')
    .default(''),
  isPublished: z.boolean(),
});

export type LifeOuttake = z.infer<typeof lifeOuttakeSchema>;
export type LifeOuttakeFormValues = z.input<typeof lifeOuttakeFormSchema>;

function normalizeLifeOuttake(raw: unknown): LifeOuttake | null {
  let value = raw;
  while (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }

  const parsed = lifeOuttakeSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export async function getLifeOuttakes(): Promise<LifeOuttake[]> {
  const redis = getRedisClient();
  if (!redis) {
    return lifeOuttakeSeeds;
  }

  try {
    const records =
      (await redis.hgetall<Record<string, unknown>>(LIFE_OUTTAKES_KEY)) ?? {};

    const storedOuttakes = Object.values(records)
      .map(normalizeLifeOuttake)
      .filter((record): record is LifeOuttake => record !== null)
      .sort((a, b) => a.order - b.order);
    const storedIds = new Set(Object.keys(records));
    const seedOuttakes = lifeOuttakeSeeds.filter(
      (outtake) => !storedIds.has(outtake.id),
    );

    return [...seedOuttakes, ...storedOuttakes].sort(
      (a, b) => a.order - b.order,
    );
  } catch (error) {
    console.error('[life-outtakes] Failed to list photos from Redis:', error);
    throw new Error('Unable to load Life Outtakes from storage.', {
      cause: error,
    });
  }
}

export async function saveLifeOuttake(
  input: LifeOuttakeFormValues & { imageUrl: string },
): Promise<{ saved: LifeOuttake; previousImageUrl?: string }> {
  const redis = getRedisClient();
  if (!redis) {
    throw new Error(
      'Upstash Redis is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to manage Life Outtakes.',
    );
  }

  const allOuttakes = await getLifeOuttakes();
  const existing = input.id
    ? allOuttakes.find((outtake) => outtake.id === input.id)
    : undefined;
  if (input.id && !existing) {
    throw new Error('This photo no longer exists. Refresh and try again.');
  }

  const now = new Date().toISOString();
  const candidate = {
    id: existing?.id ?? crypto.randomUUID().toLowerCase(),
    imageUrl: input.imageUrl,
    width: input.width ?? existing?.width,
    height: input.height ?? existing?.height,
    caption: input.caption,
    altText: input.altText,
    collection: input.collection,
    isPublished: input.isPublished,
    order:
      existing?.order ??
      (allOuttakes.length
        ? Math.max(...allOuttakes.map((outtake) => outtake.order)) + 1
        : 0),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  const saved = lifeOuttakeSchema.parse(candidate);

  try {
    await redis.hset(LIFE_OUTTAKES_KEY, {
      [saved.id]: JSON.stringify(saved),
    });
  } catch (error) {
    console.error(`[life-outtakes] Failed to save photo ${saved.id}:`, error);
    throw new Error('Unable to save this photo to storage.', { cause: error });
  }

  return {
    saved,
    previousImageUrl:
      existing?.imageUrl !== saved.imageUrl ? existing?.imageUrl : undefined,
  };
}

export async function deleteLifeOuttake(id: string): Promise<LifeOuttake> {
  const redis = getRedisClient();
  if (!redis) {
    throw new Error(
      'Upstash Redis is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to manage Life Outtakes.',
    );
  }

  const existing = (await getLifeOuttakes()).find(
    (outtake) => outtake.id === id,
  );
  if (!existing) {
    throw new Error('This photo no longer exists.');
  }

  try {
    await redis.hset(LIFE_OUTTAKES_KEY, {
      [id]: JSON.stringify({ id, deletedAt: new Date().toISOString() }),
    });
    return existing;
  } catch (error) {
    console.error(`[life-outtakes] Failed to delete photo ${id}:`, error);
    throw new Error('Unable to delete this photo from storage.', {
      cause: error,
    });
  }
}

export async function moveLifeOuttake(
  id: string,
  direction: 'up' | 'down',
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    throw new Error(
      'Upstash Redis is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to manage Life Outtakes.',
    );
  }

  const outtakes = await getLifeOuttakes();
  const index = outtakes.findIndex((outtake) => outtake.id === id);
  const otherIndex = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || otherIndex < 0 || otherIndex >= outtakes.length) {
    return;
  }

  [outtakes[index].order, outtakes[otherIndex].order] = [
    outtakes[otherIndex].order,
    outtakes[index].order,
  ];
  outtakes[index].updatedAt = new Date().toISOString();
  outtakes[otherIndex].updatedAt = outtakes[index].updatedAt;

  try {
    await Promise.all(
      [outtakes[index], outtakes[otherIndex]].map((outtake) =>
        redis.hset(LIFE_OUTTAKES_KEY, {
          [outtake.id]: JSON.stringify(outtake),
        }),
      ),
    );
  } catch (error) {
    console.error(`[life-outtakes] Failed to reorder photo ${id}:`, error);
    throw new Error('Unable to reorder photos in storage.', { cause: error });
  }
}

export function getLifeOuttakeImageId(imageUrl: string): string | null {
  return extractCoverId(imageUrl);
}
