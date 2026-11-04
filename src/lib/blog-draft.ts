import { BLOG_VALIDATION } from '@/config/BlogAdmin';
import type { PostFormStateValues } from '@/lib/blog-validation';

const POST_DRAFT_VERSION = 1;
const POST_DRAFT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export interface PostDraftSnapshot {
  version: typeof POST_DRAFT_VERSION;
  savedAt: number;
  values: PostFormStateValues;
}

export function createPostDraftSnapshot(
  values: PostFormStateValues,
  savedAt = Date.now(),
): PostDraftSnapshot {
  return {
    version: POST_DRAFT_VERSION,
    savedAt,
    values,
  };
}

export function parsePostDraftSnapshot(
  raw: string,
  now = Date.now(),
): PostDraftSnapshot | null {
  try {
    const snapshot: unknown = JSON.parse(raw);
    if (!snapshot || typeof snapshot !== 'object') return null;

    const candidate = snapshot as Partial<PostDraftSnapshot>;
    const values = candidate.values;
    if (
      candidate.version !== POST_DRAFT_VERSION ||
      typeof candidate.savedAt !== 'number' ||
      !Number.isFinite(candidate.savedAt) ||
      candidate.savedAt > now + 5 * 60 * 1000 ||
      now - candidate.savedAt > POST_DRAFT_MAX_AGE_MS ||
      !values ||
      typeof values !== 'object' ||
      typeof values.title !== 'string' ||
      typeof values.slug !== 'string' ||
      typeof values.description !== 'string' ||
      typeof values.category !== 'string' ||
      typeof values.coverImage !== 'string' ||
      typeof values.tags !== 'string' ||
      typeof values.youtubeUrl !== 'string' ||
      typeof values.content !== 'string' ||
      values.content.length > BLOG_VALIDATION.content.maxCharacters ||
      typeof values.isPublished !== 'boolean'
    ) {
      return null;
    }

    return {
      version: POST_DRAFT_VERSION,
      savedAt: candidate.savedAt,
      values: {
        title: values.title,
        slug: values.slug,
        description: values.description,
        category: values.category,
        coverImage: values.coverImage,
        tags: values.tags,
        youtubeUrl: values.youtubeUrl,
        content: values.content,
        isPublished: values.isPublished,
      },
    };
  } catch {
    return null;
  }
}
