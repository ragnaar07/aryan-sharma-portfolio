import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import 'server-only';

import { calculateReadingTime } from '@/lib/blog-reading-time';
import { BlogPost, BlogPostPreview, Post, blogPostToPost } from '@/types/blog';

const blogDirectory = path.join(process.cwd(), 'src/data/blog');

/**
 * Get all blog post slugs from local MDX files.
 */
export function getFileBlogPostSlugs(): string[] {
  if (!fs.existsSync(blogDirectory)) {
    return [];
  }

  const files = fs.readdirSync(blogDirectory);
  return files
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => file.replace(/\.mdx$/, ''));
}

/**
 * Get a single local blog post by slug.
 */
export function getFileBlogPostBySlug(slug: string): BlogPost | null {
  try {
    const fullPath = path.join(blogDirectory, `${slug}.mdx`);
    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    if (!data.title || !data.description) {
      console.warn(
        `[blog-file-loader] Missing title or description in ${slug}.mdx`,
      );
      return null;
    }

    const image = data.coverImage || data.image || '';
    const isoDate = data.date
      ? new Date(data.date).toISOString()
      : new Date().toISOString();
    const isoUpdatedDate = data.updatedDate
      ? new Date(data.updatedDate).toISOString()
      : isoDate;

    return {
      slug,
      content,
      frontmatter: {
        title: String(data.title),
        description: String(data.description),
        image,
        coverImage: image,
        category: data.category ? String(data.category) : 'Engineering',
        youtubeId: data.youtubeId ? String(data.youtubeId) : undefined,
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        date: isoDate,
        publishDate: isoDate,
        updatedDate: isoUpdatedDate,
        isPublished: Boolean(data.isPublished),
        readingTime: calculateReadingTime(content),
      },
    };
  } catch (error) {
    console.error(`[blog-file-loader] Error reading blog post ${slug}:`, error);
    return null;
  }
}

/**
 * Get all local file-based posts as normalized Post objects.
 */
export function getAllFilePosts(): Post[] {
  const slugs = getFileBlogPostSlugs();
  const posts: Post[] = [];

  for (const slug of slugs) {
    const blogPost = getFileBlogPostBySlug(slug);
    if (blogPost) {
      posts.push(blogPostToPost(blogPost));
    }
  }

  // Sort newest first
  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

/**
 * Get all local file-based posts as BlogPostPreviews.
 */
export function getAllFileBlogPostPreviews(): BlogPostPreview[] {
  const posts = getAllFilePosts();
  return posts.map((post) => ({
    slug: post.slug,
    frontmatter: {
      title: post.title,
      description: post.description,
      image: post.coverImage || post.image || undefined,
      coverImage: post.coverImage || post.image || undefined,
      category: post.category,
      youtubeId: post.youtubeId,
      tags: post.tags,
      date: post.date,
      publishDate: post.date,
      updatedDate: post.updatedDate,
      isPublished: post.isPublished,
      readingTime: post.readingTime || calculateReadingTime(post.content),
    },
  }));
}
