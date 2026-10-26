export interface BlogFrontmatter {
  title: string;
  description: string;
  image: string;
  coverImage?: string;
  category?: string;
  youtubeId?: string;
  tags: string[];
  date: string; // ISO string
  publishDate?: string; // alias for date
  updatedDate?: string; // ISO string
  isPublished: boolean;
  readingTime?: string;
}

export interface Post {
  slug: string;
  title: string;
  description: string;
  content: string; // raw MDX content
  coverImage: string;
  image: string;
  category: string;
  youtubeId?: string;
  tags: string[];
  date: string; // publish date as ISO string
  publishDate?: string;
  updatedDate?: string; // updated date as ISO string
  isPublished: boolean;
  readingTime?: string;
}

export interface BlogPost {
  slug: string;
  frontmatter: BlogFrontmatter;
  content: string;
}

export interface BlogPostPreview {
  slug: string;
  frontmatter: BlogFrontmatter;
}

export function postToBlogPost(post: Post): BlogPost {
  const cover = post.coverImage || post.image;
  const isoDate = post.date
    ? new Date(post.date).toISOString()
    : new Date().toISOString();
  const isoUpdatedDate = post.updatedDate
    ? new Date(post.updatedDate).toISOString()
    : isoDate;

  return {
    slug: post.slug,
    content: post.content,
    frontmatter: {
      title: post.title,
      description: post.description,
      image: cover,
      coverImage: cover,
      category: post.category || 'Engineering',
      youtubeId: post.youtubeId,
      tags: post.tags || [],
      date: isoDate,
      publishDate: isoDate,
      updatedDate: isoUpdatedDate,
      isPublished: Boolean(post.isPublished),
      readingTime: post.readingTime,
    },
  };
}

export function blogPostToPost(blogPost: BlogPost): Post {
  const { slug, frontmatter, content } = blogPost;
  const cover = frontmatter.coverImage || frontmatter.image || '';
  const isoDate = frontmatter.date
    ? new Date(frontmatter.date).toISOString()
    : new Date().toISOString();
  const isoUpdatedDate = frontmatter.updatedDate
    ? new Date(frontmatter.updatedDate).toISOString()
    : isoDate;

  return {
    slug,
    title: frontmatter.title,
    description: frontmatter.description,
    content,
    coverImage: cover,
    image: cover,
    category: frontmatter.category || 'Engineering',
    youtubeId: frontmatter.youtubeId,
    tags: frontmatter.tags || [],
    date: isoDate,
    publishDate: isoDate,
    updatedDate: isoUpdatedDate,
    isPublished: Boolean(frontmatter.isPublished),
    readingTime: frontmatter.readingTime,
  };
}
