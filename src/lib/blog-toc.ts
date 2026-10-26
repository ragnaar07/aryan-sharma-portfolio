export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

/**
 * Slugify heading text into a valid HTML anchor ID.
 */
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Extract h2 and h3 headings from raw Markdown / MDX text.
 */
export function extractHeadings(content: string): TocHeading[] {
  if (!content) {
    return [];
  }

  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: TocHeading[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const hashes = match[1];
    const rawText = match[2].trim();

    // Strip markdown links, code tokens, bold, italic
    const cleanText = rawText
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .trim();

    const id = slugifyHeading(cleanText);
    if (id && cleanText) {
      headings.push({
        id,
        text: cleanText,
        level: hashes.length as 2 | 3,
      });
    }
  }

  return headings;
}
