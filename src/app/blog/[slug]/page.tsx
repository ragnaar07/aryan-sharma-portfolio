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
  getBlogPostSlugs,
  getPublishedBlogPostsAsync,
  getRelatedPosts,
  normalizeSlug,
} from '@/lib/blog';

export const dynamicParams = true;
export const revalidate = 60;

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate static paths for version-controlled blog posts; dynamic Redis posts are rendered on-demand
export async function generateStaticParams() {
  const slugs = getBlogPostSlugs();

  return slugs.map((slug) => ({
    slug: normalizeSlug(slug),
  }));
}

// Generate metadata for each blog post
export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const normalizedSlug = normalizeSlug(slug);
    const post = await getBlogPostBySlug(normalizedSlug);

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
    const canonicalUrl = `${siteUrl}/blog/${normalizedSlug}`;
    const {
      title,
      description,
      image,
      coverImage,
      tags = [],
      category = 'Engineering',
      date,
      updatedDate,
    } = post.frontmatter;

    const rawImage = coverImage || image || '/assets/me.png';
    let ogImageUrl = '/assets/me.png';
    try {
      if (rawImage.startsWith('http://') || rawImage.startsWith('https://')) {
        ogImageUrl = rawImage;
      } else {
        const cleanPath = rawImage.startsWith('/') ? rawImage : `/${rawImage}`;
        ogImageUrl = new URL(cleanPath, siteUrl).toString();
      }
    } catch {
      ogImageUrl = `${siteUrl}/assets/me.png`;
    }

    let publishedTime: string | undefined;
    try {
      if (date) {
        const d = new Date(date);
        if (!Number.isNaN(d.getTime())) {
          publishedTime = d.toISOString();
        }
      }
    } catch {
      publishedTime = undefined;
    }

    let modifiedTime: string | undefined = publishedTime;
    try {
      if (updatedDate) {
        const d = new Date(updatedDate);
        if (!Number.isNaN(d.getTime())) {
          modifiedTime = d.toISOString();
        }
      }
    } catch {
      modifiedTime = publishedTime;
    }

    let baseMetaUrl: URL;
    try {
      baseMetaUrl = new URL(siteUrl);
    } catch {
      baseMetaUrl = new URL('https://aryansharma.dev');
    }

    return {
      metadataBase: baseMetaUrl,
      title: `${title} | Aryan Sharma`,
      description,
      keywords: tags.length > 0 ? tags.join(', ') : category,
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
        tags,
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
  } catch (error) {
    console.error('[blog/[slug]] Error generating metadata:', error);
    return {
      title: 'Article | Aryan Sharma',
      description: siteConfig.description,
    };
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const normalizedSlug = normalizeSlug(slug);
  const post = await getBlogPostBySlug(normalizedSlug);

  // Unpublished or missing slugs must return not-found
  if (!post || !post.frontmatter.isPublished) {
    notFound();
  }

  const [allPosts, relatedPosts] = await Promise.all([
    getPublishedBlogPostsAsync(),
    getRelatedPosts(normalizedSlug, 3),
  ]);

  // Compute Older and Newer navigation links
  // (Posts are sorted newest first, so currentIndex - 1 is newer, currentIndex + 1 is older)
  const currentIndex = allPosts.findIndex(
    (p) => normalizeSlug(p.slug) === normalizedSlug,
  );
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
