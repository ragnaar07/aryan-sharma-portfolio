import { compile } from '@mdx-js/mdx';
import fs from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { compileMdxPreview } from '../src/lib/mdx-preview-render';
import {
  preprocessMdxContent,
  sharedMdxOptions,
  validateMdxCompilation,
} from '../src/lib/mdx-server';

describe('MDX Math & Sanitization Pipeline', () => {
  // Helper to compile MDX and return generated JS string
  async function compileToString(rawContent: string): Promise<string> {
    const preprocessed = preprocessMdxContent(rawContent);
    const result = await compile(preprocessed, {
      ...sharedMdxOptions,
      outputFormat: 'function-body',
    });
    return String(result);
  }

  async function renderPreview(rawContent: string) {
    const result = await compileMdxPreview(rawContent);
    return {
      ...result,
      html:
        result.preview === undefined
          ? undefined
          : renderToStaticMarkup(result.preview),
    };
  }

  // Case a: inline math: $2 \times 2$ and $W_{ij}$
  it('case a: compiles inline math with $2 \\times 2$ and $W_{ij}$ rendering KaTeX', async () => {
    const input =
      'For example, $2 \\times 2$ pooling layer with weights $W_{ij}$.';
    const validation = await validateMdxCompilation(input);
    expect(validation.valid).toBe(true);

    const output = await compileToString(input);
    expect(output).toContain('katex');
    expect(output).toContain('W');
  });

  // Case b: one-line block with bmatrix (the exact two lines from the BUG section)
  it('case b: compiles one-line block with bmatrix into KaTeX', async () => {
    const input = [
      '$$ X = \\begin{bmatrix} 1 & 3 & 2 & 4 \\\\ 5 & 6 & 1 & 2 \\\\ 7 & 2 & 8 & 3 \\\\ 4 & 1 & 5 & 9 \\end{bmatrix} $$',
      '$$ P = \\begin{bmatrix} 6 & 4 \\\\ 7 & 9 \\end{bmatrix} $$',
    ].join('\n\n');

    const validation = await validateMdxCompilation(input);
    expect(validation.valid).toBe(true);

    const output = await compileToString(input);
    expect(output).toContain('katex');
    expect(output).not.toContain('bmatrix,'); // Acorn expression variable bug avoided
  });

  // Case c: multi-line $$ block with \frac{a}{b} and \sum_{i=1}^{n}
  it('case c: compiles multi-line $$ block with \\frac{a}{b} and \\sum_{i=1}^{n}', async () => {
    const input = `
$$
\\frac{a}{b} + \\sum_{i=1}^{n} x_i
$$
`.trim();

    const validation = await validateMdxCompilation(input);
    expect(validation.valid).toBe(true);

    const output = await compileToString(input);
    expect(output).toContain('katex');
    expect(output).toContain('katex-display');
  });

  // Case c1: bracket-style display math and parenthesized inline math are normalized and compiled
  it('case c1: compiles bracketed and parenthesized LaTeX forms', async () => {
    const input = [
      'Display: \\[ \\sum_{i=1}^{n} i = \\frac{n(n+1)}{2} \\ ]',
      'Inline: \\(E = mc^2\\) and $x^2 + y^2 = z^2$.',
    ].join('\n');

    const validation = await validateMdxCompilation(input);
    expect(validation.valid).toBe(true);

    const output = await compileToString(input);
    expect(output).toContain('katex');
    expect(output).toContain('sum');
    expect(output).toContain('mc');
  });

  // Case c2: bare LaTeX environments are wrapped into display math
  it('case c2: compiles bare LaTeX equation environments', async () => {
    const input = [
      '\\begin{equation}',
      'a^2 + b^2 = c^2',
      '\\end{equation}',
    ].join('\n');

    const validation = await validateMdxCompilation(input);
    expect(validation.valid).toBe(true);

    const output = await compileToString(input);
    expect(output).toContain('katex');
    expect(output).toContain('a^2');
  });

  it('preserves cases inside an existing display-math block without nested delimiters', async () => {
    const input = String.raw`$$
\delta[n] =
\begin{cases}
1, & n = 0 \\
0, & n \neq 0
\end{cases}
$$`;

    expect(preprocessMdxContent(input)).toBe(input);

    const preview = await renderPreview(input);
    expect(preview.valid).toBe(true);
    expect(preview.html).toContain('katex-display');
    expect(preview.html).not.toContain('katex-error');
  });

  it('preserves existing aligned, matrix, and bmatrix display math across multiple blocks', async () => {
    const input = String.raw`$$
\begin{aligned}
a &= b + c \\
d &= e + f
\end{aligned}
$$

$$
\begin{matrix}
1 & 2 \\
3 & 4
\end{matrix}
$$

$$
\begin{bmatrix}
5 & 6 \\
7 & 8
\end{bmatrix}
$$`;

    expect(preprocessMdxContent(input)).toBe(input);

    const validation = await validateMdxCompilation(input);
    expect(validation.valid).toBe(true);

    const output = await compileToString(input);
    expect(output).toContain('katex-display');
  });

  it('wraps a standalone bare cases environment exactly once', async () => {
    const input = String.raw`\begin{cases}
1, & n = 0 \\
0, & n \neq 0
\end{cases}`;
    const expected = `$$
${input}
$$`;

    expect(preprocessMdxContent(input).trim()).toBe(expected);

    const preview = await renderPreview(input);
    expect(preview.valid).toBe(true);
    expect(preview.html).toContain('katex-display');
    expect(preprocessMdxContent(preprocessMdxContent(input))).toBe(
      preprocessMdxContent(input),
    );
  });

  it('leaves LaTeX examples in fenced code and inline math unchanged', async () => {
    const inlineMath = String.raw`Inline math: $\text{cost \$5} + \alpha$ and $x^2$.`;
    const code = String.raw`~~~latex
\begin{cases}
1, & n = 0 \\
0, & n \neq 0
\end{cases}
~~~`;
    const input = `${inlineMath}\n\n${code}`;

    expect(preprocessMdxContent(input)).toBe(input);

    const validation = await validateMdxCompilation(input);
    expect(validation.valid).toBe(true);

    const preview = await renderPreview(
      `${String.raw`Inline math: $\alpha + x^2$.`}\n\n${code}`,
    );
    expect(preview.valid).toBe(true);
    expect(preview.html).toContain('katex');
    expect(preview.html).not.toContain('katex-error');
    expect(preview.html).toContain('class="shiki');
    expect(preview.html).toContain('\\begin');
  });

  // Case d: math with a < or > sign inside, e.g. $a < b$
  it('case d: compiles math with < or > signs inside intact', async () => {
    const input = 'Threshold test where $a < b$ and $\\alpha > \\beta$.';
    const validation = await validateMdxCompilation(input);
    expect(validation.valid).toBe(true);

    const output = await compileToString(input);
    expect(output).toContain('katex');
  });

  // Case e: prose with "P < 0.5", "{x, y}" and an HTML comment: compiles, text visible
  it('case e: safely compiles prose with "P < 0.5", "{x, y}" and HTML comment', async () => {
    const input =
      'We observe P < 0.5 with coordinates {x, y}. <!-- Background note -->';
    const validation = await validateMdxCompilation(input);
    expect(validation.valid).toBe(true);

    const output = await compileToString(input);
    expect(output).toContain('P < 0.5');
    expect(output).toContain('{x, y}');
    expect(output).toContain('Background note');
  });

  it('escapes less-than characters in plain prose without breaking comparisons', async () => {
    const input = 'Values x<y, x<=y, and P < 0.5 are all plain text.';
    const validation = await validateMdxCompilation(input);

    expect(validation.valid).toBe(true);
    expect(preprocessMdxContent(input)).toContain('x\\<y');
    expect(preprocessMdxContent(input)).toContain('x\\<=y');

    const output = await compileToString(input);
    expect(output).toContain('x<y');
    expect(output).toContain('x<=y');
    expect(output).toContain('P < 0.5');
  });

  it('preserves valid JSX attributes and child expressions', async () => {
    const input =
      'Use <Callout count={items.length}>{items[0]}</Callout> in a post.';
    const validation = await validateMdxCompilation(input);

    expect(validation.valid).toBe(true);
    expect(validation.preprocessedContent).toContain('count={items.length}');
    expect(validation.preprocessedContent).toContain('>{items[0]}');
  });

  it('reports an unclosed JSX expression instead of escaping it as prose', async () => {
    const validation = await validateMdxCompilation(
      '<Callout>{unfinished</Callout>',
    );

    expect(validation.valid).toBe(false);
    expect(validation.reason || validation.error).toBeDefined();
  });

  it('treats Markdown autolinks as prose instead of malformed JSX', async () => {
    const input = 'The URL <https://example.com> is shown literally.';
    const validation = await validateMdxCompilation(input);

    expect(validation.valid).toBe(true);
    expect(preprocessMdxContent(input)).toContain('\\<https://example.com>');
  });

  it('handles nested JSX, multiline expressions, regex braces, and template literals', async () => {
    const input = [
      '<section data-value={{ nested: { value: "}" } }}>',
      '  {(() => {',
      '    const matchesBrace = /[}]/.test("}");',
      '    const label = `value: ${matchesBrace ? "}" : "{"}`;',
      '    return <strong>{label}</strong>;',
      '  })()}',
      '</section>',
    ].join('\n');

    const validation = await validateMdxCompilation(input);
    expect(validation.valid).toBe(true);

    const preview = await renderPreview(input);
    expect(preview.valid).toBe(true);
    expect(preview.html).toContain('<section data-value=');
    expect(preview.html).toContain('<strong>value:');
  });

  it('keeps escaped delimiters and combined math, code, and JSX intact', async () => {
    const input = [
      String.raw`Escaped \{brace\}, \\{even slash brace}, and \$5.`,
      '<div data-total={2 + 2}>',
      'Math $x < y$ stays rendered.',
      '`{inline <code>}` stays literal.',
      '```ts',
      'const value = { total: 4, valid: x < y };',
      '```',
      '</div>',
    ].join('\n\n');

    const preprocessed = preprocessMdxContent(input);
    expect(preprocessMdxContent(preprocessed)).toBe(preprocessed);

    const preview = await renderPreview(input);
    expect(preview.valid).toBe(true);
    expect(preview.html).toContain('katex');
    expect(preview.html).toContain('data-total="4"');
    expect(preview.html).toContain('inline &lt;code&gt;');
    expect(preview.html).toContain('>const</span>');
    expect(preview.html).toContain(' value</span>');
  });

  it('returns a mapped source location for an invalid multiline JSX expression', async () => {
    const input = '<Callout>\n  {1 + }\n</Callout>';
    const preview = await renderPreview(input);

    expect(preview.valid).toBe(false);
    expect(preview.line).toBe(2);
    expect(preview.sourceExcerpt).toBe('{1 + }');
  });

  it('rejects JSX expressions that compile but fail when rendered', async () => {
    const preview = await compileMdxPreview(
      '<span>{missingPreviewVariable}</span>',
    );

    expect(preview.valid).toBe(true);
    expect(() => renderToStaticMarkup(preview.preview!)).toThrow(
      'missingPreviewVariable',
    );
  });

  // Case f: fenced code block containing { } and < : unchanged and compiles
  it('case f: fenced code block containing { } and < remains unchanged and compiles', async () => {
    const codeBlock = [
      '```typescript',
      'interface Config {',
      '  threshold: number;',
      '}',
      'if (x < 10) {',
      '  return { valid: true };',
      '}',
      '```',
    ].join('\n');

    const preprocessed = preprocessMdxContent(codeBlock);
    expect(preprocessed.trim()).toBe(codeBlock.trim());

    const validation = await validateMdxCompilation(codeBlock);
    expect(validation.valid).toBe(true);
  });

  // Case g: a dollar amount like "costs $5 and $10" does NOT start math
  it('case g: dollar amount like "costs $5 and $10" does not start math', async () => {
    const input = 'The monthly subscription costs $5 and $10 for pro tiers.';
    const validation = await validateMdxCompilation(input);
    expect(validation.valid).toBe(true);

    const output = await compileToString(input);
    expect(output).not.toContain('katex');
    expect(output).toContain('costs $5 and $10');
  });

  // Case h: a broken post (e.g. an unclosed <div>) returns a clear line/column error rather than crashing
  it('case h: broken post with unclosed <div> returns line/column error and source excerpt', async () => {
    const input = [
      '# Heading',
      'Some paragraph text',
      '<div>unclosed tag',
      'Following text',
    ].join('\n');

    const validation = await validateMdxCompilation(input);
    expect(validation.valid).toBe(false);
    expect(validation.line).toBe(3);
    expect(validation.sourceExcerpt).toBe('<div>unclosed tag');
    expect(validation.reason || validation.error).toBeDefined();
  });

  // Case i: idempotence: preprocess(preprocess(text)) === preprocess(text)
  it('case i: preprocessor is strictly idempotent', () => {
    const complexDocument = [
      '# Sample Document',
      'Intro with $2 \\times 2$ inline and $W_{ij}$.',
      '$$ X = \\begin{bmatrix} 1 & 2 \\\\ 3 & 4 \\end{bmatrix} $$',
      'Prices are $5 and $10.',
      'Comparison P < 0.5 and set {a, b}.',
      '<!-- HTML comment -->',
      '```ts',
      'const obj = { val: a < b };',
      '```',
      '$$',
      '\\frac{a}{b}',
      '$$',
    ].join('\n');

    const pass1 = preprocessMdxContent(complexDocument);
    const pass2 = preprocessMdxContent(pass1);
    expect(pass2).toBe(pass1);
  });

  // Fixture test: __tests__/fixtures/cnn-pooling.mdx end-to-end
  it('compiles __tests__/fixtures/cnn-pooling.mdx end-to-end', async () => {
    const fixturePath = path.join(__dirname, 'fixtures', 'cnn-pooling.mdx');
    const fixtureContent = fs.readFileSync(fixturePath, 'utf-8');

    const validation = await validateMdxCompilation(fixtureContent);
    expect(validation.valid).toBe(true);

    const output = await compileToString(fixtureContent);
    expect(output).toContain('katex');
    expect(output).toContain('CustomMaxPool2d');
  });
});
