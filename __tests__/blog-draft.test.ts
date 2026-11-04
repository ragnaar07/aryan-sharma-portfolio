import { describe, expect, it } from 'vitest';

import {
  createPostDraftSnapshot,
  parsePostDraftSnapshot,
} from '../src/lib/blog-draft';

const values = {
  title: 'Draft title',
  slug: 'draft-title',
  description: 'Unfinished summary',
  category: 'Engineering',
  coverImage: '',
  tags: 'mdx, editor',
  youtubeUrl: '',
  content: '# Draft\n\nUnfinished content',
  isPublished: false,
};

describe('local post draft snapshots', () => {
  it('round-trips an unsaved post form snapshot', () => {
    const snapshot = createPostDraftSnapshot(values, 1_000);

    expect(parsePostDraftSnapshot(JSON.stringify(snapshot), 2_000)).toEqual(
      snapshot,
    );
  });

  it('rejects malformed, unsupported, expired, and future snapshots', () => {
    const valid = createPostDraftSnapshot(values, 1_000);

    expect(parsePostDraftSnapshot('{')).toBeNull();
    expect(
      parsePostDraftSnapshot(JSON.stringify({ ...valid, version: 2 }), 2_000),
    ).toBeNull();
    expect(
      parsePostDraftSnapshot(JSON.stringify(valid), 31 * 24 * 60 * 60 * 1000),
    ).toBeNull();
    expect(
      parsePostDraftSnapshot(JSON.stringify(valid), 1_000 - 5 * 60 * 1000 - 1),
    ).toBeNull();
    expect(
      parsePostDraftSnapshot(
        JSON.stringify({
          ...valid,
          values: { ...values, isPublished: 'false' },
        }),
        2_000,
      ),
    ).toBeNull();
  });
});
