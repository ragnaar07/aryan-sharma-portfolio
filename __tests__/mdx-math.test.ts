import { compile } from '@mdx-js/mdx';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

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
