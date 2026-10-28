'use client';

import { ChevronDown, List } from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { TocHeading } from '@/lib/blog-toc';
import { cn } from '@/lib/utils';

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
  const headingIds = useMemo(() => headings.map((h) => h.id), [headings]);
  const activeId = useActiveHeading(headingIds);
  const scrollContainerRef = useRef<HTMLUListElement | null>(null);

  const [scrollState, setScrollState] = useState({
    canScrollUp: false,
    canScrollDown: false,
  });

  const updateScrollState = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const hasOverflow = scrollHeight > clientHeight + 1;

    setScrollState((prev) => {
      const nextCanScrollUp = hasOverflow && scrollTop > 2;
      const nextCanScrollDown =
        hasOverflow && scrollTop + clientHeight < scrollHeight - 2;

      if (
        prev.canScrollUp === nextCanScrollUp &&
        prev.canScrollDown === nextCanScrollDown
      ) {
        return prev;
      }

      return {
        canScrollUp: nextCanScrollUp,
        canScrollDown: nextCanScrollDown,
      };
    });
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    updateScrollState();

    const resizeObserver = new ResizeObserver(() => {
      updateScrollState();
    });
    resizeObserver.observe(el);

    window.addEventListener('resize', updateScrollState);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState, headings]);

  // Auto-scroll active heading link into view inside TOC container only
  useEffect(() => {
    if (!activeId || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const activeElement = Array.from(
      container.querySelectorAll<HTMLElement>('[data-heading-id]'),
    ).find((el) => el.getAttribute('data-heading-id') === activeId);

    if (!activeElement) return;

    const containerRect = container.getBoundingClientRect();
    const itemRect = activeElement.getBoundingClientRect();

    if (containerRect.height === 0 || itemRect.height === 0) return;

    const isAbove = itemRect.top < containerRect.top + 8;
    const isBelow = itemRect.bottom > containerRect.bottom - 8;

    if (isAbove || isBelow) {
      const currentScrollTop = container.scrollTop;
      const targetScrollTop =
        currentScrollTop +
        (itemRect.top - containerRect.top) -
        container.clientHeight / 2 +
        itemRect.height / 2;

      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth',
      });
    }
  }, [activeId]);

  const maskStyle = useMemo<React.CSSProperties>(() => {
    if (!scrollState.canScrollUp && !scrollState.canScrollDown) {
      return {
        maskImage: 'none',
        WebkitMaskImage: 'none',
      };
    }

    const topStop = scrollState.canScrollUp
      ? 'transparent 0px, black 24px'
      : 'black 0px';
    const bottomStop = scrollState.canScrollDown
      ? 'black calc(100% - 24px), transparent 100%'
      : 'black 100%';
    const gradient = `linear-gradient(to bottom, ${topStop}, ${bottomStop})`;

    return {
      maskImage: gradient,
      WebkitMaskImage: gradient,
    };
  }, [scrollState.canScrollUp, scrollState.canScrollDown]);

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
      className={cn(
        'border-border/60 bg-card/40 relative flex max-h-[calc(100dvh-8.5rem)] flex-col rounded-xl border p-4 backdrop-blur-sm',
        className,
      )}
    >
      <div className="text-muted-foreground mb-3 flex shrink-0 items-center gap-2 text-xs font-semibold tracking-wider uppercase">
        <List className="size-3.5" />
        <span>On this page</span>
      </div>

      <ul
        ref={scrollContainerRef}
        onScroll={updateScrollState}
        style={maskStyle}
        data-lenis-prevent
        className="[&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground min-h-0 flex-1 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] space-y-2 overflow-y-auto overscroll-contain pr-1 text-xs [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
      >
        {headings.map((heading) => {
          const isActive = activeId === heading.id;
          return (
            <li
              key={heading.id}
              data-heading-id={heading.id}
              className={heading.level === 3 ? 'ml-3' : ''}
            >
              <a
                href={`#${heading.id}`}
                onClick={(e) => handleLinkClick(e, heading.id)}
                className={cn(
                  'focus-visible:ring-ring line-clamp-1 block rounded-sm py-1 break-words transition-colors focus-visible:ring-1 focus-visible:outline-none',
                  isActive
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground',
                )}
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
  const headingIds = useMemo(() => headings.map((h) => h.id), [headings]);
  const activeId = useActiveHeading(headingIds);
  const mobileScrollContainerRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    if (!isOpen || !activeId) return;

    const frameId = requestAnimationFrame(() => {
      const container = mobileScrollContainerRef.current;
      if (!container) return;

      const activeElement = Array.from(
        container.querySelectorAll<HTMLElement>('[data-heading-id]'),
      ).find((el) => el.getAttribute('data-heading-id') === activeId);

      if (!activeElement) return;

      const containerRect = container.getBoundingClientRect();
      const itemRect = activeElement.getBoundingClientRect();

      if (containerRect.height === 0 || itemRect.height === 0) return;

      const isAbove = itemRect.top < containerRect.top + 8;
      const isBelow = itemRect.bottom > containerRect.bottom - 8;

      if (isAbove || isBelow) {
        const currentScrollTop = container.scrollTop;
        const targetScrollTop =
          currentScrollTop +
          (itemRect.top - containerRect.top) -
          container.clientHeight / 2 +
          itemRect.height / 2;

        container.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: 'smooth',
        });
      }
    });

    return () => cancelAnimationFrame(frameId);
  }, [isOpen, activeId]);

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
      className={cn(
        'border-border bg-card/60 rounded-xl border p-4',
        className,
      )}
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
          className={cn(
            'text-muted-foreground size-4 transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="border-border mt-3 border-t pt-3">
        <ul
          ref={mobileScrollContainerRef}
          data-lenis-prevent
          className="[&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground max-h-64 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] space-y-2 overflow-y-auto overscroll-contain pr-1 text-sm [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
        >
          {headings.map((heading) => {
            const isActive = activeId === heading.id;
            return (
              <li
                key={heading.id}
                data-heading-id={heading.id}
                className={heading.level === 3 ? 'ml-3' : ''}
              >
                <a
                  href={`#${heading.id}`}
                  onClick={(e) => handleLinkClick(e, heading.id)}
                  className={cn(
                    'focus-visible:ring-ring line-clamp-1 block rounded-sm py-1 break-words transition-colors focus-visible:ring-1 focus-visible:outline-none',
                    isActive
                      ? 'text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {heading.text}
                </a>
              </li>
            );
          })}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
