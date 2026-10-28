import { NextRequest, NextResponse } from 'next/server';

import { BLOG_VALIDATION, adminBlogLabels } from '@/config/BlogAdmin';
import { requireAdmin } from '@/lib/auth-guard';
import { saveCover } from '@/lib/redis-covers';

/**
 * Validates real image format via binary magic bytes.
 * Strictly permits: image/jpeg, image/png, image/webp, image/avif.
 * Strictly excludes: SVGs, HTML, scripts, and non-image payloads.
 */
function detectMimeFromMagicBytes(
  buffer: Buffer,
): 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif' | null {
  if (buffer.length < 12) {
    return null;
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WEBP: RIFF....WEBP (RIFF at 0-3, WEBP at 8-11)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  // AVIF: ....ftyp (4-7) followed by compatible brand at 8-11
  if (
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70
  ) {
    const brand = buffer.toString('ascii', 8, 12);
    if (brand === 'avif' || brand === 'avis' || brand === 'mif1') {
      return 'image/avif';
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  // First line: enforce admin authentication & authorization boundary
  try {
    await requireAdmin({ redirectOnFail: false });
  } catch (authError) {
    console.warn('[upload-cover] Unauthorized access attempt:', authError);
    return NextResponse.json(
      { error: adminBlogLabels.errors.unauthorized },
      { status: 401 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'No image file was provided in the upload request.' },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Enforce size limit (max 400 KB)
    if (buffer.length > BLOG_VALIDATION.coverImage.maxUploadSizeBytes) {
      return NextResponse.json(
        {
          error: adminBlogLabels.errors.coverImageTooLarge,
        },
        { status: 413 },
      );
    }

    // Enforce binary magic byte verification
    const detectedMime = detectMimeFromMagicBytes(buffer);
    if (!detectedMime) {
      return NextResponse.json(
        {
          error: adminBlogLabels.errors.coverImageMimeInvalid,
        },
        { status: 415 },
      );
    }

    // Save image bytes directly to Upstash Redis
    const coverId = await saveCover(buffer, detectedMime);
    const coverUrl = `/api/blog/cover/${coverId}`;

    return NextResponse.json({ url: coverUrl }, { status: 201 });
  } catch (error) {
    console.error('[upload-cover] Error processing cover image upload:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Internal server error while saving cover image.',
      },
      { status: 500 },
    );
  }
}
