import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'next-view-transitions';

import { BlogPostPreview } from '@/types/blog';

interface PostNavigationProps {
  olderPost?: BlogPostPreview | null;
  newerPost?: BlogPostPreview | null;
}

export function PostNavigation({ olderPost, newerPost }: PostNavigationProps) {
  if (!olderPost && !newerPost) {
    return null;
  }

  return (
    <nav
      aria-label="Post pagination"
      className="my-10 grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      {olderPost ? (
        <Link
          href={`/blog/${olderPost.slug}`}
          className="group border-border bg-card hover:border-primary/50 hover:bg-accent/30 flex flex-col justify-between rounded-xl border p-4 transition-all"
        >
          <div className="text-muted-foreground group-hover:text-primary mb-2 flex items-center gap-1.5 text-xs transition-colors">
            <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1" />
            <span>Older article</span>
          </div>
          <p className="text-foreground group-hover:text-primary line-clamp-2 text-sm font-semibold transition-colors">
            {olderPost.frontmatter.title}
          </p>
        </Link>
      ) : (
        <div className="hidden sm:block" />
      )}

      {newerPost ? (
        <Link
          href={`/blog/${newerPost.slug}`}
          className="group border-border bg-card hover:border-primary/50 hover:bg-accent/30 flex flex-col justify-between rounded-xl border p-4 text-left transition-all sm:col-start-2 sm:text-right"
        >
          <div className="text-muted-foreground group-hover:text-primary mb-2 flex items-center gap-1.5 text-xs transition-colors sm:justify-end">
            <span>Newer article</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
          </div>
          <p className="text-foreground group-hover:text-primary line-clamp-2 text-sm font-semibold transition-colors">
            {newerPost.frontmatter.title}
          </p>
        </Link>
      ) : null}
    </nav>
  );
}
