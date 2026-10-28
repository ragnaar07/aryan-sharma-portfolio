'use client';

import {
  AlertCircle,
  Archive,
  ArrowLeft,
  Check,
  FileEdit,
  Globe2,
  Loader2,
  Save,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import { Link } from 'next-view-transitions';
import Image from 'next/image';
import React, { useActionState, useRef, useState } from 'react';

import { saveProjectAction } from '@/app/admin/actions';
import { BLOG_VALIDATION, adminBlogLabels } from '@/config/BlogAdmin';
import { compressCoverImage } from '@/lib/compress-cover-image';
import type { ProjectRecord } from '@/lib/project-validation';

import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
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
import { Textarea } from '../ui/textarea';

interface ProjectFormProps {
  initialProject?: Partial<ProjectRecord> | null;
  isEditing?: boolean;
}

export function ProjectForm({
  initialProject,
  isEditing = false,
}: ProjectFormProps) {
  const initialValues = {
    title: initialProject?.title || '',
    slug: initialProject?.slug || '',
    shortDescription: initialProject?.shortDescription || '',
    description: initialProject?.description || '',
    category: initialProject?.category || 'Engineering',
    tags: initialProject?.tags?.join(', ') || '',
    techStack: initialProject?.techStack?.join(', ') || '',
    coverImage: initialProject?.coverImage || '',
    liveUrl: initialProject?.liveUrl || '',
    repoUrl: initialProject?.repoUrl || '',
    demoUrl: initialProject?.demoUrl || '',
    github: initialProject?.github || '',
    featured: Boolean(initialProject?.featured),
    status:
      initialProject?.status === 'archived'
        ? 'archived'
        : initialProject?.isPublished
          ? 'published'
          : 'draft',
    order: initialProject?.order ?? 0,
  };

  const [state, formAction, isPending] = useActionState(saveProjectAction, {
    success: false,
    message: '',
    errors: {},
  });
  const [coverImage, setCoverImage] = useState(initialValues.coverImage);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState(initialValues.status);

  const handleCoverUpload = async (file: File) => {
    setCoverUploadError(null);
    setIsUploadingCover(true);

    try {
      const compressedImage = await compressCoverImage(file);
      if (
        compressedImage.size > BLOG_VALIDATION.coverImage.maxUploadSizeBytes
      ) {
        throw new Error(adminBlogLabels.errors.coverImageTooLarge);
      }

      const uploadData = new FormData();
      uploadData.append('file', compressedImage, 'project-cover.webp');
      const response = await fetch('/api/admin/upload-cover', {
        method: 'POST',
        body: uploadData,
      });
      const result: { url?: string; error?: string } = await response.json();

      if (!response.ok || !result.url) {
        throw new Error(
          result.error || 'Failed to upload project cover image.',
        );
      }

      setCoverImage(result.url);
    } catch (error) {
      setCoverUploadError(
        error instanceof Error ? error.message : 'Cover image upload failed.',
      );
    } finally {
      setIsUploadingCover(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
        <Link href="/admin/projects" className="flex items-center gap-2">
          <ArrowLeft className="size-4" />
          Back to projects
        </Link>
      </Button>

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-primary text-xs font-semibold tracking-[0.2em] uppercase">
            Project studio
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            {isEditing ? 'Edit project' : 'Create a project'}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl text-sm">
            Shape how this project appears on your portfolio and choose when it
            goes live.
          </p>
        </div>
      </div>

      {state.message && !state.success && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Project validation failed</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      {state.message && state.success && (
        <Alert className="border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400">
          <AlertCircle className="size-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <form action={formAction} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileEdit className="text-primary size-4" />
              Project details
            </CardTitle>
            <CardDescription>
              Start with a clear title and a concise summary of the work.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={initialValues.title}
                />
                {state.errors?.title && (
                  <p className="text-sm text-red-500">
                    {state.errors.title[0]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  name="slug"
                  defaultValue={initialValues.slug}
                />
                {state.errors?.slug && (
                  <p className="text-sm text-red-500">{state.errors.slug[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  name="category"
                  defaultValue={initialValues.category}
                />
                {state.errors?.category && (
                  <p className="text-sm text-red-500">
                    {state.errors.category[0]}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="shortDescription">Short description</Label>
                <Textarea
                  id="shortDescription"
                  name="shortDescription"
                  defaultValue={initialValues.shortDescription}
                  rows={3}
                />
                {state.errors?.shortDescription && (
                  <p className="text-sm text-red-500">
                    {state.errors.shortDescription[0]}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={initialValues.description}
                  rows={6}
                />
                {state.errors?.description && (
                  <p className="text-sm text-red-500">
                    {state.errors.description[0]}
                  </p>
                )}
              </div>

              <div className="space-y-1 border-t pt-5 md:col-span-2">
                <h2 className="font-semibold">Discoverability</h2>
                <p className="text-muted-foreground text-sm">
                  Add keywords and technologies visitors can scan.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  name="tags"
                  defaultValue={initialValues.tags}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="techStack">Tech stack</Label>
                <Input
                  id="techStack"
                  name="techStack"
                  defaultValue={initialValues.techStack}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="liveUrl">Live URL</Label>
                <Input
                  id="liveUrl"
                  name="liveUrl"
                  defaultValue={initialValues.liveUrl}
                />
              </div>

              <div className="space-y-1 border-t pt-5 md:col-span-2">
                <h2 className="font-semibold">Links and cover image</h2>
                <p className="text-muted-foreground text-sm">
                  Give visitors a way to explore the project and choose its
                  visual.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="repoUrl">Repo URL</Label>
                <Input
                  id="repoUrl"
                  name="repoUrl"
                  defaultValue={initialValues.repoUrl}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="demoUrl">Demo URL</Label>
                <Input
                  id="demoUrl"
                  name="demoUrl"
                  defaultValue={initialValues.demoUrl}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="github">GitHub URL</Label>
                <Input
                  id="github"
                  name="github"
                  defaultValue={initialValues.github}
                />
              </div>

              <div className="space-y-3 md:col-span-2">
                <Label htmlFor="coverImage">Cover image</Label>
                <input type="hidden" name="coverImage" value={coverImage} />
                {coverImage && (
                  <div className="bg-muted relative aspect-video max-w-2xl overflow-hidden rounded-lg border">
                    <Image
                      src={coverImage}
                      alt="Project cover preview"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isPending || isUploadingCover}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploadingCover ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <UploadCloud className="mr-2 size-4" />
                    )}
                    {isUploadingCover
                      ? 'Uploading image...'
                      : coverImage
                        ? 'Replace image'
                        : 'Upload image'}
                  </Button>
                  {coverImage && (
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={isPending || isUploadingCover}
                      onClick={() => {
                        setCoverImage('');
                        setCoverUploadError(null);
                      }}
                    >
                      Remove image
                    </Button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={BLOG_VALIDATION.coverImage.allowedMimeTypes.join(
                      ',',
                    )}
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void handleCoverUpload(file);
                    }}
                  />
                </div>
                <p className="text-muted-foreground text-xs">
                  JPEG, PNG, WebP, or AVIF. Images are resized and compressed
                  before upload.
                </p>
                {coverUploadError && (
                  <p role="alert" className="text-sm text-red-500">
                    {coverUploadError}
                  </p>
                )}
                <div className="space-y-2">
                  <Label htmlFor="coverImage">
                    Or use an image URL or site path
                  </Label>
                  <Input
                    id="coverImage"
                    value={coverImage}
                    onChange={(event) => {
                      setCoverImage(event.target.value);
                      setCoverUploadError(null);
                    }}
                    placeholder="/project/example.webp or https://..."
                    disabled={isPending || isUploadingCover}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe2 className="text-primary size-4" />
              Publishing
            </CardTitle>
            <CardDescription>
              Drafts stay private. Published projects appear on your public
              portfolio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">Choose visibility</legend>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  {
                    value: 'draft',
                    title: 'Save as draft',
                    description: 'Only you can see this project.',
                    Icon: FileEdit,
                  },
                  {
                    value: 'published',
                    title: 'Publish project',
                    description: 'Make it visible on your portfolio.',
                    Icon: Globe2,
                  },
                  {
                    value: 'archived',
                    title: 'Archive project',
                    description: 'Keep it in admin, hide it publicly.',
                    Icon: Archive,
                  },
                ].map(({ value, title, description, Icon }) => (
                  <label
                    key={value}
                    className={`relative flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${
                      status === value
                        ? 'border-primary bg-primary/5 ring-primary/30 ring-1'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={value}
                      checked={status === value}
                      onChange={() => setStatus(value)}
                      disabled={isPending}
                      className="sr-only"
                    />
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                        status === value
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-sm font-semibold">
                        {title}
                        {status === value && (
                          <Check className="text-primary size-3.5" />
                        )}
                      </span>
                      <span className="text-muted-foreground mt-1 block text-xs leading-relaxed">
                        {description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-5 border-t pt-5 sm:grid-cols-2">
              <label className="bg-muted/30 flex cursor-pointer items-start gap-3 rounded-lg border p-4">
                <input
                  id="featured"
                  name="featured"
                  type="checkbox"
                  defaultChecked={initialValues.featured}
                  disabled={isPending}
                  className="border-input text-primary focus-visible:ring-ring mt-0.5 size-4 rounded"
                />
                <span>
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Sparkles className="text-primary size-4" />
                    Feature this project
                  </span>
                  <span className="text-muted-foreground mt-1 block text-xs">
                    Give it priority in the featured area.
                  </span>
                </span>
              </label>

              <div className="space-y-2">
                <Label htmlFor="order">Display order</Label>
                <Input
                  id="order"
                  name="order"
                  type="number"
                  min="0"
                  defaultValue={initialValues.order}
                  disabled={isPending}
                />
                <p className="text-muted-foreground text-xs">
                  Lower numbers appear earlier when featured status is the same.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-background/95 sticky bottom-0 z-10 flex flex-col-reverse justify-between gap-3 border-t py-4 backdrop-blur sm:flex-row sm:items-center">
          <p className="text-muted-foreground text-sm">
            {status === 'published'
              ? 'This project will be visible to everyone.'
              : status === 'archived'
                ? 'This project will be hidden from the public portfolio.'
                : 'This project will be saved privately as a draft.'}
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              type="button"
              asChild
              disabled={isPending}
            >
              <Link href="/admin/projects">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isPending || isUploadingCover}>
              {isPending || isUploadingCover ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : status === 'published' ? (
                <>
                  <Globe2 className="mr-2 size-4" />
                  {isEditing ? 'Save and publish' : 'Publish project'}
                </>
              ) : status === 'archived' ? (
                <>
                  <Archive className="mr-2 size-4" />
                  Archive project
                </>
              ) : (
                <>
                  <Save className="mr-2 size-4" />
                  Save draft
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
