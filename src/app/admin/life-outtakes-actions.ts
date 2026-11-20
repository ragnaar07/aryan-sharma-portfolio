'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth-guard';
import {
  deleteLifeOuttake,
  getLifeOuttakeImageId,
  lifeOuttakeFormSchema,
  moveLifeOuttake,
  saveLifeOuttake,
} from '@/lib/life-outtakes';
import { deleteCover } from '@/lib/redis-covers';

async function removeUploadedImage(imageUrl: string) {
  const imageId = getLifeOuttakeImageId(imageUrl);
  if (!imageId) {
    return;
  }

  const deleted = await deleteCover(imageId);
  if (!deleted) {
    console.warn(
      `[life-outtakes-actions] Uploaded image ${imageId} could not be cleaned up.`,
    );
  }
}

export async function saveLifeOuttakeAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin({ redirectOnFail: false });

  const imageUrl = String(formData.get('imageUrl') || '');
  const isNewImage = formData.get('newImage') === 'true';
  const validation = lifeOuttakeFormSchema.safeParse({
    id: String(formData.get('id') || '') || undefined,
    imageUrl,
    width: String(formData.get('width') || ''),
    height: String(formData.get('height') || ''),
    caption: String(formData.get('caption') || ''),
    altText: String(formData.get('altText') || ''),
    collection: String(formData.get('collection') || ''),
    isPublished:
      formData.get('isPublished') === 'on' ||
      formData.get('isPublished') === 'true',
  });

  if (!validation.success) {
    if (isNewImage) {
      await removeUploadedImage(imageUrl);
    }
    return {
      success: false,
      error:
        validation.error.issues[0]?.message ??
        'Please check the photo details.',
    };
  }

  let previousImageUrl: string | undefined;
  try {
    ({ previousImageUrl } = await saveLifeOuttake(validation.data));
  } catch (error) {
    if (isNewImage) {
      await removeUploadedImage(imageUrl);
    }
    console.error('[life-outtakes-actions] Failed to save photo:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'An unknown error occurred while saving this photo.',
    };
  }

  if (previousImageUrl) {
    await removeUploadedImage(previousImageUrl);
  }
  revalidatePath('/');
  revalidatePath('/life-outtakes');
  revalidatePath('/admin/life-outtakes');
  return { success: true };
}

export async function deleteLifeOuttakeAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin({ redirectOnFail: false });

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    return { success: false, error: 'A valid photo ID is required.' };
  }

  try {
    const deleted = await deleteLifeOuttake(id);
    await removeUploadedImage(deleted.imageUrl);
    revalidatePath('/');
    revalidatePath('/life-outtakes');
    revalidatePath('/admin/life-outtakes');
    return { success: true };
  } catch (error) {
    console.error(
      `[life-outtakes-actions] Failed to delete photo ${id}:`,
      error,
    );
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'An unknown error occurred while deleting this photo.',
    };
  }
}

export async function moveLifeOuttakeAction(
  id: string,
  direction: 'up' | 'down',
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin({ redirectOnFail: false });

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      id,
    ) ||
    (direction !== 'up' && direction !== 'down')
  ) {
    return { success: false, error: 'The photo reorder request is invalid.' };
  }

  try {
    await moveLifeOuttake(id, direction);
    revalidatePath('/');
    revalidatePath('/life-outtakes');
    revalidatePath('/admin/life-outtakes');
    return { success: true };
  } catch (error) {
    console.error(
      `[life-outtakes-actions] Failed to reorder photo ${id}:`,
      error,
    );
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'An unknown error occurred while reordering photos.',
    };
  }
}
