import { z } from 'zod';

import {
  BLOG_CATEGORIES,
  BLOG_VALIDATION,
  adminBlogLabels,
} from '@/config/BlogAdmin';

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
    .string({ required_error: adminBlogLabels.errors.titleRequired })
    .trim()
    .min(BLOG_VALIDATION.title.min, adminBlogLabels.errors.titleRequired)
    .max(BLOG_VALIDATION.title.max, adminBlogLabels.errors.titleRequired),
  slug: z
    .string({ required_error: adminBlogLabels.errors.slugInvalid })
    .trim()
    .min(BLOG_VALIDATION.slug.min, adminBlogLabels.errors.slugInvalid)
    .max(BLOG_VALIDATION.slug.max, adminBlogLabels.errors.slugInvalid)
    .regex(BLOG_VALIDATION.slug.regex, adminBlogLabels.errors.slugInvalid),
  description: z
    .string({ required_error: adminBlogLabels.errors.descriptionRequired })
    .trim()
    .min(
      BLOG_VALIDATION.description.min,
      adminBlogLabels.errors.descriptionRequired,
    )
    .max(
      BLOG_VALIDATION.description.max,
      adminBlogLabels.errors.descriptionRequired,
    ),
  category: z.enum(BLOG_CATEGORIES, {
    errorMap: () => ({ message: adminBlogLabels.errors.categoryInvalid }),
  }),
  coverImage: z
    .string({ required_error: adminBlogLabels.errors.coverImageRequired })
    .trim()
    .min(1, adminBlogLabels.errors.coverImageRequired),
  tags: z
    .string({ required_error: adminBlogLabels.errors.tagsRequired })
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
    .string({ required_error: adminBlogLabels.errors.contentRequired })
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
