// Server MDX compilation and validation utilities
import { compile } from '@mdx-js/mdx';
import rehypeHighlight from '@shikijs/rehype';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import type { PluggableList } from 'unified';

import {
  preprocessMdxContent,
  preprocessMdxWithLineMap,
} from '@/lib/mdx-sanitize';

export {
  preprocessMdxContent,
  preprocessMdxWithLineMap,
  type PreprocessResult,
} from '@/lib/mdx-sanitize';

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
  sourceExcerpt?: string;
  preprocessedContent?: string;
}

/**
 * Prepares options and preprocessed source for compileMDX or @mdx-js/mdx.
 */
export function prepareMdxForCompilation(content: string) {
  const preprocessed = preprocessMdxContent(content);
  return {
    source: preprocessed,
    options: {
      mdxOptions: sharedMdxOptions,
    },
  };
}

/**
 * Validates MDX content compilation with the exact remark/rehype pipeline.
 * Runs pre-processing first with line-mapping, then compiles with @mdx-js/mdx to catch any syntax errors.
 * Maps any preprocessed error line numbers back to original source lines and extracts the offending source excerpt.
 */
export async function validateMdxCompilation(
  content: string,
): Promise<MdxValidationResult> {
  const pre = preprocessMdxWithLineMap(content);
  try {
    await compile(pre.content, {
      remarkPlugins: sharedMdxOptions.remarkPlugins,
      rehypePlugins: sharedMdxOptions.rehypePlugins,
    });
    return { valid: true, preprocessedContent: pre.content };
  } catch (error: unknown) {
    const err = error as {
      line?: number;
      column?: number;
      reason?: string;
      message?: string;
      place?: { line?: number; column?: number };
    };

    let pLine = err.line;
    let pCol = err.column;

    if (typeof err.message === 'string') {
      const match = err.message.match(/\((\d+):(\d+)(?:-\d+:\d+)?\)/);
      if (match) {
        pLine = parseInt(match[1], 10);
        pCol = parseInt(match[2], 10);
      }
    }
    if (!pLine && err.place?.line) {
      pLine = err.place.line;
      pCol = err.place.column;
    }

    const origLine = pLine ? pre.mapLineToOriginal(pLine) : undefined;
    const sourceExcerpt = origLine
      ? pre.originalLines[origLine - 1]?.trim()
      : undefined;

    return {
      valid: false,
      error: err.message || 'Failed to compile MDX',
      reason:
        err.reason || err.message || 'Could not parse expression with acorn',
      line: origLine,
      column: typeof pCol === 'number' ? pCol : undefined,
      sourceExcerpt,
      preprocessedContent: pre.content,
    };
  }
}
