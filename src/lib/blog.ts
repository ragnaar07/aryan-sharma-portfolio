import 'server-only';

import { requireAdmin } from '@/lib/auth-guard';
import {
  getAllFileBlogPostPreviews,
  getAllFilePosts,
  getFileBlogPostBySlug,
  getFileBlogPostSlugs,
} from '@/lib/blog-file-loader';
import { calculateReadingTime } from '@/lib/blog-reading-time';
import {
  extractCoverId,
  isValidCoverImage,
  normalizeSlug,
} from '@/lib/blog-validation';
import {
  deleteRedisPost,
  getRedisPostBySlug,
  listRedisPosts,
  saveRedisPost,
} from '@/lib/redis-posts';
import {
  BlogPost,
  BlogPostPreview,
  Post,
  blogPostToPost,
  postToBlogPost,
} from '@/types/blog';

export { calculateReadingTime } from '@/lib/blog-reading-time';
export {
  extractHeadings,
  slugifyHeading,
  type TocHeading,
} from '@/lib/blog-toc';
export { extractCoverId, isValidCoverImage, normalizeSlug };

/**
 * Merge Redis posts with local file posts.
 * When slugs collide, Redis wins.
 * Returns posts sorted by date descending (newest first).
 */
export function mergePosts(redisPosts: Post[], filePosts: Post[]): Post[] {
  const map = new Map<string, Post>();

  // Insert file posts first
  for (const post of filePosts) {
    map.set(post.slug, post);
  }

  // Insert Redis posts (Redis overwrites file posts on slug collision)
  for (const post of redisPosts) {
    map.set(post.slug, post);
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

/**
 * Converts a Post into a BlogPostPreview.
 */
function postToPreview(post: Post): BlogPostPreview {
  const cover = post.coverImage || post.image || undefined;
  return {
    slug: post.slug,
    frontmatter: {
      title: post.title,
      description: post.description,
      image: cover,
      coverImage: cover,
      category: post.category,
      youtubeId: post.youtubeId,
      tags: post.tags,
      date: post.date,
      publishDate: post.publishDate || post.date,
      updatedDate: post.updatedDate || post.date,
      isPublished: post.isPublished,
      readingTime: post.readingTime || calculateReadingTime(post.content),
    },
  };
}

// ==========================================
// PUBLIC FUNCTIONS (Return ONLY published posts)
// ==========================================

/**
 * Synchronous slug getter from local files (for static params fallback).
 */
export function getBlogPostSlugs(): string[] {
  return getFileBlogPostSlugs();
}

/**
 * Get all published blog posts preview list (synchronous for existing page callers).
 * Public function: Returns ONLY published posts.
 */
export function getPublishedBlogPosts(): BlogPostPreview[] {
  const filePosts = getAllFileBlogPostPreviews();
  return filePosts.filter((post) => post.frontmatter.isPublished);
}

/**
 * Alias for getPublishedBlogPosts.
 * Public function: Returns ONLY published posts.
 */
export function getAllBlogPosts(): BlogPostPreview[] {
  return getPublishedBlogPosts();
}

/**
 * Asynchronously fetch all published blog posts from Redis and local MDX files.
 * Redis wins on collision.
 * Public function: Returns ONLY published posts.
 */
export async function getPublishedBlogPostsAsync(): Promise<BlogPostPreview[]> {
  const [redisPosts, filePosts] = await Promise.all([
    listRedisPosts(),
    Promise.resolve(getAllFilePosts()),
  ]);

  const merged = mergePosts(redisPosts, filePosts);
  return merged.filter((post) => post.isPublished).map(postToPreview);
}

/**
 * Alias for getPublishedBlogPostsAsync.
 */
export async function getAllBlogPostsAsync(): Promise<BlogPostPreview[]> {
  return getPublishedBlogPostsAsync();
}

/**
 * Get a single blog post by slug with full content.
 * Checks Redis first, falls back to file loader.
 * Public function: Returns ONLY published posts (returns null if draft).
 */
export async function getBlogPostBySlug(
  slug: string,
): Promise<BlogPost | null> {
  const normalizedSlug = normalizeSlug(slug);
  if (!normalizedSlug) {
    return null;
  }

  // 1. Try Redis first
  try {
    const redisPost = await getRedisPostBySlug(normalizedSlug);
    if (redisPost) {
      if (!redisPost.isPublished) {
        return null; // Public function hides drafts
      }
      return postToBlogPost(redisPost);
    }
  } catch (error) {
    console.error(
      `[blog] Failed to retrieve Redis post for slug "${normalizedSlug}":`,
      error,
    );
  }

  // 2. Fall back to local MDX file
  try {
    const filePost = getFileBlogPostBySlug(normalizedSlug);
    if (filePost) {
      if (!filePost.frontmatter.isPublished) {
        return null;
      }
      return filePost;
    }
  } catch (error) {
    console.error(
      `[blog] Failed to read local MDX file for slug "${normalizedSlug}":`,
      error,
    );
  }

  return null;
}

/**
 * Get blog posts by tag (synchronous).
 * Public function: Returns ONLY published posts.
 */
export function getBlogPostsByTag(tag: string): BlogPostPreview[] {
  const publishedPosts = getPublishedBlogPosts();
  return publishedPosts.filter((post) =>
    post.frontmatter.tags.some(
      (postTag) => postTag.toLowerCase() === tag.toLowerCase(),
    ),
  );
}

/**
 * Get blog posts by tag (asynchronous merge).
 * Public function: Returns ONLY published posts.
 */
export async function getBlogPostsByTagAsync(
  tag: string,
): Promise<BlogPostPreview[]> {
  const publishedPosts = await getPublishedBlogPostsAsync();
  return publishedPosts.filter((post) =>
    post.frontmatter.tags.some(
      (postTag) => postTag.toLowerCase() === tag.toLowerCase(),
    ),
  );
}

/**
 * Get all unique tags from published posts (synchronous).
 * Public function: Returns ONLY published post tags.
 */
export function getAllTags(): string[] {
  const publishedPosts = getPublishedBlogPosts();
  const tagsSet = new Set<string>();

  publishedPosts.forEach((post) => {
    post.frontmatter.tags.forEach((tag) => {
      tagsSet.add(tag.toLowerCase());
    });
  });

  return Array.from(tagsSet).sort();
}

/**
 * Get all unique tags from published posts (asynchronous merge).
 * Public function: Returns ONLY published post tags.
 */
export async function getAllTagsAsync(): Promise<string[]> {
  const publishedPosts = await getPublishedBlogPostsAsync();
  const tagsSet = new Set<string>();

  publishedPosts.forEach((post) => {
    post.frontmatter.tags.forEach((tag) => {
      tagsSet.add(tag.toLowerCase());
    });
  });

  return Array.from(tagsSet).sort();
}

/**
 * Get related posts based on shared category (+2) and shared tags (+1).
 * Public function: Returns ONLY published posts.
 */
export async function getRelatedPosts(
  currentSlug: string,
  maxPosts = 3,
): Promise<BlogPostPreview[]> {
  const normalizedSlug = normalizeSlug(currentSlug);
  const currentPost = await getBlogPostBySlug(normalizedSlug);
  if (!currentPost || !currentPost.frontmatter.isPublished) {
    return [];
  }

  const allPosts = await getPublishedBlogPostsAsync();
  const currentCategory = currentPost.frontmatter.category?.toLowerCase();
  const currentTags = Array.isArray(currentPost.frontmatter.tags)
    ? currentPost.frontmatter.tags.map((tag) => tag.toLowerCase())
    : [];

  const postsWithScore = allPosts
    .filter((post) => post.slug !== normalizedSlug)
    .map((post) => {
      let score = 0;
      // Shared category: +2 points
      if (
        currentCategory &&
        post.frontmatter.category?.toLowerCase() === currentCategory
      ) {
        score += 2;
      }
      // Shared tags: +1 point each
      const postTags = Array.isArray(post.frontmatter.tags)
        ? post.frontmatter.tags
        : [];
      const sharedTags = postTags.filter((tag) =>
        currentTags.includes(tag.toLowerCase()),
      );
      score += sharedTags.length;

      return {
        post,
        score,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return postsWithScore.slice(0, maxPosts).map((item) => item.post);
}

// ==========================================
// ADMIN FUNCTIONS (Includes DRAFTS, requires admin)
// ==========================================

/**
 * Get all posts for the admin dashboard.
 * Includes drafts (isPublished: false).
 * Enforces requireAdmin() security boundary.
 */
export async function getAllPostsForAdmin(): Promise<Post[]> {
  await requireAdmin();

  const [redisPosts, filePosts] = await Promise.all([
    listRedisPosts(),
    Promise.resolve(getAllFilePosts()),
  ]);

  return mergePosts(redisPosts, filePosts);
}

/**
 * Get a single post by slug for the admin editor (returns drafts as well).
 * Enforces requireAdmin() security boundary.
 */
export async function getPostForAdminBySlug(
  slug: string,
): Promise<Post | null> {
  await requireAdmin();

  const normalizedSlug = normalizeSlug(slug);
  if (!normalizedSlug) {
    return null;
  }

  // Check Redis first
  try {
    const redisPost = await getRedisPostBySlug(normalizedSlug);
    if (redisPost) {
      return redisPost;
    }
  } catch (error) {
    console.error(
      `[blog] Failed to fetch admin post "${normalizedSlug}" from Redis:`,
      error,
    );
  }

  // Fall back to local MDX file
  try {
    const filePost = getFileBlogPostBySlug(normalizedSlug);
    if (filePost) {
      return blogPostToPost(filePost);
    }
  } catch (error) {
    console.error(
      `[blog] Failed to read admin MDX file "${normalizedSlug}":`,
      error,
    );
  }

  return null;
}

/**
 * Save a post to Upstash Redis.
 * Enforces requireAdmin() security boundary.
 */
export async function savePost(post: Post): Promise<void> {
  await requireAdmin();
  await saveRedisPost(post);
}

/**
 * Delete a post from Upstash Redis by slug.
 * Enforces requireAdmin() security boundary.
 */
export async function deletePost(slug: string): Promise<boolean> {
  await requireAdmin();
  const normalizedSlug = normalizeSlug(slug);
  return deleteRedisPost(normalizedSlug);
}
