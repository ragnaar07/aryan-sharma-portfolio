'use client';

import { BlogList } from '@/components/blog/BlogList';
import Container from '@/components/common/Container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import { BlogPostPreview } from '@/types/blog';
import { FilterX } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface BlogPageClientProps {
  initialPosts: BlogPostPreview[];
  initialTags?: string[];
}

export function BlogPageClient({ initialPosts }: BlogPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { triggerHaptic, isMobile } = useHapticFeedback();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Sync state with URL params
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const tagParam = searchParams.get('tag');

    setSelectedCategory(categoryParam);
    setSelectedTag(tagParam);
  }, [searchParams]);

  // Extract unique categories with counts
  const categoriesWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const post of initialPosts) {
      const cat = post.frontmatter.category || 'Engineering';
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [initialPosts]);

  // Extract unique tags with counts
  const tagsWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const post of initialPosts) {
      for (const tag of post.frontmatter.tags) {
        const lower = tag.toLowerCase();
        counts[lower] = (counts[lower] || 0) + 1;
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [initialPosts]);

  // Helper to update URL query params client-side without full reload
  const updateUrl = useCallback(
    (newCategory: string | null, newTag: string | null) => {
      const params = new URLSearchParams();
      if (newCategory) params.set('category', newCategory);
      if (newTag) params.set('tag', newTag);

      const qs = params.toString();
      const newPath = qs ? `/blog?${qs}` : '/blog';
      router.replace(newPath, { scroll: false });
    },
    [router],
  );

  // Handle Category selection
  const handleCategoryClick = (category: string | null) => {
    if (isMobile()) triggerHaptic('light');

    const nextCategory = selectedCategory === category ? null : category;
    setSelectedCategory(nextCategory);
    updateUrl(nextCategory, selectedTag);
  };

  // Handle Tag selection
  const handleTagClick = (tag: string) => {
    if (isMobile()) triggerHaptic('light');

    const nextTag = selectedTag === tag ? null : tag;
    setSelectedTag(nextTag);
    updateUrl(selectedCategory, nextTag);
  };

  // Clear all filters
  const handleClearFilters = () => {
    if (isMobile()) triggerHaptic('light');
    setSelectedCategory(null);
    setSelectedTag(null);
    router.replace('/blog', { scroll: false });
  };

  // Client-side filtering
  const filteredPosts = useMemo(() => {
    return initialPosts.filter((post) => {
      const postCategory = (
        post.frontmatter.category || 'Engineering'
      ).toLowerCase();
      const matchesCategory =
        !selectedCategory || postCategory === selectedCategory.toLowerCase();

      const matchesTag =
        !selectedTag ||
        post.frontmatter.tags.some(
          (t) => t.toLowerCase() === selectedTag.toLowerCase(),
        );

      return matchesCategory && matchesTag;
    });
  }, [initialPosts, selectedCategory, selectedTag]);

  const hasActiveFilters = Boolean(selectedCategory || selectedTag);

  return (
    <Container className="py-16">
      <div className="space-y-10">
        {/* Header */}
        <div className="space-y-4 text-center">
          <h1 className="text-foreground text-4xl font-bold tracking-tight lg:text-5xl">
            Blog
          </h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Technical writing, deep dives, and architectural notes on software
            engineering, AI/ML, and system design.
          </p>
        </div>

        <Separator />

        {/* Filter Controls (Client-side, preserves static caching) */}
        <div className="space-y-6">
          {/* Categories */}
          {categoriesWithCounts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
                  Categories
                </h2>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="text-muted-foreground hover:text-foreground h-7 text-xs"
                  >
                    <FilterX className="mr-1.5 size-3.5" />
                    Reset filters
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleCategoryClick(null)}
                  className="transition-colors focus:outline-none"
                >
                  <Badge
                    variant={!selectedCategory ? 'default' : 'outline'}
                    className="cursor-pointer px-3 py-1 text-xs"
                  >
                    All ({initialPosts.length})
                  </Badge>
                </button>

                {categoriesWithCounts.map(([catName, count]) => {
                  const isSelected =
                    selectedCategory?.toLowerCase() === catName.toLowerCase();
                  return (
                    <button
                      key={catName}
                      type="button"
                      onClick={() => handleCategoryClick(catName)}
                      className="transition-colors focus:outline-none"
                    >
                      <Badge
                        variant={isSelected ? 'default' : 'outline'}
                        className="cursor-pointer px-3 py-1 text-xs"
                      >
                        {catName} ({count})
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tags */}
          {tagsWithCounts.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
                Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {tagsWithCounts.map(([tag, count]) => {
                  const isSelected =
                    selectedTag?.toLowerCase() === tag.toLowerCase();
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagClick(tag)}
                      className="transition-colors focus:outline-none"
                    >
                      <Badge
                        variant={isSelected ? 'secondary' : 'outline'}
                        className={`cursor-pointer px-2.5 py-1 text-xs capitalize ${
                          isSelected
                            ? 'border-primary/50 bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground'
                        }`}
                      >
                        #{tag} ({count})
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Blog Posts Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-foreground text-xl font-semibold">
              {hasActiveFilters ? (
                <span>
                  Filtered Articles{' '}
                  <span className="text-muted-foreground text-sm font-normal">
                    ({filteredPosts.length}{' '}
                    {filteredPosts.length === 1 ? 'post' : 'posts'})
                  </span>
                </span>
              ) : (
                <span>
                  All Articles{' '}
                  <span className="text-muted-foreground text-sm font-normal">
                    ({initialPosts.length}{' '}
                    {initialPosts.length === 1 ? 'post' : 'posts'})
                  </span>
                </span>
              )}
            </h2>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="border-border flex min-h-[300px] flex-col items-center justify-center space-y-4 rounded-xl border border-dashed p-8 text-center">
              <p className="text-foreground text-lg font-medium">
                No articles match your current filters
              </p>
              <p className="text-muted-foreground text-sm">
                Try selecting a different category or tag, or reset all filters.
              </p>
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Reset all filters
              </Button>
            </div>
          ) : (
            <BlogList posts={filteredPosts} />
          )}
        </div>
      </div>
    </Container>
  );
}
