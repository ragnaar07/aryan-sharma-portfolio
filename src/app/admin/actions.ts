'use server';

import { adminBlogLabels } from '@/config/BlogAdmin';
import { requireAdmin } from '@/lib/auth-guard';
import { deletePost, getPostForAdminBySlug, savePost } from '@/lib/blog';
import {
  type PostActionState,
  type PostFormStateValues,
  extractYouTubeVideoId,
  postFormSchema,
} from '@/lib/blog-validation';
import type { Post } from '@/types/blog';
import { revalidatePath } from 'next/cache';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { redirect } from 'next/navigation';

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
    const formattedErrors = validation.error.flatten().fieldErrors;
    return {
      success: false,
      message: adminBlogLabels.errors.generalSaveError,
      errors: formattedErrors,
      values: rawValues,
    };
  }

  try {
    const validated = validation.data;
    const existingPost = await getPostForAdminBySlug(validated.slug);

    const nowIso = new Date().toISOString();
    // Keep original publish date when editing an existing slug; otherwise use nowIso
    const date = existingPost?.date
      ? new Date(existingPost.date).toISOString()
      : nowIso;
    const updatedDate = nowIso;

    const post: Post = {
      slug: validated.slug,
      title: validated.title,
      description: validated.description,
      content: validated.content,
      coverImage: validated.coverImage,
      image: validated.coverImage,
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
    revalidatePath(`/blog/${post.slug}`);
    revalidatePath('/sitemap.xml');
    revalidatePath('/robots.txt');
    revalidatePath('/');
    revalidatePath('/admin');
  } catch (error) {
    if (isRedirectError(error)) {
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

  if (!slug || typeof slug !== 'string') {
    return { success: false, error: 'A valid slug string is required.' };
  }

  try {
    const deleted = await deletePost(slug);

    // Revalidate paths
    revalidatePath('/blog');
    revalidatePath(`/blog/${slug}`);
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
