import 'katex/dist/katex.min.css';
import { AlertTriangle, Clock } from 'lucide-react';
import { compileMDX } from 'next-mdx-remote/rsc';
import Image from 'next/image';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TocHeading } from '@/lib/blog-toc';
import {
  preprocessMdxContent,
  sharedMdxOptions,
  validateMdxCompilation,
} from '@/lib/mdx-server';
import { BlogFrontmatter } from '@/types/blog';

import Calender from '../svgs/Calender';
import { BlogComponents } from './BlogComponents';
import { MobileTableOfContents } from './TableOfContents';

interface BlogContentProps {
  frontmatter: BlogFrontmatter;
  content: string;
  headings?: TocHeading[];
  slug?: string;
}

export async function BlogContent({
  frontmatter,
  content,
  headings = [],
  slug,
}: BlogContentProps) {
  const {
    title,
    description,
    image,
    coverImage,
    category = 'Engineering',
    youtubeId,
    tags = [],
    date,
    readingTime = '1 min read',
  } = frontmatter;

  const rawImage = coverImage || image;
  const displayImage =
    typeof rawImage === 'string' && rawImage.trim().length > 0
      ? rawImage.trim()
      : '/assets/me.png';
  const isCoverApi = displayImage.startsWith('/api/blog/cover/');

  let formattedDate = '';
  try {
    const d = new Date(date);
    if (!Number.isNaN(d.getTime())) {
      formattedDate = d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  } catch {
    formattedDate = '';
  }

  const safeTags = Array.isArray(tags) ? tags : [];

  // Compile MDX safely with pre-processing
  let mdxElement: React.ReactNode = null;
  let hasCompilationError = false;

  const preprocessed = preprocessMdxContent(content);

  try {
    const compiled = await compileMDX({
      source: preprocessed,
      components: BlogComponents,
      options: {
        mdxOptions: sharedMdxOptions,
      },
    });
    mdxElement = compiled.content;
  } catch (err: unknown) {
    hasCompilationError = true;
    const errorDetails = await validateMdxCompilation(content);
    const lineCol =
      errorDetails.line && errorDetails.column
        ? ` (line ${errorDetails.line}, column ${errorDetails.column})`
        : errorDetails.line
          ? ` (line ${errorDetails.line})`
          : '';
    const excerpt = errorDetails.sourceExcerpt
      ? ` -> "${errorDetails.sourceExcerpt}"`
      : '';
    console.error(
      `[BlogContent] MDX compilation error for slug "${slug || title}"${lineCol}:`,
      errorDetails.reason || (err instanceof Error ? err.message : err),
      excerpt,
    );
  }

  return (
    <article className="w-full">
      {/* Header Section */}
      <header className="mb-8 space-y-6">
        {/* Cover Image */}
        <div className="border-border bg-muted relative aspect-video w-full overflow-hidden rounded-xl border">
          <Image
            src={displayImage}
            alt={title}
            fill
            unoptimized={isCoverApi}
            className="object-cover"
            priority
          />
        </div>

        {/* Post Metadata & Headings */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default" className="text-xs font-medium">
              {category}
            </Badge>
            {safeTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>

          <h1 className="text-foreground text-3xl leading-tight font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {title}
          </h1>

          <p className="text-muted-foreground text-lg leading-relaxed sm:text-xl">
            {description}
          </p>

          <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Calender className="size-4 shrink-0" />
              <time dateTime={date}>{formattedDate}</time>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <Clock className="size-4 shrink-0" />
              <span>{readingTime}</span>
            </div>
          </div>
        </div>

        {/* Optional YouTube Video Embed */}
        {youtubeId && (
          <div className="border-border relative my-8 aspect-video w-full overflow-hidden rounded-xl border bg-black shadow-md">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
              title={`${title} video player`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
        )}

        {/* Mobile Collapsible TOC */}
        {headings.length > 0 && (
          <div className="pt-2 lg:hidden">
            <MobileTableOfContents headings={headings} />
          </div>
        )}

        <Separator className="mt-8" />
      </header>

      {/* MDX Content or Plain-Text Fallback */}
      {hasCompilationError ? (
        <div className="space-y-6">
          <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200">
            <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle>Formatting Notice</AlertTitle>
            <AlertDescription className="text-xs">
              This article content is being rendered in plain-text fallback mode
              because an expression in the article could not be compiled into
              interactive MDX.
            </AlertDescription>
          </Alert>
          <div className="text-foreground/90 font-sans text-base leading-relaxed whitespace-pre-wrap">
            {content}
          </div>
        </div>
      ) : (
        <div className="prose prose-neutral dark:prose-invert text-foreground/90 max-w-none">
          {mdxElement}
        </div>
      )}
    </article>
  );
}
