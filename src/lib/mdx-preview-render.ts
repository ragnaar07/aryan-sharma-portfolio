import { evaluate } from '@mdx-js/mdx';
import { type ReactNode, createElement } from 'react';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';

import { BlogComponents } from '@/components/blog/BlogComponents';
import {
  preprocessMdxContent,
  sharedMdxOptions,
  validateMdxCompilation,
} from '@/lib/mdx-server';
import type { MdxValidationResult } from '@/lib/mdx-server';

export interface MdxPreviewResult extends Omit<
  MdxValidationResult,
  'preprocessedContent'
> {
  preview?: ReactNode;
}

export async function compileMdxPreview(
  content: string,
): Promise<MdxPreviewResult> {
  const validation = await validateMdxCompilation(content);
  if (!validation.valid) {
    return {
      valid: false,
      error: validation.error,
      reason: validation.reason,
      line: validation.line,
      column: validation.column,
      sourceExcerpt: validation.sourceExcerpt,
    };
  }

  try {
    const { default: MDXContent } = await evaluate(
      preprocessMdxContent(content),
      {
        remarkPlugins: sharedMdxOptions.remarkPlugins,
        rehypePlugins: sharedMdxOptions.rehypePlugins,
        Fragment,
        jsx,
        jsxs,
      },
    );
    const preview = createElement(MDXContent, {
      components: BlogComponents,
    });

    return {
      valid: true,
      preview,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      valid: false,
      error: message,
      reason: message || 'Failed to compile MDX preview',
    };
  }
}
