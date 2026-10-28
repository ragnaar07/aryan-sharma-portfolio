import { compileMDX } from 'next-mdx-remote/rsc';

import { BlogComponents } from '../src/components/blog/BlogComponents';
import { preprocessMdxContent } from '../src/lib/mdx-sanitize';
import {
  sharedMdxOptions,
  validateMdxCompilation,
} from '../src/lib/mdx-server';

const snippet = `
For example, a $2 \\times 2$ max-pooling ... from $4 \\times 4$ to $2 \\times 2$.
$$ X = \\begin{bmatrix} 1 & 3 & 2 & 4 \\\\ 5 & 6 & 1 & 2 \\\\ 7 & 2 & 8 & 3 \\\\ 4 & 1 & 5 & 9 \\end{bmatrix} $$
$$ P = \\begin{bmatrix} 6 & 4 \\\\ 7 & 9 \\end{bmatrix} $$
plus normal prose with words like ReLU, GELU, SiLU.
`.trim();

async function runRepro() {
  console.log('--- ORIGINAL SNIPPET ---');
  console.log(snippet);
  console.log('\n--- PREPROCESSED SNIPPET ---');
  const preprocessed = preprocessMdxContent(snippet);
  console.log(preprocessed);

  console.log('\n--- (A) VALIDATION PATH (validateMdxCompilation) ---');
  const valResult = await validateMdxCompilation(snippet);
  if (valResult.valid) {
    console.log('SUCCESS: Validation passed');
  } else {
    console.log(
      `ERROR: Line ${valResult.line}, Column ${valResult.column}: ${valResult.reason || valResult.error}`,
    );
    if (valResult.line) {
      const lines = preprocessed.split('\n');
      console.log(
        `Context line ${valResult.line}: ${lines[valResult.line - 1]}`,
      );
    }
  }

  console.log('\n--- (B) READER PATH (compileMDX in BlogContent.tsx) ---');
  try {
    await compileMDX({
      source: preprocessed,
      components: BlogComponents,
      options: {
        mdxOptions: sharedMdxOptions,
      },
    });
    console.log('SUCCESS: Reader compiled successfully');
  } catch (err: unknown) {
    const error = err as { message: string; line?: number; column?: number };
    console.log(`ERROR: ${error.message}`);
  }

  console.log(
    '\n--- (C) PREVIEW PATH (validation action used in PostForm.tsx) ---',
  );
  const previewCheck = await validateMdxCompilation(snippet);
  if (previewCheck.valid) {
    console.log('SUCCESS: Preview check passed');
  } else {
    console.log(
      `ERROR: Line ${previewCheck.line}, Column ${previewCheck.column}: ${previewCheck.reason || previewCheck.error}`,
    );
  }
}

runRepro();
