import { compile } from '@mdx-js/mdx';
import rehypeHighlight from '@shikijs/rehype';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import 'server-only';
import type { PluggableList } from 'unified';

import { preprocessMdxContent } from '@/lib/mdx-sanitize';

export { preprocessMdxContent } from '@/lib/mdx-sanitize';

export const sharedMdxOptions = {
  remarkPlugins: [remarkGfm, remarkMath] as PluggableList,
  rehypePlugins: [
    rehypeKatex,
    [
      rehypeHighlight,
      {
        theme: 'github-dark',
      },
    ],
  ] as PluggableList,
};

export interface MdxValidationResult {
  valid: boolean;
  error?: string;
  reason?: string;
  line?: number;
  column?: number;
}

/**
 * Validates MDX content compilation with the exact remark/rehype pipeline.
 * Runs pre-processing first, then compiles with @mdx-js/mdx to catch any unrecoverable errors.
 * Returns line and column information if syntax compilation fails.
 */
export async function validateMdxCompilation(
  content: string,
): Promise<MdxValidationResult> {
  const preprocessed = preprocessMdxContent(content);
  try {
    await compile(preprocessed, {
      remarkPlugins: sharedMdxOptions.remarkPlugins,
      rehypePlugins: sharedMdxOptions.rehypePlugins,
    });
    return { valid: true };
  } catch (error: unknown) {
    const err = error as {
      line?: number;
      column?: number;
      reason?: string;
      message?: string;
    };
    return {
      valid: false,
      error: err.message || 'Failed to compile MDX',
      reason:
        err.reason || err.message || 'Could not parse expression with acorn',
      line: typeof err.line === 'number' ? err.line : undefined,
      column: typeof err.column === 'number' ? err.column : undefined,
    };
  }
}
