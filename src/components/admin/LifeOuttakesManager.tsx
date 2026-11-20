'use client';

import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Loader2,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { type FormEvent, useTransition } from 'react';
import { toast } from 'sonner';

import {
  deleteLifeOuttakeAction,
  moveLifeOuttakeAction,
  saveLifeOuttakeAction,
} from '@/app/admin/life-outtakes-actions';
import { compressCoverImage } from '@/lib/compress-cover-image';
import type { LifeOuttake } from '@/lib/life-outtakes';

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
import { Textarea } from '../ui/textarea';

interface LifeOuttakesManagerProps {
  outtakes: LifeOuttake[];
}

export function LifeOuttakesManager({ outtakes }: LifeOuttakesManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const savePhoto = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      try {
        const file = formData.get('file');
        if (file instanceof File && file.size > 0) {
          const compressedImage = await compressCoverImage(file);
          const bitmap = await createImageBitmap(compressedImage);
          formData.set('width', String(bitmap.width));
          formData.set('height', String(bitmap.height));
          bitmap.close();
          const uploadData = new FormData();
          uploadData.append('file', compressedImage, 'life-outtake.webp');

          const response = await fetch('/api/admin/upload-cover', {
            method: 'POST',
            body: uploadData,
          });
          const payload: unknown = await response.json();
          if (!payload || typeof payload !== 'object') {
            throw new Error('The image upload returned an invalid response.');
          }

          const uploadResult = payload as {
            url?: unknown;
            error?: unknown;
          };
          if (!response.ok || typeof uploadResult.url !== 'string') {
            throw new Error(
              typeof uploadResult.error === 'string'
                ? uploadResult.error
                : 'Failed to upload this photo.',
            );
          }

          formData.set('imageUrl', uploadResult.url);
          formData.set('newImage', 'true');
        } else {
          formData.set('newImage', 'false');
        }

        formData.delete('file');
        const result = await saveLifeOuttakeAction(formData);
        if (!result.success) {
          toast.error(result.error || 'Failed to save this photo.');
          return;
        }

        toast.success(
          formData.get('id')
            ? 'Photo updated.'
            : 'Photo added to Life Outtakes.',
        );
        if (!formData.get('id')) {
          form.reset();
        }
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to save this photo.',
        );
      }
    });
  };

  const movePhoto = (id: string, direction: 'up' | 'down') => {
    startTransition(async () => {
      try {
        const result = await moveLifeOuttakeAction(id, direction);
        if (!result.success) {
          toast.error(result.error || 'Failed to reorder photos.');
          return;
        }
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to reorder photos.',
        );
      }
    });
  };

  const deletePhoto = (photo: LifeOuttake) => {
    if (!window.confirm(`Delete this photo and its image?`)) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await deleteLifeOuttakeAction(photo.id);
        if (!result.success) {
          toast.error(result.error || 'Failed to delete this photo.');
          return;
        }
        toast.success('Photo deleted.');
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to delete this photo.',
        );
      }
    });
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImagePlus className="size-5" />
            Add a moment
          </CardTitle>
          <CardDescription>
            Keep it candid: add a photo, a personal caption, and optional side
            quest collection.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={savePhoto} className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="new-photo-file">Photo</Label>
              <Input
                id="new-photo-file"
                name="file"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                required
              />
              <p className="text-muted-foreground text-xs">
                JPEG, PNG, WebP, or AVIF. Images are resized and compressed
                before upload.
              </p>
            </div>
            <input type="hidden" name="imageUrl" value="" />
            <input type="hidden" name="newImage" value="false" />
            <input type="hidden" name="width" value="" />
            <input type="hidden" name="height" value="" />
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="new-photo-caption">Caption</Label>
              <Textarea
                id="new-photo-caption"
                name="caption"
                placeholder="What do you remember about this moment?"
                maxLength={240}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-photo-alt">Alt text</Label>
              <Input
                id="new-photo-alt"
                name="altText"
                placeholder="Describe what is visible in the photo"
                maxLength={200}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-photo-collection">
                Side quest collection{' '}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="new-photo-collection"
                name="collection"
                placeholder="Weekend trails"
                maxLength={40}
              />
            </div>
            <label className="text-muted-foreground flex items-center gap-2 text-sm md:col-span-2">
              <input
                type="checkbox"
                name="isPublished"
                className="accent-primary size-4"
              />
              Publish on the homepage
            </label>
            <div className="md:col-span-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                Add photo
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Your moments</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            The homepage shows up to six published photos in this order.
          </p>
        </div>

        {outtakes.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground py-10 text-center text-sm">
              No photos yet. Add a moment above to start your collection.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {outtakes.map((photo, index) => (
              <Card key={photo.id}>
                <CardContent className="grid gap-5 p-5 sm:grid-cols-[180px_1fr]">
                  <div className="space-y-3">
                    <div
                      className="relative w-full overflow-hidden rounded-md"
                      style={{
                        aspectRatio: `${photo.width ?? 4} / ${photo.height ?? 3}`,
                      }}
                    >
                      <Image
                        src={photo.imageUrl}
                        alt={photo.altText}
                        fill
                        sizes="(max-width: 640px) 100vw, 180px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant={photo.isPublished ? 'default' : 'secondary'}
                      >
                        {photo.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          aria-label="Move photo up"
                          title="Move up"
                          disabled={isPending || index === 0}
                          onClick={() => movePhoto(photo.id, 'up')}
                        >
                          <ArrowUp />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          aria-label="Move photo down"
                          title="Move down"
                          disabled={isPending || index === outtakes.length - 1}
                          onClick={() => movePhoto(photo.id, 'down')}
                        >
                          <ArrowDown />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={savePhoto} className="space-y-4">
                    <input type="hidden" name="id" value={photo.id} />
                    <input
                      type="hidden"
                      name="imageUrl"
                      value={photo.imageUrl}
                    />
                    <input type="hidden" name="newImage" value="false" />
                    <input
                      type="hidden"
                      name="width"
                      value={photo.width ?? ''}
                    />
                    <input
                      type="hidden"
                      name="height"
                      value={photo.height ?? ''}
                    />
                    <div className="space-y-2">
                      <Label htmlFor={`caption-${photo.id}`}>Caption</Label>
                      <Textarea
                        id={`caption-${photo.id}`}
                        name="caption"
                        defaultValue={photo.caption}
                        maxLength={240}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`alt-${photo.id}`}>Alt text</Label>
                      <Input
                        id={`alt-${photo.id}`}
                        name="altText"
                        defaultValue={photo.altText}
                        maxLength={200}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`collection-${photo.id}`}>
                        Side quest collection
                      </Label>
                      <Input
                        id={`collection-${photo.id}`}
                        name="collection"
                        defaultValue={photo.collection}
                        placeholder="Optional"
                        maxLength={40}
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label className="text-muted-foreground flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          name="isPublished"
                          defaultChecked={photo.isPublished}
                          className="accent-primary size-4"
                        />
                        Published
                      </label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="submit"
                          variant="outline"
                          size="sm"
                          disabled={isPending}
                        >
                          <Save />
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Delete photo"
                          title="Delete photo"
                          disabled={isPending}
                          onClick={() => deletePhoto(photo)}
                        >
                          <Trash2 className="text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2 border-t pt-3">
                      <Label htmlFor={`replace-${photo.id}`}>
                        Replace photo
                      </Label>
                      <Input
                        id={`replace-${photo.id}`}
                        name="file"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                      />
                    </div>
                  </form>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
