import { slugifyHeading } from '@/lib/blog-toc';
import Image from 'next/image';
import React from 'react';

import { CodeCopyButton } from './CodeCopyButton';

function getNodeText(node: React.ReactNode): string {
  if (typeof node === 'string') {
    return node;
  }
  if (typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(getNodeText).join('');
  }
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    return getNodeText(props.children);
  }
  return '';
}

export const BlogComponents = {
  // Override default image component
  img: ({
    src,
    alt,
    ...props
  }: {
    src?: string;
    alt?: string;
    [key: string]: unknown;
  }) => (
    <div className="border-border relative my-6 aspect-video w-full overflow-hidden rounded-xl border">
      <Image
        src={src || '/assets/me.png'}
        alt={alt || 'Blog illustration'}
        fill
        className="object-cover"
        {...props}
      />
    </div>
  ),

  // Custom heading with anchor links
  h1: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <h1
      className="text-foreground mt-8 mb-6 text-3xl font-bold tracking-tight lg:text-4xl"
      {...props}
    >
      {children}
    </h1>
  ),

  h2: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => {
    const text = getNodeText(children);
    const id = slugifyHeading(text);

    return (
      <h2
        id={id}
        className="group text-foreground mt-10 mb-4 flex scroll-mt-28 items-center text-2xl font-bold tracking-tight lg:text-3xl"
        {...props}
      >
        <a
          href={`#${id}`}
          className="hover:text-foreground inline-flex items-center gap-2 text-inherit no-underline"
        >
          <span>{children}</span>
          <span
            className="text-muted-foreground font-mono text-xl opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden="true"
          >
            #
          </span>
        </a>
      </h2>
    );
  },

  h3: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => {
    const text = getNodeText(children);
    const id = slugifyHeading(text);

    return (
      <h3
        id={id}
        className="group text-foreground mt-8 mb-3 flex scroll-mt-28 items-center text-xl font-semibold tracking-tight lg:text-2xl"
        {...props}
      >
        <a
          href={`#${id}`}
          className="hover:text-foreground inline-flex items-center gap-2 text-inherit no-underline"
        >
          <span>{children}</span>
          <span
            className="text-muted-foreground font-mono text-lg opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden="true"
          >
            #
          </span>
        </a>
      </h3>
    );
  },

  // Custom paragraph styling
  p: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <p className="text-foreground/90 mb-5 text-base leading-7" {...props}>
      {children}
    </p>
  ),

  // Custom list styling
  ul: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <ul className="text-foreground/90 mb-5 ml-6 list-disc space-y-2" {...props}>
      {children}
    </ul>
  ),

  ol: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <ol
      className="text-foreground/90 mb-5 ml-6 list-decimal space-y-2"
      {...props}
    >
      {children}
    </ol>
  ),

  li: ({
    children,
    className,
    ...props
  }: {
    children: React.ReactNode;
    className?: string;
    [key: string]: unknown;
  }) => {
    const isTask = className?.includes('task-list-item');
    return (
      <li
        className={`${
          isTask
            ? 'text-foreground/90 -ml-6 flex list-none items-start gap-2'
            : 'text-foreground/90 leading-7'
        } ${className || ''}`}
        {...props}
      >
        {children}
      </li>
    );
  },

  // GFM Task list checkbox
  input: (props: React.ComponentProps<'input'>) => {
    if (props.type === 'checkbox') {
      return (
        <input
          type="checkbox"
          className="border-border text-primary accent-primary mt-1 h-4 w-4 shrink-0 cursor-default rounded"
          disabled
          {...props}
        />
      );
    }
    return <input {...props} />;
  },

  // GFM Tables
  table: ({ children, ...props }: React.ComponentProps<'table'>) => (
    <div className="border-border my-6 w-full overflow-x-auto rounded-xl border">
      <table className="w-full border-collapse text-sm" {...props}>
        {children}
      </table>
    </div>
  ),

  thead: ({ children, ...props }: React.ComponentProps<'thead'>) => (
    <thead className="border-border bg-muted/60 border-b" {...props}>
      {children}
    </thead>
  ),

  tbody: ({ children, ...props }: React.ComponentProps<'tbody'>) => (
    <tbody className="divide-border bg-card divide-y" {...props}>
      {children}
    </tbody>
  ),

  tr: ({ children, ...props }: React.ComponentProps<'tr'>) => (
    <tr
      className="border-border hover:bg-muted/40 border-b transition-colors"
      {...props}
    >
      {children}
    </tr>
  ),

  th: ({ children, ...props }: React.ComponentProps<'th'>) => (
    <th
      className="text-foreground px-4 py-3 text-left font-semibold [&[align=center]]:text-center [&[align=right]]:text-right"
      {...props}
    >
      {children}
    </th>
  ),

  td: ({ children, ...props }: React.ComponentProps<'td'>) => (
    <td
      className="text-muted-foreground px-4 py-3 [&[align=center]]:text-center [&[align=right]]:text-right"
      {...props}
    >
      {children}
    </td>
  ),

  // Code block with copy button
  pre: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => {
    const codeText = getNodeText(children);

    return (
      <div className="group relative my-6">
        <pre
          className="bg-muted/40 border-border overflow-x-auto rounded-xl border p-4 font-mono text-sm [&>code]:bg-transparent [&>code]:p-0"
          {...props}
        >
          {children}
        </pre>
        <CodeCopyButton code={codeText} />
      </div>
    );
  },

  // Inline code styling
  code: ({
    children,
    className,
    ...props
  }: {
    children: React.ReactNode;
    className?: string;
    [key: string]: unknown;
  }) => {
    if (className?.includes('language-')) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }

    return (
      <code
        className="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-sm"
        {...props}
      >
        {children}
      </code>
    );
  },

  // Custom blockquote styling
  blockquote: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <blockquote
      className="border-primary text-muted-foreground bg-muted/20 my-6 rounded-r-lg border-l-4 py-2 pl-4 italic"
      {...props}
    >
      {children}
    </blockquote>
  ),

  // Links
  a: ({ href, children, ...props }: React.ComponentProps<'a'>) => {
    const isInternal = href?.startsWith('/') || href?.startsWith('#');
    return (
      <a
        href={href}
        className="text-primary underline underline-offset-4 transition-opacity hover:opacity-80"
        {...(!isInternal
          ? { target: '_blank', rel: 'noopener noreferrer' }
          : {})}
        {...props}
      >
        {children}
      </a>
    );
  },
};
