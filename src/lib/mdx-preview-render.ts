import { evaluate } from '@mdx-js/mdx';
import type { Handlers } from 'mdast-util-to-hast';
import { type ReactNode, createElement } from 'react';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import rehypeStringify from 'rehype-stringify';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

import { BlogComponents } from '@/components/blog/BlogComponents';
import {
  preprocessMdxContent,
  sharedMdxOptions,
  validateMdxCompilation,
} from '@/lib/mdx-server';
import type { MdxValidationResult } from '@/lib/mdx-server';

const safeMdxTags = new Set([
  'a',
  'blockquote',
  'br',
  'code',
  'del',
  'details',
  'div',
  'em',
  'figcaption',
  'figure',
  'h1',
  'h2',
  'h3',
  'h4',
  'hr',
  'img',
  'li',
  'ol',
  'p',
  'pre',
  'section',
  'span',
  'strong',
  'summary',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'ul',
]);

const safeMdxAttributes = new Set([
  'alt',
  'align',
  'className',
  'colSpan',
  'height',
  'href',
  'id',
  'rowSpan',
  'src',
  'title',
  'width',
]);

function isSafeMdxUrl(value: string): boolean {
  return !/^\s*(?:javascript|data|vbscript):/i.test(value);
}

const staticHtmlMdxHandlers: Handlers = {
  mdxJsxFlowElement(state, node) {
    const element = node as {
      name: string | null;
      attributes: Array<{
        type: string;
        name?: string;
        value?: string | boolean | null | { type: string };
      }>;
    };
    if (!element.name) return state.all(node);

    const tagName = safeMdxTags.has(element.name.toLowerCase())
      ? element.name.toLowerCase()
      : 'div';
    const properties: Record<string, string> = {};

    for (const attribute of element.attributes) {
      if (
        attribute.type !== 'mdxJsxAttribute' ||
        !attribute.name ||
        !safeMdxAttributes.has(attribute.name) ||
        typeof attribute.value !== 'string'
      ) {
        continue;
      }

      if (
        (attribute.name === 'href' || attribute.name === 'src') &&
        !isSafeMdxUrl(attribute.value)
      ) {
        continue;
      }

      properties[attribute.name] = attribute.value;
    }

    return {
      type: 'element',
      tagName,
      properties,
      children: state.all(node),
    };
  },
  mdxJsxTextElement(state, node) {
    return staticHtmlMdxHandlers.mdxJsxFlowElement?.(state, node, undefined);
  },
  mdxFlowExpression: (_state, node) => ({
    type: 'text',
    value: `{${(node as { value: string }).value}}`,
  }),
  mdxTextExpression: (_state, node) => ({
    type: 'text',
    value: `{${(node as { value: string }).value}}`,
  }),
  mdxjsEsm: () => undefined,
};

export interface MdxPreviewResult extends Omit<
  MdxValidationResult,
  'preprocessedContent'
> {
  preview?: ReactNode;
}

export interface MdxPreviewHtmlResult extends Omit<
  MdxPreviewResult,
  'preview'
> {
  html?: string;
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

export async function compileMdxPreviewHtml(
  content: string,
): Promise<MdxPreviewHtmlResult> {
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
    const processor = unified()
      .use(remarkParse)
      .use(remarkMdx)
      .use(sharedMdxOptions.remarkPlugins)
      .use(remarkRehype, { handlers: staticHtmlMdxHandlers })
      .use(sharedMdxOptions.rehypePlugins)
      .use(rehypeStringify);
    const html = await processor.process(preprocessMdxContent(content));

    return {
      valid: true,
      html: String(html),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      valid: false,
      error: message,
      reason: message || 'Failed to render compiled MDX preview',
    };
  }
}
