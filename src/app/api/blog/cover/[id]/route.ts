import { NextRequest, NextResponse } from 'next/server';

import { getCover } from '@/lib/redis-covers';

interface CoverRouteProps {
  params: Promise<{
    id: string;
  }>;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest, { params }: CoverRouteProps) {
  const { id } = await params;
  const cleanId = id?.trim().toLowerCase();

  if (!cleanId || !UUID_REGEX.test(cleanId)) {
    return new NextResponse('Invalid cover ID format', { status: 404 });
  }

  try {
    const cover = await getCover(cleanId);
    if (!cover) {
      return new NextResponse('Cover image not found', {
        status: 404,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    }

    const etag = `W/"${cleanId}-${cover.buffer.length}"`;
    const clientEtag = request.headers.get('if-none-match');

    if (clientEtag && clientEtag === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // Convert Buffer to Uint8Array for NextResponse body
    return new NextResponse(new Uint8Array(cover.buffer), {
      status: 200,
      headers: {
        'Content-Type': cover.mime,
        'Content-Length': cover.buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        ETag: etag,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error(`[cover-serve] Error serving cover image ${cleanId}:`, error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
