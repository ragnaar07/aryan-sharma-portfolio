/**
 * Calculate reading time from raw Markdown / MDX content.
 * Standard assumption: 200 words per minute.
 */
export function calculateReadingTime(content: string): string {
  if (!content) {
    return '1 min read';
  }

  // Strip code blocks
  let clean = content.replace(/```[\s\S]*?```/g, '');
  // Strip inline code
  clean = clean.replace(/`[^`]*`/g, '');
  // Strip HTML tags
  clean = clean.replace(/<[^>]+>/g, '');
  // Strip Markdown links, images, headings, formatting
  clean = clean
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
    .replace(/[#*`_~>[\]()-]/g, ' ')
    .trim();

  const words = clean.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}
