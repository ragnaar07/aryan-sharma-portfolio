'use client';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { TocHeading } from '@/lib/blog-toc';
import { ChevronDown, List } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface TableOfContentsProps {
  headings: TocHeading[];
  className?: string;
}

/**
 * Hook to track which heading is currently in viewport view.
 */
function useActiveHeading(headingIds: string[]) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (!headingIds || headingIds.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      {
        rootMargin: '-80px 0% -60% 0%',
        threshold: 0.1,
      },
    );

    headingIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [headingIds]);

  return activeId;
}

/**
 * Sticky Desktop Table of Contents
 */
export function DesktopTableOfContents({
  headings,
  className = '',
}: TableOfContentsProps) {
  const headingIds = React.useMemo(() => headings.map((h) => h.id), [headings]);
  const activeId = useActiveHeading(headingIds);

  if (!headings || headings.length === 0) {
    return null;
  }

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      window.history.pushState(null, '', `#${id}`);
    }
  };

  return (
    <nav
      aria-label="Table of contents"
      className={`border-border/60 bg-card/40 rounded-xl border p-4 backdrop-blur-sm ${className}`}
    >
      <div className="text-muted-foreground mb-3 flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
        <List className="size-3.5" />
        <span>On this page</span>
      </div>

      <ul className="space-y-2 text-xs">
        {headings.map((heading) => {
          const isActive = activeId === heading.id;
          return (
            <li
              key={heading.id}
              className={`${heading.level === 3 ? 'ml-3' : ''}`}
            >
              <a
                href={`#${heading.id}`}
                onClick={(e) => handleLinkClick(e, heading.id)}
                className={`line-clamp-1 block py-1 transition-colors ${
                  isActive
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {heading.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Mobile Collapsible Table of Contents
 */
export function MobileTableOfContents({
  headings,
  className = '',
}: TableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!headings || headings.length === 0) {
    return null;
  }

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    e.preventDefault();
    setIsOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      window.history.pushState(null, '', `#${id}`);
    }
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={`border-border bg-card/60 rounded-xl border p-4 ${className}`}
    >
      <CollapsibleTrigger className="text-foreground hover:text-primary flex w-full items-center justify-between text-sm font-medium transition-colors">
        <span className="flex items-center gap-2 font-semibold">
          <List className="size-4" />
          <span>Table of Contents</span>
          <span className="text-muted-foreground text-xs font-normal">
            ({headings.length} sections)
          </span>
        </span>
        <ChevronDown
          className={`text-muted-foreground size-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="border-border mt-3 border-t pt-3">
        <ul className="max-h-64 space-y-2 overflow-y-auto pr-1 text-sm">
          {headings.map((heading) => (
            <li
              key={heading.id}
              className={`${heading.level === 3 ? 'ml-3' : ''}`}
            >
              <a
                href={`#${heading.id}`}
                onClick={(e) => handleLinkClick(e, heading.id)}
                className="text-muted-foreground hover:text-foreground line-clamp-1 block py-1 transition-colors"
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
