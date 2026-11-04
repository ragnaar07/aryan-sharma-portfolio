import { describe, expect, it } from 'vitest';

import { extractHeadings } from '../src/lib/blog-toc';

describe('extractHeadings', () => {
  it('ignores heading-like lines inside fenced code blocks', () => {
    const content = [
      '## Visible heading',
      '',
      '```bash',
      '# shell comment',
      '## not a heading',
      '```',
      '',
      '~~~python',
      '# python comment',
      '### also not a heading',
      '~~~',
      '',
      '### Another visible heading',
    ].join('\n');

    expect(extractHeadings(content)).toEqual([
      { id: 'visible-heading', text: 'Visible heading', level: 2 },
      {
        id: 'another-visible-heading',
        text: 'Another visible heading',
        level: 3,
      },
    ]);
  });
});
