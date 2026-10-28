/**
 * Pre-processes Markdown / MDX content to safely neutralize common authoring errors
 * without altering fenced code blocks, inline code, or LaTeX math blocks.
 *
 * Requirements:
 * 1. Fenced/inline code is never modified.
 * 2. Math ($...$, $$...$$ single- or multi-line) is passed to remark-math UNCHANGED:
 *    braces, backslashes, & and < inside math survive intact and render in KaTeX.
 * 3. Normalizes any one-line "$$ ... $$" standing alone on a line outside code fences into
 *    the standard multi-line form ($$ on its own line, content, $$ on its own line, with blank lines around).
 * 4. Normal prose outside code and math has stray {, }, < and HTML comments escaped.
 * 5. Standalone currency dollar amounts (e.g. "costs $5 and $10") do not trigger math parsing.
 * 6. Line map tracking to map preprocessed line numbers back to original source lines.
 * 7. Preprocessing is strictly idempotent: preprocess(preprocess(text)) === preprocess(text).
 */

export interface PreprocessResult {
  content: string;
  originalLines: string[];
  mapLineToOriginal: (preprocessedLine: number) => number;
}

export function preprocessMdxWithLineMap(rawContent: string): PreprocessResult {
  if (!rawContent || typeof rawContent !== 'string') {
    return {
      content: '',
      originalLines: [],
      mapLineToOriginal: () => 1,
    };
  }

  const originalLines = rawContent.split(/\r?\n/);
  const normalizedLines: string[] = [];
  const lineMap: number[] = []; // preprocessedLine (0-based) -> originalLine (1-based)

  let inFence = false;
  let fenceChar = '';
  let fenceLen = 0;

  for (let i = 0; i < originalLines.length; i++) {
    const origLineNumber = i + 1;
    const line = originalLines[i];

    if (!inFence) {
      const openMatch = line.match(/^[ ]{0,3}(`{3,}|~{3,})/);
      if (openMatch) {
        inFence = true;
        fenceChar = openMatch[1][0];
        fenceLen = openMatch[1].length;
        normalizedLines.push(line);
        lineMap.push(origLineNumber);
        continue;
      }

      // Check if line is a standalone single-line $$ ... $$
      const standaloneMatch = line.match(
        /^[ \t]*\$\$(?!\$)([^\n]+?)(?<!\$)\$\$[ \t]*$/,
      );
      if (standaloneMatch) {
        const mathContent = standaloneMatch[1].trim();

        // Ensure blank line before if previous line is not empty and not start
        if (
          normalizedLines.length > 0 &&
          normalizedLines[normalizedLines.length - 1].trim() !== ''
        ) {
          normalizedLines.push('');
          lineMap.push(origLineNumber);
        }

        normalizedLines.push('$$');
        lineMap.push(origLineNumber);

        normalizedLines.push(mathContent);
        lineMap.push(origLineNumber);

        normalizedLines.push('$$');
        lineMap.push(origLineNumber);

        // Ensure blank line after if next line exists and is not empty
        if (
          i + 1 < originalLines.length &&
          originalLines[i + 1].trim() !== ''
        ) {
          normalizedLines.push('');
          lineMap.push(origLineNumber);
        }

        continue;
      }

      normalizedLines.push(line);
      lineMap.push(origLineNumber);
    } else {
      // Inside code fence: look for matching closing fence
      const closeMatch = line.match(/^[ ]{0,3}(`{3,}|~{3,})[ ]*$/);
      if (
        closeMatch &&
        closeMatch[1][0] === fenceChar &&
        closeMatch[1].length >= fenceLen
      ) {
        inFence = false;
      }
      normalizedLines.push(line);
      lineMap.push(origLineNumber);
    }
  }

  let text = normalizedLines.join('\n');

  // Token replacement for protected sections
  const tokens: string[] = [];
  const placeholder = (idx: number) => `__MDX_PROTECTED_BLOCK_${idx}__`;

  // 1. Protect Fenced Code Blocks (``` or ~~~)
  text = text.replace(
    /(^|\n)( *(`{3,}|~{3,})[^\n]*\n[\s\S]*?\n *\3 *(?:\n|$))/g,
    (match) => {
      const idx = tokens.length;
      tokens.push(match);
      return placeholder(idx);
    },
  );

  // 2. Protect Inline Code (`...`) BEFORE math, so math delimiters inside code are not touched
  text = text.replace(/(`+[^`\n]+?`+)/g, (match) => {
    const idx = tokens.length;
    tokens.push(match);
    return placeholder(idx);
  });

  // 3. Protect Block Math ($$...$$)
  text = text.replace(/(\$\$[\s\S]*?\$\$)/g, (match) => {
    const idx = tokens.length;
    tokens.push(match);
    return placeholder(idx);
  });

  // 4. Protect Inline Math ($...$)
  // TeX rules: opening $ not preceded by \ and not followed by whitespace or $
  // closing $ not preceded by whitespace or \ and not followed by digit
  text = text.replace(
    /(?<!\\)\$(?!\s|\$)((?:\\\$|[^$\n])+?)(?<![\s\\])\$(?!\d)/g,
    (match) => {
      const idx = tokens.length;
      tokens.push(match);
      return placeholder(idx);
    },
  );

  // 5. Convert HTML comments to MDX comments
  text = text.replace(/<!--([\s\S]*?)-->/g, '{/*$1*/}');

  // 6. Protect existing and newly converted MDX comments
  text = text.replace(/\{\/\*[\s\S]*?\*\/\}/g, (match) => {
    const idx = tokens.length;
    tokens.push(match);
    return placeholder(idx);
  });

  // 7. Escape currency dollar signs in prose so remark-math does not mistake them for math
  text = text.replace(/(?<!\\)\$(?=\d)/g, '\\$');

  // 8. Escape stray "<" followed by a digit, space, "=" or end-of-line
  text = text.replace(/(?<!\\)<(?=[\d\s=]|$)/g, '\\<');

  // 9. Escape bare "{" and "}" in normal prose
  text = text.replace(/(?<!\\)\{/g, '\\{');
  text = text.replace(/(?<!\\)\}/g, '\\}');

  // 10. Restore protected blocks in reverse order
  for (let i = tokens.length - 1; i >= 0; i--) {
    text = text.replace(placeholder(i), () => tokens[i]);
  }

  return {
    content: text,
    originalLines,
    mapLineToOriginal: (preprocessedLine: number) => {
      if (preprocessedLine <= 0) return 1;
      const idx = preprocessedLine - 1;
      if (idx < lineMap.length) return lineMap[idx];
      return originalLines.length || 1;
    },
  };
}

/**
 * Pre-processes MDX content returning the sanitized string directly.
 * Idempotent: preprocessMdxContent(preprocessMdxContent(x)) === preprocessMdxContent(x).
 */
export function preprocessMdxContent(content: string): string {
  return preprocessMdxWithLineMap(content).content;
}
