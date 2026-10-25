---
name: publish-blog-post
description: >-
  Use this skill whenever creating, formatting, or publishing a technical blog post or article
  in src/data/blog/. It ensures compliance with the MDX parser, frontmatter schema, Shiki syntax
  highlighting, and SEO metadata.
---

# Publish Blog Post Runbook

The portfolio features an MDX-driven blog engine configured with Shiki syntax highlighting, reading from `src/data/blog/`.

Follow these steps to author and publish a new post:

## 1. Create MDX File

- Create the target file in `src/data/blog/<slug>.mdx`.
- The slug will become the URL path (`/blog/<slug>`). Use lowercase alphanumeric characters and hyphens.

## 2. Define Valid Frontmatter

The MDX parser in `src/lib/blog.ts` strictly validates frontmatter against `BlogFrontmatter`. Add the header:

```yaml
---
title: 'Article Title'
description: 'A compelling 1-2 sentence overview for the card preview and meta tags.'
date: 'YYYY-MM-DD'
tags: ['AI', 'Next.js', 'Python']
isPublished: true
image: '/blog/article-banner.png'
---
```

> [!IMPORTANT]
> If `isPublished` is set to `false`, the article will be hidden from the listing page (`/blog`) but accessible in development.

## 3. Article Content Guidelines

- **Structure**: Use standard Markdown headings (`##`, `###`).
- **Code Fences**: Use standard language identifiers (e.g., ` ```python `, ` ```typescript `, ` ```bash `) so that Shiki highlights syntax properly.
- **Images**: Store any accompanying illustrations in `public/blog/` and reference them via `/blog/<filename>`.
- **Tone**: Keep it technical, structured, and focused on practical implementation details.

## 4. Verification

1. Run local dev server (`npm run dev`) and visit `/blog/<slug>`.
2. Check:
   - Header title, date, reading time, and tags render correctly.
   - Code blocks copy button works.
   - Mobile and desktop responsiveness.
3. Run `npm run build` to verify static generation passes without MDX parsing errors.
