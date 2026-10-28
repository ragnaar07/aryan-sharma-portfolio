'use client';

import 'katex/dist/katex.min.css';
import {
  AlertCircle,
  ArrowLeft,
  Columns2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  ListChecks,
  Loader2,
  Save,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { Link } from 'next-view-transitions';
import Image from 'next/image';
import React, { useActionState, useEffect, useRef, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import { savePostAction, validateMdxAction } from '@/app/admin/actions';
import { BlogComponents } from '@/components/blog/BlogComponents';
import {
  BLOG_CATEGORIES,
  BlogCategory,
  adminBlogLabels,
} from '@/config/BlogAdmin';
import type { PostFormStateValues } from '@/lib/blog-validation';
import { preprocessMdxContent } from '@/lib/mdx-sanitize';
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

/**
 * Client-side image compressor:
 * Downscales to max 1200px wide, encodes as WebP, and steps down quality from 0.85
 * until the payload is under ~300 KB before uploading.
 */
async function compressImageToWebp(file: File): Promise<Blob> {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
  ];
  if (!allowedMimeTypes.includes(file.type)) {
    throw new Error(adminBlogLabels.errors.coverImageMimeInvalid);
  }

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image file for compression.'));
    };
    img.src = objectUrl;
  });

  const maxDimension = 1200;
  let targetWidth = image.naturalWidth || image.width;
  let targetHeight = image.naturalHeight || image.height;

  if (targetWidth > maxDimension) {
    targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
    targetWidth = maxDimension;
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable.');
  }

  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

  const targetMaxBytes = 300 * 1024; // ~300 KB
  let quality = 0.85;
  let blob: Blob | null = null;

  while (quality >= 0.4) {
    blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/webp', quality);
    });

    if (blob && blob.size <= targetMaxBytes) {
      break;
    }
    quality = Math.round((quality - 0.1) * 100) / 100;
  }

  if (!blob) {
    throw new Error('Image compression failed.');
  }

  return blob;
}

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

  // Cover image management state
  const [coverImage, setCoverImage] = useState<string>(
    currentValues.coverImage || '',
  );
  const [isUploadingCover, setIsUploadingCover] = useState<boolean>(false);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time MDX compilation syntax validation
  const [mdxSyntaxError, setMdxSyntaxError] = useState<string | null>(null);

  // Preview Mode: 'write' (editor only), 'split' (side-by-side on desktop), 'preview' (preview only)
  const [previewMode, setPreviewMode] = useState<'write' | 'split' | 'preview'>(
    'split',
  );

  // Sync scroll state and refs
  const [syncScroll, setSyncScroll] = useState<boolean>(false);
  const editorTextareaRef = useRef<HTMLTextAreaElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef<boolean>(false);

  // Proportional Unidirectional Sync Scroll: Editor drives Preview
  useEffect(() => {
    const editorEl = editorTextareaRef.current;
    const previewEl = previewContainerRef.current;
    if (!editorEl || !previewEl || !syncScroll) return;

    const handleEditorScroll = () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;

      const editorScrollable = editorEl.scrollHeight - editorEl.clientHeight;
      const previewScrollable = previewEl.scrollHeight - previewEl.clientHeight;

      if (editorScrollable > 0 && previewScrollable > 0) {
        const ratio = editorEl.scrollTop / editorScrollable;
        previewEl.scrollTop = Math.round(ratio * previewScrollable);
      }

      requestAnimationFrame(() => {
        isSyncingRef.current = false;
      });
    };

    handleEditorScroll();

    editorEl.addEventListener('scroll', handleEditorScroll, { passive: true });
    return () => {
      editorEl.removeEventListener('scroll', handleEditorScroll);
    };
  }, [syncScroll, previewMode]);

  // Debounced real-time MDX validation
  useEffect(() => {
    if (!contentValue.trim()) {
      setMdxSyntaxError(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const result = await validateMdxAction(contentValue);
        if (!result.valid) {
          const loc =
            result.line && result.column
              ? `Line ${result.line}, Column ${result.column}: `
              : result.line
                ? `Line ${result.line}: `
                : '';
          const excerpt = result.sourceExcerpt
            ? `\n> ${result.sourceExcerpt}`
            : '';
          setMdxSyntaxError(
            `${loc}${result.reason || result.error || 'Syntax error'}${excerpt}`,
          );
        } else {
          setMdxSyntaxError(null);
        }
      } catch {
        // Ignore network failure during typing
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [contentValue]);

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
      if (state.values.coverImage !== undefined) {
        setCoverImage(state.values.coverImage);
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

  const handleCoverUpload = async (file: File) => {
    setCoverUploadError(null);
    setIsUploadingCover(true);
    try {
      const compressedBlob = await compressImageToWebp(file);
      if (compressedBlob.size > 400 * 1024) {
        throw new Error(adminBlogLabels.errors.coverImageTooLarge);
      }

      const formData = new FormData();
      formData.append('file', compressedBlob, 'cover.webp');

      const response = await fetch('/api/admin/upload-cover', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload cover image.');
      }

      setCoverImage(data.url);
    } catch (err) {
      setCoverUploadError(
        err instanceof Error ? err.message : 'Upload failed. Please try again.',
      );
    } finally {
      setIsUploadingCover(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleCoverUpload(files[0]);
    }
  };

  return (
    <form action={formAction} className="space-y-8">
      {/* Top Action Bar (Sticky beneath AdminHeader) */}
      <div className="bg-card/95 border-border sticky top-16 z-30 flex flex-col gap-3 rounded-xl border p-3 shadow-sm backdrop-blur-md transition-all sm:flex-row sm:items-center sm:justify-between sm:p-4">
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

          <Button
            variant="outline"
            size="sm"
            asChild
            disabled={isPending || isUploadingCover}
          >
            <Link href="/admin">{adminBlogLabels.form.cancelButton}</Link>
          </Button>

          <Button
            type="submit"
            size="sm"
            disabled={isPending || isUploadingCover}
            className="flex items-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>{adminBlogLabels.form.savingButton}</span>
              </>
            ) : isUploadingCover ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Uploading...</span>
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
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
        {/* Post Identity (Title, Slug, Description) */}
        <div className="h-full">
          <Card className="border-border bg-card h-full">
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

              <div className="space-y-1.5">
                <Label htmlFor="tags" className="text-sm font-medium">
                  {adminBlogLabels.form.tagsLabel}{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="tags"
                  name="tags"
                  defaultValue={currentValues.tags}
                  placeholder={adminBlogLabels.form.tagsPlaceholder}
                  rows={3}
                  className="min-h-24 resize-y"
                  disabled={isPending}
                  aria-invalid={Boolean(state.errors?.tags)}
                />
                <p className="text-muted-foreground text-xs">
                  Enter comma-separated keywords. Use multiple lines if helpful.
                </p>
                {state.errors?.tags && (
                  <p className="text-destructive text-xs font-medium">
                    {state.errors.tags[0]}
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
                  rows={6}
                  className="min-h-40 resize-y"
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

        {/* Sidebar Controls */}
        <div className="flex h-full flex-col gap-4">
          <Card className="border-primary/15 from-primary/[0.06] to-card shrink-0 bg-gradient-to-br">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <ListChecks className="text-primary size-4" />
                Before you publish
              </CardTitle>
              <CardDescription>
                A quick pass helps every article feel complete.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-muted-foreground grid gap-3 text-xs leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="bg-primary mt-1.5 size-1.5 shrink-0 rounded-full" />
                  <span>
                    Write a clear title and summary so readers know what
                    they&apos;ll learn.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="bg-primary mt-1.5 size-1.5 shrink-0 rounded-full" />
                  <span>
                    Add relevant tags and choose the closest matching category.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="bg-primary mt-1.5 size-1.5 shrink-0 rounded-full" />
                  <span>
                    Use the live preview to check formatting before saving.
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border bg-card flex-1">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">
                Visibility & Category
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-5">
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

              <div className="border-border/60 bg-muted/30 mt-auto rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Badge variant={isPublished ? 'default' : 'secondary'}>
                    {isPublished ? 'Published' : 'Draft'}
                  </Badge>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {isPublished
                      ? 'This article will be visible on your public blog.'
                      : 'This article stays private until you publish it.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <ImageIcon className="text-primary size-4" />
              {adminBlogLabels.form.coverImageLabel}
            </CardTitle>
            <CardDescription>
              Choose the image that represents this article in blog cards and
              social previews.
            </CardDescription>
          </div>
          <Badge variant="outline" className="shrink-0 text-[10px]">
            16:9 recommended
          </Badge>
        </CardHeader>
        <CardContent className="grid items-center gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
          <input type="hidden" name="coverImage" value={coverImage} />
          <div className="space-y-2">
            {coverImage ? (
              <>
                <div className="border-border bg-muted/30 relative aspect-[16/7] max-h-64 w-full max-w-3xl overflow-hidden rounded-lg border shadow-sm">
                  <Image
                    src={coverImage}
                    alt="Cover preview"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending || isUploadingCover}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadCloud className="mr-1.5 size-3.5" />
                    Replace image
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isPending || isUploadingCover}
                    onClick={() => {
                      setCoverImage('');
                      setCoverUploadError(null);
                    }}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="mr-1.5 size-3.5" />
                    {adminBlogLabels.form.coverRemove}
                  </Button>
                </div>
              </>
            ) : (
              <div
                role="button"
                tabIndex={isUploadingCover || isPending ? -1 : 0}
                aria-label={adminBlogLabels.form.coverUploadDropzone}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() =>
                  !isUploadingCover && fileInputRef.current?.click()
                }
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    if (!isUploadingCover && !isPending) {
                      fileInputRef.current?.click();
                    }
                  }
                }}
                className={`border-border/70 hover:border-primary/50 hover:bg-muted/30 focus-visible:ring-ring flex aspect-[16/7] max-h-64 w-full max-w-3xl cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-5 text-center transition-colors focus-visible:ring-2 focus-visible:outline-none ${
                  isDragging ? 'border-primary bg-primary/5' : ''
                } ${isUploadingCover ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                {isUploadingCover ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="text-primary size-7 animate-spin" />
                    <p className="text-muted-foreground text-sm font-medium">
                      {adminBlogLabels.form.coverUploading}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="bg-muted flex size-11 items-center justify-center rounded-full">
                      <UploadCloud className="text-muted-foreground size-5" />
                    </div>
                    <div>
                      <p className="text-foreground text-sm font-medium">
                        {adminBlogLabels.form.coverUploadDropzone}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {adminBlogLabels.form.coverUploadHint}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleCoverUpload(file);
              }}
            />
            <div aria-live="polite">
              {coverUploadError && (
                <p className="text-destructive mt-1 text-xs font-medium">
                  {coverUploadError}
                </p>
              )}
              {state.errors?.coverImage && (
                <p className="text-destructive mt-1 text-xs font-medium">
                  {state.errors.coverImage[0]}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-center gap-4 lg:border-l lg:pl-6">
            <div className="space-y-1.5">
              <Label
                htmlFor="coverImageUrlInput"
                className="text-sm font-medium"
              >
                Or use an image link
              </Label>
              <Input
                id="coverImageUrlInput"
                value={coverImage}
                onChange={(event) => {
                  setCoverImage(event.target.value);
                  setCoverUploadError(null);
                }}
                placeholder={adminBlogLabels.form.coverExternalUrlPlaceholder}
                disabled={isPending || isUploadingCover}
              />
              <p className="text-muted-foreground text-xs">
                Paste an HTTPS image URL or a path to an image in the site.
              </p>
            </div>
            <p className="text-muted-foreground bg-muted/40 rounded-lg p-3 text-xs leading-relaxed">
              {adminBlogLabels.form.coverUploadHint}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Editor & Live MDX Preview Section */}
      <Card className="border-border bg-card flex min-h-0 flex-col overflow-hidden">
        <CardHeader className="border-border/40 flex shrink-0 flex-col items-start justify-between gap-3 border-b pb-4 sm:flex-row sm:items-center">
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
        <CardContent className="min-h-0 flex-1 p-4 pt-4 sm:p-6">
          {/* Error Message for Content */}
          {state.errors?.content && (
            <p className="text-destructive mb-3 text-xs font-medium">
              {state.errors.content[0]}
            </p>
          )}

          {/* Conditional Layout Based on previewMode */}
          <div
            className={`grid min-h-0 gap-6 ${
              previewMode === 'split'
                ? 'grid-cols-1 lg:grid-cols-2'
                : 'grid-cols-1'
            }`}
          >
            {/* Editor Pane (visible in 'write' or 'split' mode) */}
            {(previewMode === 'write' || previewMode === 'split') && (
              <div className="border-border bg-card flex h-[70dvh] min-h-0 min-h-[380px] flex-col overflow-hidden rounded-lg border lg:h-[calc(100dvh-15rem)] lg:min-h-[450px]">
                {/* Pinned Header */}
                <div className="bg-card border-border/60 sticky top-0 z-10 flex shrink-0 flex-col gap-1.5 border-b p-3">
                  <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    Editor (MDX / Markdown)
                  </span>
                  <p className="text-muted-foreground text-xs leading-normal">
                    <span className="text-foreground font-medium">
                      Syntax guide:
                    </span>{' '}
                    use{' '}
                    <code className="bg-muted rounded px-1 py-0.5 font-mono text-[11px]">
                      $...$
                    </code>{' '}
                    /{' '}
                    <code className="bg-muted rounded px-1 py-0.5 font-mono text-[11px]">
                      $$...$$
                    </code>{' '}
                    for math, backticks for code, avoid raw{' '}
                    <code className="bg-muted rounded px-1 py-0.5 font-mono text-[11px]">
                      {'{\u00A0}'}
                    </code>{' '}
                    and{' '}
                    <code className="bg-muted rounded px-1 py-0.5 font-mono text-[11px]">
                      &lt;
                    </code>{' '}
                    in plain text.
                  </p>
                </div>

                {/* Textarea Container */}
                <div className="relative min-h-0 flex-1">
                  <Textarea
                    ref={editorTextareaRef}
                    id="content"
                    name="content"
                    value={contentValue}
                    onChange={(e) => setContentValue(e.target.value)}
                    placeholder={adminBlogLabels.form.contentPlaceholder}
                    disabled={isPending}
                    data-lenis-prevent
                    className="[field-sizing:normal] h-full w-full resize-none overflow-y-auto overscroll-contain rounded-none border-0 bg-transparent p-4 font-mono text-sm leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0"
                    aria-invalid={Boolean(state.errors?.content)}
                  />
                </div>
              </div>
            )}

            {/* Live Preview Pane (visible in 'preview' or 'split' mode) */}
            {(previewMode === 'preview' || previewMode === 'split') && (
              <div className="border-border bg-card flex h-[70dvh] min-h-0 min-h-[380px] flex-col overflow-hidden rounded-lg border lg:h-[calc(100dvh-15rem)] lg:min-h-[450px]">
                {/* Pinned Header */}
                <div className="bg-card border-border/60 sticky top-0 z-10 flex shrink-0 flex-col gap-2 border-b p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
                      <Eye className="text-primary size-3.5" />
                      <span>Live Post Preview</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <Switch
                          id="sync-scroll-preview"
                          checked={syncScroll}
                          onCheckedChange={setSyncScroll}
                          className="scale-75"
                        />
                        <Label
                          htmlFor="sync-scroll-preview"
                          className="text-muted-foreground hover:text-foreground cursor-pointer text-xs select-none"
                        >
                          Sync scroll
                        </Label>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        Site Typography
                      </Badge>
                    </div>
                  </div>

                  {/* Pinned MDX syntax compilation warning banner */}
                  {(mdxSyntaxError || state.errors?.content) && (
                    <Alert variant="destructive" className="py-2.5">
                      <AlertCircle className="size-4" />
                      <AlertTitle className="text-xs font-semibold">
                        MDX Syntax Compilation Error
                      </AlertTitle>
                      <AlertDescription className="font-mono text-xs whitespace-pre-wrap">
                        {mdxSyntaxError || state.errors?.content?.[0]}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Scrollable Preview Body */}
                <div
                  ref={previewContainerRef}
                  data-lenis-prevent
                  className="bg-muted/10 min-h-0 flex-1 overflow-y-auto overscroll-contain p-6"
                >
                  {contentValue.trim() ? (
                    <article className="prose prose-neutral dark:prose-invert max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={previewComponents as unknown as Components}
                      >
                        {preprocessMdxContent(contentValue)}
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
