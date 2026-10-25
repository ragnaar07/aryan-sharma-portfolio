---
name: verify-portfolio-build
description: >-
  Use this skill before committing code, opening pull requests, or deploying. It executes
  a comprehensive audit covering Prettier formatting, ESLint rules, Knip dead-code checks,
  TypeScript compilation, and Next.js production builds.
---

# Verify Portfolio Build Runbook

Execute this runbook to ensure the codebase remains clean, performant, and error-free before committing or deploying changes.

## 1. Code Formatting

Format all TypeScript, TSX, JSON, CSS, and Markdown files using Prettier:

```bash
npm run format:all
# Or if using Bun:
# bun run format:all
```

## 2. ESLint Static Analysis

Run ESLint to check for unused imports, React hook dependency issues, and Next.js guidelines:

```bash
npm run lint
```

If errors are encountered, fix them directly or run `npx eslint --fix`.

## 3. Dead Code & Unused Export Audit (Knip)

Check for unused components, orphaned dependencies, or forgotten utility functions:

```bash
npm run knip
```

Review the reported unused items. If a reported dependency is genuinely required by runtime dynamic imports or external configs, verify if it should be added to `knip.json`'s `ignoreDependencies`.

## 4. Production Build Test

Verify that Next.js static page generation and server-side routes compile without TypeScript or asset errors:

```bash
npm run build
```

## 5. Security & Secret Sanity Check

Before finalizing any git commit, run:

```bash
git status --porcelain
```

- Ensure `.env.local` is **NOT** staged.
- Ensure no API keys or local logs are staged.
- Confirm all new public images are located under `public/`.
