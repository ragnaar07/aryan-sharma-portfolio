'use client';

import {
  AlertCircle,
  ArrowLeft,
  Columns2,
  Eye,
  EyeOff,
  Loader2,
  Save,
} from 'lucide-react';
import { Link } from 'next-view-transitions';
import Image from 'next/image';
import React, { useActionState, useEffect, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { savePostAction } from '@/app/admin/actions';
import { BlogComponents } from '@/components/blog/BlogComponents';
import {
  BLOG_CATEGORIES,
  BlogCategory,
  adminBlogLabels,
} from '@/config/BlogAdmin';
import type { PostFormStateValues } from '@/lib/blog-validation';
import type { Post } from '@/types/blog';

import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';

interface PostFormProps {
  initialPost?: Partial<Post> | null;
  isEditing?: boolean;
}

// Live preview renderer using the exact same components and styling as the public post page
const previewComponents = {
  ...BlogComponents,
  img: ({
    src,
    alt,
    ...props
  }: {
    src?: string;
    alt?: string;
    [key: string]: unknown;
  }) => {
    if (!src) return null;
    return (
      <Image
        src={src}
        alt={alt || ''}
        width={800}
        height={400}
        className="rounded-lg object-cover"
        unoptimized
        {...props}
      />
    );
  },
};

export function PostForm({ initialPost, isEditing = false }: PostFormProps) {
  const initialValues: PostFormStateValues = {
    title: initialPost?.title || '',
    slug: initialPost?.slug || '',
    description: initialPost?.description || '',
    category: initialPost?.category || BLOG_CATEGORIES[0],
    coverImage: initialPost?.coverImage || initialPost?.image || '',
    tags: initialPost?.tags?.join(', ') || '',
    youtubeUrl: initialPost?.youtubeId
      ? `https://www.youtube.com/watch?v=${initialPost.youtubeId}`
      : '',
    content: initialPost?.content || '',
    isPublished: Boolean(initialPost?.isPublished),
  };

  const [state, formAction, isPending] = useActionState(savePostAction, {
    success: false,
    values: initialValues,
  });

  const currentValues = state.values || initialValues;

  // Controlled states for inputs that need real-time live preview & synchronization
  const [selectedCategory, setSelectedCategory] = useState<string>(
    currentValues.category || BLOG_CATEGORIES[0],
  );
  const [isPublished, setIsPublished] = useState<boolean>(
    currentValues.isPublished,
  );
  const [slugValue, setSlugValue] = useState<string>(currentValues.slug);
  const [contentValue, setContentValue] = useState<string>(
    currentValues.content,
  );
  const [titleValue, setTitleValue] = useState<string>(currentValues.title);

  // Preview Mode: 'write' (editor only), 'split' (side-by-side on desktop), 'preview' (preview only)
  const [previewMode, setPreviewMode] = useState<'write' | 'split' | 'preview'>(
    'split',
  );

  // Sync state if form action returns updated values after validation failure
  useEffect(() => {
    if (state.values) {
      if (state.values.category) {
        setSelectedCategory(state.values.category);
      }
      setIsPublished(Boolean(state.values.isPublished));
      if (state.values.slug) {
        setSlugValue(state.values.slug);
      }
      if (state.values.content) {
        setContentValue(state.values.content);
      }
      if (state.values.title) {
        setTitleValue(state.values.title);
      }
    }
  }, [state.values]);

  const handleTitleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!isEditing && !slugValue.trim()) {
      const generated = e.target.value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlugValue(generated);
    }
  };

  return (
    <form action={formAction} className="space-y-8">
      {/* Top Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link
              href="/admin"
              className="text-muted-foreground hover:text-foreground flex items-center gap-1.5"
            >
              <ArrowLeft className="size-4" />
              <span>Back to Admin</span>
            </Link>
          </Button>
          <div className="bg-border h-4 w-px" />
          <h1 className="text-xl font-bold tracking-tight">
            {isEditing
              ? adminBlogLabels.form.editTitle
              : adminBlogLabels.form.newTitle}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Live Preview Toggle Controls */}
          <div className="bg-muted/60 border-border inline-flex rounded-lg border p-1">
            <Button
              type="button"
              variant={previewMode === 'write' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setPreviewMode('write')}
              className="h-7 px-2.5 text-xs"
            >
              <EyeOff className="mr-1.5 size-3.5" />
              <span>Write</span>
            </Button>
            <Button
              type="button"
              variant={previewMode === 'split' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setPreviewMode('split')}
              className="hidden h-7 px-2.5 text-xs md:flex"
            >
              <Columns2 className="mr-1.5 size-3.5" />
              <span>Split</span>
            </Button>
            <Button
              type="button"
              variant={previewMode === 'preview' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setPreviewMode('preview')}
              className="h-7 px-2.5 text-xs"
            >
              <Eye className="mr-1.5 size-3.5" />
              <span>Preview</span>
            </Button>
          </div>

          <Button variant="outline" size="sm" asChild disabled={isPending}>
            <Link href="/admin">{adminBlogLabels.form.cancelButton}</Link>
          </Button>

          <Button
            type="submit"
            size="sm"
            disabled={isPending}
            className="flex items-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>{adminBlogLabels.form.savingButton}</span>
              </>
            ) : (
              <>
                <Save className="size-4" />
                <span>{adminBlogLabels.form.saveButton}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Global Form Error Alert */}
      {state.message && !state.success && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Validation Error</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      {/* Article Details & Metadata Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Post Identity (Title, Slug, Description) */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-border bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">
                Article Identity
              </CardTitle>
              <CardDescription>
                Define the public title, slug, and overview summary.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-sm font-medium">
                  {adminBlogLabels.form.titleLabel}{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  placeholder={adminBlogLabels.form.titlePlaceholder}
                  onBlur={handleTitleBlur}
                  disabled={isPending}
                  aria-invalid={Boolean(state.errors?.title)}
                />
                {state.errors?.title && (
                  <p className="text-destructive text-xs font-medium">
                    {state.errors.title[0]}
                  </p>
                )}
              </div>

              {/* Slug */}
              <div className="space-y-1.5">
                <Label htmlFor="slug" className="text-sm font-medium">
                  {adminBlogLabels.form.slugLabel}{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="slug"
                  name="slug"
                  value={slugValue}
                  onChange={(e) => setSlugValue(e.target.value)}
                  placeholder={adminBlogLabels.form.slugPlaceholder}
                  disabled={isPending}
                  readOnly={isEditing}
                  className={
                    isEditing
                      ? 'bg-muted/50 cursor-not-allowed font-mono text-sm'
                      : 'font-mono text-sm'
                  }
                  aria-invalid={Boolean(state.errors?.slug)}
                />
                <p className="text-muted-foreground text-xs">
                  {isEditing
                    ? 'Slug cannot be modified once published to prevent breaking inbound URLs.'
                    : adminBlogLabels.form.slugHelper}
                </p>
                {state.errors?.slug && (
                  <p className="text-destructive text-xs font-medium">
                    {state.errors.slug[0]}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-sm font-medium">
                  {adminBlogLabels.form.descriptionLabel}{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={currentValues.description}
                  placeholder={adminBlogLabels.form.descriptionPlaceholder}
                  rows={3}
                  disabled={isPending}
                  aria-invalid={Boolean(state.errors?.description)}
                />
                {state.errors?.description && (
                  <p className="text-destructive text-xs font-medium">
                    {state.errors.description[0]}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Controls (Visibility, Category, Cover, Tags) */}
        <div className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">
                Visibility & Category
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Published Switch */}
              <div className="border-border/60 flex items-center justify-between rounded-lg border p-3.5">
                <div className="space-y-0.5">
                  <Label htmlFor="isPublished" className="text-sm font-medium">
                    {adminBlogLabels.form.publishedLabel}
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    {isPublished
                      ? 'Publicly visible'
                      : 'Hidden draft (admin only)'}
                  </p>
                </div>
                <input
                  type="hidden"
                  name="isPublished"
                  value={isPublished ? 'true' : 'false'}
                />
                <Switch
                  id="isPublished"
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                  disabled={isPending}
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-sm font-medium">
                  {adminBlogLabels.form.categoryLabel}{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <input type="hidden" name="category" value={selectedCategory} />
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                  disabled={isPending}
                >
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue
                      placeholder={adminBlogLabels.form.categoryPlaceholder}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOG_CATEGORIES.map((cat: BlogCategory) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {state.errors?.category && (
                  <p className="text-destructive text-xs font-medium">
                    {state.errors.category[0]}
                  </p>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <Label htmlFor="tags" className="text-sm font-medium">
                  {adminBlogLabels.form.tagsLabel}{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="tags"
                  name="tags"
                  defaultValue={currentValues.tags}
                  placeholder={adminBlogLabels.form.tagsPlaceholder}
                  disabled={isPending}
                  aria-invalid={Boolean(state.errors?.tags)}
                />
                <p className="text-muted-foreground text-xs">
                  {adminBlogLabels.form.tagsHelper}
                </p>
                {state.errors?.tags && (
                  <p className="text-destructive text-xs font-medium">
                    {state.errors.tags[0]}
                  </p>
                )}
              </div>

              {/* Cover Image */}
              <div className="space-y-1.5">
                <Label htmlFor="coverImage" className="text-sm font-medium">
                  {adminBlogLabels.form.coverImageLabel}{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="coverImage"
                  name="coverImage"
                  defaultValue={currentValues.coverImage}
                  placeholder={adminBlogLabels.form.coverImagePlaceholder}
                  disabled={isPending}
                  aria-invalid={Boolean(state.errors?.coverImage)}
                />
                <p className="text-muted-foreground text-xs">
                  {adminBlogLabels.form.coverImageHelper}
                </p>
                {state.errors?.coverImage && (
                  <p className="text-destructive text-xs font-medium">
                    {state.errors.coverImage[0]}
                  </p>
                )}
              </div>

              {/* YouTube Video URL */}
              <div className="space-y-1.5">
                <Label htmlFor="youtubeUrl" className="text-sm font-medium">
                  {adminBlogLabels.form.youtubeUrlLabel}
                </Label>
                <Input
                  id="youtubeUrl"
                  name="youtubeUrl"
                  defaultValue={currentValues.youtubeUrl}
                  placeholder={adminBlogLabels.form.youtubeUrlPlaceholder}
                  disabled={isPending}
                  aria-invalid={Boolean(state.errors?.youtubeUrl)}
                />
                <p className="text-muted-foreground text-xs">
                  {adminBlogLabels.form.youtubeUrlHelper}
                </p>
                {state.errors?.youtubeUrl && (
                  <p className="text-destructive text-xs font-medium">
                    {state.errors.youtubeUrl[0]}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Editor & Live MDX Preview Section */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold">
              {adminBlogLabels.form.contentLabel}{' '}
              <span className="text-destructive">*</span>
            </CardTitle>
            <CardDescription>
              Write in Markdown/MDX with real-time preview side-by-side using
              the site&apos;s public renderer.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs font-normal">
            {contentValue.length.toLocaleString()} characters
          </Badge>
        </CardHeader>
        <CardContent>
          {/* Error Message for Content */}
          {state.errors?.content && (
            <p className="text-destructive mb-3 text-xs font-medium">
              {state.errors.content[0]}
            </p>
          )}

          {/* Conditional Layout Based on previewMode */}
          <div
            className={`grid gap-6 ${
              previewMode === 'split'
                ? 'grid-cols-1 lg:grid-cols-2'
                : 'grid-cols-1'
            }`}
          >
            {/* Editor Pane (visible in 'write' or 'split' mode) */}
            {(previewMode === 'write' || previewMode === 'split') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                    Editor (MDX / Markdown)
                  </span>
                </div>
                <Textarea
                  id="content"
                  name="content"
                  value={contentValue}
                  onChange={(e) => setContentValue(e.target.value)}
                  placeholder={adminBlogLabels.form.contentPlaceholder}
                  rows={24}
                  disabled={isPending}
                  className="min-h-[500px] font-mono text-sm leading-relaxed"
                  aria-invalid={Boolean(state.errors?.content)}
                />
              </div>
            )}

            {/* Live Preview Pane (visible in 'preview' or 'split' mode) */}
            {(previewMode === 'preview' || previewMode === 'split') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wider uppercase">
                    <Eye className="text-primary size-3.5" />
                    <span>Live Post Preview</span>
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    Site Typography
                  </Badge>
                </div>

                <div className="border-border bg-muted/10 max-h-[700px] min-h-[500px] overflow-y-auto rounded-lg border p-6">
                  {contentValue.trim() ? (
                    <article className="prose prose-neutral dark:prose-invert max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={previewComponents as unknown as Components}
                      >
                        {contentValue}
                      </ReactMarkdown>
                    </article>
                  ) : (
                    <div className="text-muted-foreground flex h-full min-h-[300px] flex-col items-center justify-center space-y-2 text-center text-sm">
                      <Eye className="size-8 opacity-40" />
                      <p className="italic">
                        Start typing Markdown in the editor to see the live
                        preview.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
