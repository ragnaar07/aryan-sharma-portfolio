import { Clock } from 'lucide-react';
import { Link } from 'next-view-transitions';
import Image from 'next/image';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { BlogPostPreview } from '@/types/blog';

import ArrowRight from '../svgs/ArrowRight';
import Calender from '../svgs/Calender';

interface BlogCardProps {
  post: BlogPostPreview;
}

export function BlogCard({ post }: BlogCardProps) {
  const { slug, frontmatter } = post;
  const {
    title,
    description,
    image,
    coverImage,
    category = 'Engineering',
    tags = [],
    date,
    readingTime = '1 min read',
  } = frontmatter;

  const rawImage = coverImage || image;
  const displayImage =
    typeof rawImage === 'string' && rawImage.trim().length > 0
      ? rawImage.trim()
      : '/meta/share/blog.jpg';
  const isCoverApi = displayImage.startsWith('/api/blog/cover/');

  let formattedDate = '';
  try {
    const d = new Date(date);
    if (!Number.isNaN(d.getTime())) {
      formattedDate = d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  } catch {
    formattedDate = '';
  }

  const safeTags = Array.isArray(tags) ? tags : [];

  return (
    <Card className="group border-border bg-card hover:border-primary/50 flex h-full w-full flex-col overflow-hidden rounded-xl border p-0 shadow-sm transition-all hover:shadow-md">
      <CardHeader className="p-0">
        <div className="bg-muted relative aspect-video w-full overflow-hidden">
          <Link href={`/blog/${slug}`} className="block h-full w-full">
            <Image
              src={displayImage}
              alt={title}
              fill
              unoptimized={isCoverApi}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
          <div className="absolute top-3 left-3 z-10">
            <Badge
              variant="secondary"
              className="border-border/40 bg-background/90 border text-xs font-medium shadow-sm backdrop-blur-sm"
            >
              {category}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-5">
        <div className="space-y-3">
          <div className="text-muted-foreground flex items-center gap-3 text-xs">
            {formattedDate && (
              <>
                <time className="flex items-center gap-1.5" dateTime={date}>
                  <Calender className="size-3.5 shrink-0" />
                  <span>{formattedDate}</span>
                </time>
                <span>•</span>
              </>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5 shrink-0" />
              <span>{readingTime}</span>
            </span>
          </div>

          <Link href={`/blog/${slug}`} className="block">
            <h3 className="text-foreground group-hover:text-primary line-clamp-2 text-xl font-semibold tracking-tight transition-colors">
              {title}
            </h3>
          </Link>

          <p className="text-muted-foreground line-clamp-2 text-sm">
            {description}
          </p>
        </div>
      </CardContent>
      <CardFooter className="p-5 pt-0">
        <div className="flex w-full flex-col space-y-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {safeTags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-muted-foreground text-xs"
              >
                {tag}
              </Badge>
            ))}
            {safeTags.length > 3 && (
              <Badge
                variant="outline"
                className="text-muted-foreground text-xs"
              >
                +{safeTags.length - 3}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-end">
            <Link
              href={`/blog/${slug}`}
              className="text-foreground hover:text-primary inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
            >
              <span>Read article</span>
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
