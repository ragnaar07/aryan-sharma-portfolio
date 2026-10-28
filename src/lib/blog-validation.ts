import { z } from 'zod';

import {
  BLOG_CATEGORIES,
  BLOG_VALIDATION,
  adminBlogLabels,
} from '@/config/BlogAdmin';

/**
 * Universal slug normalizer: ensures identical slug behavior across writes and reads.
 * Strips accents, lowers case, trims leading/trailing slashes and punctuation, collapses hyphens.
 */
export function normalizeSlug(input: unknown): string {
  if (typeof input !== 'string' && typeof input !== 'number') {
    return '';
  }
  let s = String(input).trim();
  try {
    s = decodeURIComponent(s);
  } catch {
    // Continue with raw string on malformed URI components
  }
  return s
    .toLowerCase()
    .trim()
    .replace(/^[/\\]+|[/\\]+$/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Extracts a cover image UUID from an internal cover URL.
 * Matches: /api/blog/cover/<uuid>
 */
export function extractCoverId(url?: string | null): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }
  const match = url
    .trim()
    .match(
      /^\/api\/blog\/cover\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i,
    );
  return match ? match[1].toLowerCase() : null;
}

/**
 * Validates a cover image value.
 * Accepts:
 * - Empty string or null/undefined
 * - External HTTPS URL (https://...)
 * - Static path starting with "/" (excluding /api/)
 * - Internal uploaded cover URL (/api/blog/cover/<uuid>)
 * Strictly rejects: javascript:, data:, http:, and other schemes.
 */
export function isValidCoverImage(val?: string | null): boolean {
  if (!val || !val.trim()) {
    return true; // Empty is permitted; frontend/schema can supply fallback
  }

  const trimmed = val.trim();

  // Reject dangerous pseudo-protocols or unencrypted schemes
  if (/^(javascript|data|vbscript|file|blob|http):/i.test(trimmed)) {
    return false;
  }

  // Allow external HTTPS URLs
  if (/^https:\/\/[^\s$.?#].[^\s]*$/i.test(trimmed)) {
    return true;
  }

  // Allow uploaded cover URL pattern: /api/blog/cover/<uuid>
  if (
    /^\/api\/blog\/cover\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      trimmed,
    )
  ) {
    return true;
  }

  // Allow static paths like /blog/... or /assets/... (not starting with /api/)
  if (/^\/(?!api\/)[^\s]+$/i.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Extracts an 11-character YouTube video ID from a URL or raw ID string.
 * Returns null if the input is empty or invalid.
 */
export function extractYouTubeVideoId(input?: string | null): string | null {
  if (!input || !input.trim()) {
    return null;
  }

  const trimmed = input.trim();

  // Direct 11-character video ID format
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(
      trimmed.startsWith('http') ? trimmed : `https://${trimmed}`,
    );
    const hostname = url.hostname.replace(/^www\./, '');

    if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      if (url.pathname === '/watch') {
        const v = url.searchParams.get('v');
        if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) {
          return v;
        }
      }
      if (url.pathname.startsWith('/embed/')) {
        const id = url.pathname.slice('/embed/'.length).split('/')[0];
        if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
          return id;
        }
      }
      if (url.pathname.startsWith('/shorts/')) {
        const id = url.pathname.slice('/shorts/'.length).split('/')[0];
        if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
          return id;
        }
      }
    }

    if (hostname === 'youtu.be') {
      const id = url.pathname.slice(1).split('/')[0];
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
        return id;
      }
    }
  } catch {
    // Malformed URL
  }

  return null;
}

export const postFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(BLOG_VALIDATION.title.min, adminBlogLabels.errors.titleRequired)
    .max(BLOG_VALIDATION.title.max, adminBlogLabels.errors.titleRequired),
  slug: z
    .string()
    .transform((val) => normalizeSlug(val))
    .refine(
      (val) =>
        val.length >= BLOG_VALIDATION.slug.min &&
        val.length <= BLOG_VALIDATION.slug.max &&
        BLOG_VALIDATION.slug.regex.test(val),
      {
        message: adminBlogLabels.errors.slugInvalid,
      },
    ),
  description: z
    .string()
    .trim()
    .min(
      BLOG_VALIDATION.description.min,
      adminBlogLabels.errors.descriptionRequired,
    )
    .max(
      BLOG_VALIDATION.description.max,
      adminBlogLabels.errors.descriptionRequired,
    ),
  category: z.enum(BLOG_CATEGORIES),
  coverImage: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim() : ''))
    .refine(isValidCoverImage, {
      message: adminBlogLabels.errors.coverImageInvalid,
    }),
  tags: z
    .string()
    .transform((val) =>
      val
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    )
    .refine((tags) => tags.length > 0, {
      message: adminBlogLabels.errors.tagsRequired,
    }),
  youtubeUrl: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val?.trim() || '')
    .refine(
      (val) => {
        if (!val) return true;
        return extractYouTubeVideoId(val) !== null;
      },
      {
        message: adminBlogLabels.errors.youtubeInvalid,
      },
    ),
  content: z
    .string()
    .trim()
    .min(1, adminBlogLabels.errors.contentRequired)
    .max(
      BLOG_VALIDATION.content.maxCharacters,
      adminBlogLabels.errors.contentTooLarge,
    ),
  isPublished: z.boolean().default(false),
});

export type PostFormInput = z.input<typeof postFormSchema>;
export type PostFormOutput = z.output<typeof postFormSchema>;

export interface PostFormStateValues {
  title: string;
  slug: string;
  description: string;
  category: string;
  coverImage: string;
  tags: string;
  youtubeUrl: string;
  content: string;
  isPublished: boolean;
}

export interface PostActionState {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  values?: PostFormStateValues;
}
