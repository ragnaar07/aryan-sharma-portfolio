import { NextRequest, NextResponse } from 'next/server';

import { BLOG_VALIDATION, adminBlogLabels } from '@/config/BlogAdmin';
import { requireAdmin } from '@/lib/auth-guard';
import { compileMdxPreviewHtml } from '@/lib/mdx-preview-render';

const MAX_PREVIEW_BYTES = BLOG_VALIDATION.content.maxCharacters * 4 + 1024;

export async function POST(request: NextRequest) {
  try {
    await requireAdmin({ redirectOnFail: false });
  } catch (authError) {
    console.warn('[blog-preview] Unauthorized access attempt:', authError);
    return NextResponse.json(
      { error: adminBlogLabels.errors.unauthorized },
      { status: 401 },
    );
  }

  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_PREVIEW_BYTES) {
    return NextResponse.json(
      { error: 'Article content is too large to preview.' },
      { status: 413 },
    );
  }

  const reader = request.body?.getReader();
  if (!reader) {
    return NextResponse.json(
      { error: 'No article content was provided.' },
      { status: 400 },
    );
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_PREVIEW_BYTES) {
        await reader.cancel();
        return NextResponse.json(
          { error: 'Article content is too large to preview.' },
          { status: 413 },
        );
      }
      chunks.push(value);
    }

    const bytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const content = new TextDecoder().decode(bytes);

    if (content.length > BLOG_VALIDATION.content.maxCharacters) {
      return NextResponse.json(
        {
          error: `Preview is limited to ${BLOG_VALIDATION.content.maxCharacters.toLocaleString()} characters.`,
        },
        { status: 413 },
      );
    }

    const result = await compileMdxPreviewHtml(content);
    if (!result.valid) {
      return NextResponse.json(
        {
          error: result.reason || result.error || 'Could not compile article.',
          line: result.line,
          column: result.column,
          sourceExcerpt: result.sourceExcerpt,
        },
        { status: 422 },
      );
    }

    return NextResponse.json({ html: result.html ?? '' });
  } catch (error: unknown) {
    console.error('[blog-preview] Failed to render article preview:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'The server failed to render this article preview.',
      },
      { status: 500 },
    );
  }
}
