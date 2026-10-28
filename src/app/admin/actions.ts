'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { adminBlogLabels } from '@/config/BlogAdmin';
import { requireAdmin } from '@/lib/auth-guard';
import { deletePost, getPostForAdminBySlug, savePost } from '@/lib/blog';
import { getFileBlogPostBySlug } from '@/lib/blog-file-loader';
import {
  type PostActionState,
  type PostFormStateValues,
  extractCoverId,
  extractYouTubeVideoId,
  normalizeSlug,
  postFormSchema,
} from '@/lib/blog-validation';
import { preprocessMdxContent, validateMdxCompilation } from '@/lib/mdx-server';
import { deleteCover } from '@/lib/redis-covers';
import { getRedisPostBySlug } from '@/lib/redis-posts';
import type { Post } from '@/types/blog';

/**
 * Server Action to save (create or update) a blog post in Upstash Redis.
 * First line verifies admin authorization via requireAdmin().
 */
export async function savePostAction(
  _prevState: PostActionState,
  formData: FormData,
): Promise<PostActionState> {
  // First line requirement: enforce admin session
  await requireAdmin({ redirectOnFail: false });

  const rawValues: PostFormStateValues = {
    title: String(formData.get('title') || ''),
    slug: String(formData.get('slug') || ''),
    description: String(formData.get('description') || ''),
    category: String(formData.get('category') || ''),
    coverImage: String(formData.get('coverImage') || ''),
    tags: String(formData.get('tags') || ''),
    youtubeUrl: String(formData.get('youtubeUrl') || ''),
    content: String(formData.get('content') || ''),
    isPublished:
      formData.get('isPublished') === 'on' ||
      formData.get('isPublished') === 'true',
  };

  const validation = postFormSchema.safeParse({
    ...rawValues,
    isPublished: rawValues.isPublished,
  });

  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    const errors: Record<string, string[]> = {};
    for (const [key, val] of Object.entries(fieldErrors)) {
      if (val) {
        errors[key] = val;
      }
    }
    return {
      success: false,
      message: adminBlogLabels.errors.generalSaveError,
      errors,
      values: rawValues,
    };
  }

  try {
    const validated = validation.data;
    const cleanSlug = normalizeSlug(validated.slug);

    // Validate MDX compilation before touching Redis
    const mdxCheck = await validateMdxCompilation(validated.content);
    if (!mdxCheck.valid) {
      const excerpt = mdxCheck.sourceExcerpt
        ? ` ("${mdxCheck.sourceExcerpt}")`
        : '';
      const errorMsg =
        mdxCheck.line && mdxCheck.column
          ? `MDX compilation error at line ${mdxCheck.line}, column ${mdxCheck.column}: ${mdxCheck.reason || mdxCheck.error}${excerpt}`
          : `MDX compilation error: ${mdxCheck.reason || mdxCheck.error || 'Could not parse expression with acorn'}${excerpt}`;
      return {
        success: false,
        message: errorMsg,
        errors: {
          content: [errorMsg],
        },
        values: rawValues,
      };
    }

    const preprocessedContent = preprocessMdxContent(validated.content);
    const existingPost = await getPostForAdminBySlug(cleanSlug);

    const nowIso = new Date().toISOString();
    // Keep original publish date when editing an existing slug; otherwise use nowIso
    const date = existingPost?.date
      ? new Date(existingPost.date).toISOString()
      : nowIso;
    const updatedDate = nowIso;

    // Cleanup old cover image if it was an internal uploaded Redis cover and has changed
    if (
      existingPost?.coverImage &&
      existingPost.coverImage !== validated.coverImage
    ) {
      const oldCoverId = extractCoverId(existingPost.coverImage);
      if (oldCoverId) {
        try {
          await deleteCover(oldCoverId);
        } catch (cleanupError) {
          console.warn(
            `[actions] Failed to clean up old cover "${oldCoverId}":`,
            cleanupError,
          );
        }
      }
    }

    const post: Post = {
      slug: cleanSlug,
      title: validated.title,
      description: validated.description,
      content: preprocessedContent,
      coverImage: validated.coverImage || undefined,
      image: validated.coverImage || undefined,
      category: validated.category,
      youtubeId: extractYouTubeVideoId(validated.youtubeUrl) || undefined,
      tags: validated.tags,
      date,
      publishDate: date,
      updatedDate,
      isPublished: validated.isPublished,
    };

    await savePost(post);

    // Revalidate all affected cache tags and routes
    revalidatePath('/blog');
    revalidatePath('/blog/[slug]', 'page');
    revalidatePath(`/blog/${post.slug}`);
    revalidatePath('/sitemap.xml');
    revalidatePath('/robots.txt');
    revalidatePath('/');
    revalidatePath('/admin');
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'digest' in error &&
      typeof (error as { digest: string }).digest === 'string' &&
      (error as { digest: string }).digest.startsWith('NEXT_REDIRECT')
    ) {
      throw error;
    }
    console.error('[actions] Error saving post:', error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : adminBlogLabels.errors.generalSaveError,
      values: rawValues,
    };
  }

  // Redirect to admin dashboard on success
  redirect('/admin');
  return { success: true };
}

/**
 * Server Action to delete a blog post by slug from Upstash Redis.
 * First line verifies admin authorization via requireAdmin().
 */
export async function deletePostAction(
  slug: string,
): Promise<{ success: boolean; error?: string }> {
  // First line requirement: enforce admin session
  await requireAdmin({ redirectOnFail: false });

  const cleanSlug = normalizeSlug(slug);
  if (!cleanSlug) {
    return { success: false, error: 'A valid slug string is required.' };
  }

  try {
    const [redisPost, filePost] = await Promise.all([
      getRedisPostBySlug(cleanSlug),
      Promise.resolve(getFileBlogPostBySlug(cleanSlug)),
    ]);

    if (!redisPost && filePost) {
      return {
        success: false,
        error:
          'Local file-based posts (src/data/blog/) are version-controlled in the repository and cannot be deleted via the admin dashboard. Remove the MDX file from the repository to delete this article.',
      };
    }

    if (!redisPost && !filePost) {
      return {
        success: false,
        error: `Post "${cleanSlug}" was not found.`,
      };
    }

    const deleted = await deletePost(cleanSlug);

    // Clean up stored cover image in Redis if this post was using an uploaded cover
    if (deleted && redisPost?.coverImage) {
      const coverId = extractCoverId(redisPost.coverImage);
      if (coverId) {
        try {
          await deleteCover(coverId);
        } catch (coverCleanupError) {
          console.warn(
            `[actions] Failed to clean up cover "${coverId}" during post deletion:`,
            coverCleanupError,
          );
        }
      }
    }

    // Revalidate paths
    revalidatePath('/blog');
    revalidatePath('/blog/[slug]', 'page');
    revalidatePath(`/blog/${cleanSlug}`);
    revalidatePath('/sitemap.xml');
    revalidatePath('/robots.txt');
    revalidatePath('/');
    revalidatePath('/admin');

    return { success: deleted };
  } catch (error) {
    console.error('[actions] Error deleting post:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : adminBlogLabels.errors.generalDeleteError,
    };
  }
}

/**
 * Server Action for real-time live preview MDX syntax validation in PostForm.
 * First line verifies admin authorization via requireAdmin().
 */
export async function validateMdxAction(content: string): Promise<{
  valid: boolean;
  error?: string;
  reason?: string;
  line?: number;
  column?: number;
  sourceExcerpt?: string;
}> {
  await requireAdmin({ redirectOnFail: false });
  return validateMdxCompilation(content);
}
