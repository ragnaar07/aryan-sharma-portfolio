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

function findTagEnd(source: string, start: number): number {
  let quote = '';

  for (let i = start + 1; i < source.length; i++) {
    const char = source[i];

    if (quote) {
      if (char === '\\') {
        i++;
      } else if (char === quote) {
        quote = '';
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
    } else if (char === '{') {
      const expressionEnd = findExpressionEnd(source, i);
      if (expressionEnd === -1) return -1;
      i = expressionEnd;
    } else if (char === '>') {
      return i;
    }
  }

  return -1;
}

function findExpressionEnd(source: string, start: number): number {
  let depth = 0;
  let quote = '';
  let lineComment = false;
  let blockComment = false;
  let regexCharacterClass = false;
  let regexCanStart = true;
  let inTemplate = false;
  const templateFrames: { baseDepth: number; inExpression: boolean }[] = [];

  for (let i = start; i < source.length; i++) {
    const char = source[i];
    const next = source[i + 1];

    if (inTemplate) {
      if (char === '\\') {
        i++;
      } else if (char === '`') {
        templateFrames.pop();
        inTemplate = false;
      } else if (char === '$' && next === '{') {
        const frame = templateFrames.at(-1);
        if (frame) frame.inExpression = true;
        depth++;
        inTemplate = false;
        regexCanStart = true;
        i++;
      }
      continue;
    }

    if (lineComment) {
      if (char === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false;
        i++;
      }
      continue;
    }
    if (regexCharacterClass) {
      if (char === '\\') {
        i++;
      } else if (char === ']') {
        regexCharacterClass = false;
      }
      continue;
    }
    if (quote) {
      if (char === '\\') {
        i++;
      } else if (char === quote) {
        quote = '';
      }
      continue;
    }

    if (char === '/' && next === '/') {
      lineComment = true;
      i++;
    } else if (char === '/' && next === '*') {
      blockComment = true;
      i++;
    } else if (char === '/' && source[i - 1] === '<') {
      regexCanStart = false;
    } else if (char === '/' && regexCanStart) {
      let closed = false;
      for (i++; i < source.length; i++) {
        if (source[i] === '\\') {
          i++;
        } else if (source[i] === '[') {
          regexCharacterClass = true;
        } else if (source[i] === ']') {
          regexCharacterClass = false;
        } else if (source[i] === '/' && !regexCharacterClass) {
          closed = true;
          while (/[A-Za-z]/.test(source[i + 1] || '')) i++;
          break;
        }
      }
      if (!closed) return -1;
      regexCanStart = false;
    } else if (char === '"' || char === "'") {
      quote = char;
      regexCanStart = false;
    } else if (char === '`') {
      templateFrames.push({ baseDepth: depth, inExpression: false });
      inTemplate = true;
      regexCanStart = false;
    } else if (char === '{') {
      depth++;
      regexCanStart = true;
    } else if (char === '}') {
      depth--;
      const frame = templateFrames.at(-1);
      if (frame?.inExpression && frame.baseDepth === depth) {
        frame.inExpression = false;
        inTemplate = true;
        regexCanStart = false;
      } else if (depth === 0) {
        return i;
      } else {
        regexCanStart = false;
      }
    } else if (/\s/.test(char)) {
      continue;
    } else if (/[A-Za-z_$]/.test(char)) {
      const word = source.slice(i).match(/^[A-Za-z_$][\w$]*/)?.[0] || char;
      regexCanStart =
        /^(?:return|throw|case|delete|void|typeof|new|in|of|yield|await|else|do|instanceof|typeof)$/.test(
          word,
        );
      i += word.length - 1;
    } else if (/\d/.test(char)) {
      while (/[\w.]/.test(source[i + 1] || '')) i++;
      regexCanStart = false;
    } else if (char === ')' || char === ']') {
      regexCanStart = false;
    } else if (
      char === '(' ||
      char === '[' ||
      /[=,:;!?&|+\-*%^~<>]/.test(char)
    ) {
      regexCanStart = true;
    }
  }

  return -1;
}

function escapeMdxProse(source: string): string {
  let result = '';
  let precedingBackslashes = 0;

  for (const char of source) {
    if (
      (char === '<' || char === '{' || char === '}') &&
      precedingBackslashes % 2 === 0
    ) {
      result += '\\';
    }
    result += char;
    precedingBackslashes = char === '\\' ? precedingBackslashes + 1 : 0;
  }

  return result;
}

function protectJsx(
  source: string,
  tokens: string[],
  placeholder: (idx: number) => string,
): string {
  let result = '';
  let jsxDepth = 0;

  const protect = (value: string) => {
    const idx = tokens.length;
    tokens.push(value);
    return placeholder(idx);
  };

  for (let i = 0; i < source.length;) {
    if (source[i] === '<') {
      const tagPrefix = source
        .slice(i)
        .match(/^<(\/?)([A-Za-z_$][\w$.-]*)?(?=[\s/>])/);
      const isFragmentTag =
        source.startsWith('<>', i) || source.startsWith('</>', i);
      const hasTagName = Boolean(tagPrefix?.[2]) || isFragmentTag;
      const isClosingTag = tagPrefix?.[1] === '/';
      const hasTagBoundary =
        i === 0 || /[\s([{:;,]/.test(source[i - 1]) || isClosingTag;
      const end = tagPrefix && hasTagName ? findTagEnd(source, i) : -1;

      if (tagPrefix && hasTagName && hasTagBoundary && end !== -1) {
        const tag = source.slice(i, end + 1);
        const isClosing = isClosingTag;
        const name = tagPrefix[2] || '';
        const isSelfClosing = /\/\s*>$/.test(tag);
        const isVoidElement =
          /^(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i.test(
            name,
          );

        result += protect(tag);
        if (isClosing) {
          jsxDepth = Math.max(0, jsxDepth - 1);
        } else if (!isSelfClosing && !isVoidElement) {
          jsxDepth++;
        }
        i = end + 1;
        continue;
      }
      if (tagPrefix && hasTagName && hasTagBoundary) {
        result += source.slice(i);
        break;
      }
    }

    if (source[i] === '{' && jsxDepth > 0) {
      const end = findExpressionEnd(source, i);
      if (end !== -1) {
        result += protect(source.slice(i, end + 1));
        i = end + 1;
        continue;
      }
      result += source.slice(i);
      break;
    }

    result += source[i];
    i++;
  }

  return result;
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

  // 2. Protect JSX expressions before inline code and math so JavaScript template
  //    literals and delimiters inside expressions are not mistaken for Markdown.
  text = protectJsx(text, tokens, placeholder);

  // 3. Protect Inline Code (`...`) BEFORE math, so math delimiters inside code are not touched
  text = text.replace(/(`+[^`\n]+?`+)/g, (match) => {
    const idx = tokens.length;
    tokens.push(match);
    return placeholder(idx);
  });

  // 4. Normalize common LaTeX math syntaxes that CommonMark/remark-math do not parse
  //    and then protect the normalized forms before escaping prose.
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, math: string) => {
    return `\n$$\n${math.trim()}\n$$\n`;
  });

  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, math: string) => {
    return `$${math.trim()}$`;
  });

  // Protect existing math before normalizing bare environments so nested delimiters
  // are not introduced inside display math or existing inline expressions.
  text = text.replace(/(\$\$[\s\S]*?\$\$)/g, (match) => {
    const idx = tokens.length;
    tokens.push(match);
    return placeholder(idx);
  });

  text = text.replace(
    /(?<!\\)\$(?!\s|\$)((?:\\\$|[^$\n])+?)(?<![\s\\])\$(?!\d)/g,
    (match) => {
      const idx = tokens.length;
      tokens.push(match);
      return placeholder(idx);
    },
  );

  // Normalize only bare LaTeX environments; existing math, code, and JSX are protected.
  text = text.replace(
    /(^|[^$])\\begin\{([a-zA-Z*]+)\}([\s\S]*?)\\end\{\2\}/g,
    (_match, prefix: string, env: string, inner: string) => {
      return `${prefix}\n$$\n\\begin{${env}}${inner}\\end{${env}}\n$$\n`;
    },
  );

  // Protect newly normalized display math before escaping prose.
  text = text.replace(/(\$\$[\s\S]*?\$\$)/g, (match) => {
    const idx = tokens.length;
    tokens.push(match);
    return placeholder(idx);
  });

  // Protect any remaining inline math, including forms produced by \( ... \).
  text = text.replace(
    /(?<!\\)\$(?!\s|\$)((?:\\\$|[^$\n])+?)(?<![\s\\])\$(?!\d)/g,
    (match) => {
      const idx = tokens.length;
      tokens.push(match);
      return placeholder(idx);
    },
  );

  // 7. Convert HTML comments to MDX comments
  text = text.replace(/<!--([\s\S]*?)-->/g, '{/*$1*/}');

  // 8. Protect existing and newly converted MDX comments
  text = text.replace(/\{\/\*[\s\S]*?\*\/\}/g, (match) => {
    const idx = tokens.length;
    tokens.push(match);
    return placeholder(idx);
  });

  // 9. Escape currency and MDX syntax characters in prose.
  text = text.replace(
    /(?<!\\)(?:\\\\)*\$(?=\d)/g,
    (match) => `${match.slice(0, -1)}\\$`,
  );
  text = escapeMdxProse(text);

  // 12. Restore protected blocks in reverse order
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
