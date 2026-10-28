import { BLOG_VALIDATION, adminBlogLabels } from '@/config/BlogAdmin';

/**
 * Resizes cover images to 1200px and compresses them as WebP for upload.
 */
export async function compressCoverImage(file: File): Promise<Blob> {
  if (
    !(
      BLOG_VALIDATION.coverImage.allowedMimeTypes as readonly string[]
    ).includes(file.type)
  ) {
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

  const maxDimension = BLOG_VALIDATION.coverImage.maxDimension;
  let targetWidth = image.naturalWidth || image.width;
  let targetHeight = image.naturalHeight || image.height;

  if (targetWidth > maxDimension) {
    targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
    targetWidth = maxDimension;
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas 2D context unavailable.');
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight);

  let quality = 0.85;
  let blob: Blob | null = null;

  while (quality >= 0.4) {
    blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), 'image/webp', quality);
    });

    if (blob && blob.size <= BLOG_VALIDATION.coverImage.targetMaxSizeBytes) {
      break;
    }
    quality = Math.round((quality - 0.1) * 100) / 100;
  }

  if (!blob) {
    throw new Error('Image compression failed.');
  }

  return blob;
}
