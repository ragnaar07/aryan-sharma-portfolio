import rehypeHighlight from '@shikijs/rehype';
import 'katex/dist/katex.min.css';
import { Clock } from 'lucide-react';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Image from 'next/image';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TocHeading } from '@/lib/blog-toc';
import { BlogFrontmatter } from '@/types/blog';

import Calender from '../svgs/Calender';
import { BlogComponents } from './BlogComponents';
import { MobileTableOfContents } from './TableOfContents';

interface BlogContentProps {
  frontmatter: BlogFrontmatter;
  content: string;
  headings?: TocHeading[];
}

export function BlogContent({
  frontmatter,
  content,
  headings = [],
}: BlogContentProps) {
  const {
    title,
    description,
    image,
    coverImage,
    category = 'Engineering',
    youtubeId,
    tags,
    date,
    readingTime = '1 min read',
  } = frontmatter;

  const displayImage = coverImage || image || '/assets/me.png';

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

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
            {tags.map((tag) => (
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

      {/* MDX Content */}
      <div className="prose prose-neutral dark:prose-invert text-foreground/90 max-w-none">
        <MDXRemote
          source={content}
          components={BlogComponents}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm, remarkMath],
              rehypePlugins: [
                rehypeKatex,
                [
                  rehypeHighlight,
                  {
                    theme: 'github-dark',
                  },
                ],
              ],
            },
          }}
        />
      </div>
    </article>
  );
}
