import { Metadata } from 'next';
import { Link } from 'next-view-transitions';
import { notFound } from 'next/navigation';

import { BlogContent } from '@/components/blog/BlogContent';
import { BlogList } from '@/components/blog/BlogList';
import { PostNavigation } from '@/components/blog/PostNavigation';
import { DesktopTableOfContents } from '@/components/blog/TableOfContents';
import Container from '@/components/common/Container';
import FontSizeControls from '@/components/common/FontSizeControls';
import ArrowLeft from '@/components/svgs/ArrowLeft';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getSiteUrl, siteConfig } from '@/config/Meta';
import {
  extractHeadings,
  getBlogPostBySlug,
  getPublishedBlogPostsAsync,
  getRelatedPosts,
} from '@/lib/blog';

export const dynamicParams = true;

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate static paths for all published blog posts
export async function generateStaticParams() {
  const posts = await getPublishedBlogPostsAsync();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// Generate metadata for each blog post
export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post || !post.frontmatter.isPublished) {
    return {
      title: 'Post Not Found',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}/blog/${slug}`;
  const {
    title,
    description,
    image,
    coverImage,
    tags,
    category,
    date,
    updatedDate,
  } = post.frontmatter;

  const rawImage = coverImage || image || '/assets/me.png';
  const ogImageUrl = rawImage.startsWith('http')
    ? rawImage
    : `${siteUrl}${rawImage.startsWith('/') ? '' : '/'}${rawImage}`;

  const publishedTime = date ? new Date(date).toISOString() : undefined;
  const modifiedTime = updatedDate
    ? new Date(updatedDate).toISOString()
    : publishedTime;

  return {
    metadataBase: new URL(siteUrl),
    title: `${title} | Aryan Sharma`,
    description,
    keywords: tags && tags.length > 0 ? tags.join(', ') : category,
    authors: [{ name: siteConfig.author.name }],
    creator: siteConfig.author.name,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: siteConfig.title,
      type: 'article',
      publishedTime,
      modifiedTime,
      authors: [siteConfig.author.name],
      tags: tags || [],
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: siteConfig.author.twitter || undefined,
      images: [ogImageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  // Unpublished or missing slugs must return not-found
  if (!post || !post.frontmatter.isPublished) {
    notFound();
  }

  const [allPosts, relatedPosts] = await Promise.all([
    getPublishedBlogPostsAsync(),
    getRelatedPosts(slug, 3),
  ]);

  // Compute Older and Newer navigation links
  // (Posts are sorted newest first, so currentIndex - 1 is newer, currentIndex + 1 is older)
  const currentIndex = allPosts.findIndex((p) => p.slug === slug);
  const newerPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const olderPost =
    currentIndex !== -1 && currentIndex < allPosts.length - 1
      ? allPosts[currentIndex + 1]
      : null;

  const headings = extractHeadings(post.content);
  const hasHeadings = headings.length > 0;

  return (
    <>
      <Container className="py-16">
        <div className="space-y-12">
          {/* Back Button */}
          <div>
            <Button variant="ghost" asChild className="group">
              <Link href="/blog" className="flex items-center space-x-2">
                <ArrowLeft className="size-4" />
                <span>Back to Blog</span>
              </Link>
            </Button>
          </div>

          {/* Main Layout: Article + Sticky Desktop TOC */}
          {hasHeadings ? (
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_260px] xl:grid-cols-[minmax(0,1fr)_280px]">
              <div className="min-w-0">
                <BlogContent
                  frontmatter={post.frontmatter}
                  content={post.content}
                  headings={headings}
                />
                <PostNavigation olderPost={olderPost} newerPost={newerPost} />
              </div>

              {/* Desktop Sticky Sidebar */}
              <aside className="hidden lg:block">
                <div className="sticky top-28">
                  <DesktopTableOfContents headings={headings} />
                </div>
              </aside>
            </div>
          ) : (
            <div className="mx-auto max-w-4xl">
              <BlogContent
                frontmatter={post.frontmatter}
                content={post.content}
                headings={headings}
              />
              <PostNavigation olderPost={olderPost} newerPost={newerPost} />
            </div>
          )}

          {/* Related Articles */}
          {relatedPosts.length > 0 && (
            <div className="space-y-6">
              <Separator />
              <div className="space-y-6">
                <div>
                  <h2 className="text-foreground text-2xl font-bold tracking-tight">
                    Related Articles
                  </h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    More articles matched by category and topic tags
                  </p>
                </div>
                <BlogList posts={relatedPosts} />
              </div>
            </div>
          )}

          {/* Back to Blog CTA */}
          <div className="text-center">
            <Separator className="mb-8" />
            <Button asChild size="lg">
              <Link href="/blog">View All Articles</Link>
            </Button>
          </div>
        </div>
      </Container>
      <FontSizeControls />
    </>
  );
}
