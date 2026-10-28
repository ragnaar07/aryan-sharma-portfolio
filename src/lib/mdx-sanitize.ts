/**
 * Pre-processes Markdown / MDX content to safely neutralize common authoring errors
 * without altering fenced code blocks, inline code, or LaTeX math blocks.
 *
 * Rules:
 * 1. Protects code blocks (fenced ``` and ~~~), inline code (`...`), block math ($$...$$), and inline math ($...$).
 * 2. Converts HTML comments to standard MDX comments.
 * 3. Escapes stray "<" followed by a digit or space unless already escaped.
 * 4. Escapes bare "{" and "}" in normal prose unless already escaped.
 * 5. Restores all protected blocks in original form.
 */
export function preprocessMdxContent(content: string): string {
  if (!content || typeof content !== 'string') return '';

  const tokens: string[] = [];
  const placeholder = (idx: number) => `__MDX_PROTECTED_BLOCK_${idx}__`;

  // 1. Protect Fenced Code Blocks (``` or ~~~)
  let text = content.replace(
    /(^|\n)( *(`{3,}|~{3,})[^\n]*\n[\s\S]*?\n *\3 *(?:\n|$))/g,
    (match) => {
      const idx = tokens.length;
      tokens.push(match);
      return placeholder(idx);
    },
  );

  // 2. Protect Block Math ($$...$$)
  text = text.replace(/(\$\$[\s\S]*?\$\$)/g, (match) => {
    const idx = tokens.length;
    tokens.push(match);
    return placeholder(idx);
  });

  // 3. Protect Inline Code (`...`)
  text = text.replace(/(`+[^`\n]+?`+)/g, (match) => {
    const idx = tokens.length;
    tokens.push(match);
    return placeholder(idx);
  });

  // 4. Protect Inline Math ($...$)
  text = text.replace(
    /(?<!\\)\$(?!\$)((?:\\\$|[^$\n])+?)(?<!\\)\$/g,
    (match) => {
      const idx = tokens.length;
      tokens.push(match);
      return placeholder(idx);
    },
  );

  // 5. Convert HTML comments to MDX comments
  text = text.replace(/<!--([\s\S]*?)-->/g, '{/*$1*/}');

  // 6. Protect existing/new MDX comments
  text = text.replace(/\{\/\*[\s\S]*?\*\/\}/g, (match) => {
    const idx = tokens.length;
    tokens.push(match);
    return placeholder(idx);
  });

  // 7. Escape stray "<" followed by a digit or space (if not already escaped)
  text = text.replace(/(?<!\\)<(?=[\d\s])/g, '\\<');

  // 8. Escape bare "{" and "}" in normal prose (if not already escaped)
  text = text.replace(/(?<!\\)\{/g, '\\{');
  text = text.replace(/(?<!\\)\}/g, '\\}');

  // Restore protected blocks in reverse order
  for (let i = tokens.length - 1; i >= 0; i--) {
    text = text.replace(placeholder(i), () => tokens[i]);
  }

  return text;
}
