---
name: publish-blog-post
description: >-
  Use this skill whenever creating, formatting, or publishing a technical blog post or article
  in src/data/blog/ or via the Admin CMS. It ensures compliance with the MDX parser, frontmatter
  schema, Shiki syntax highlighting, KaTeX math typesetting, and SEO metadata.
---

# Publish Blog Post Runbook

The portfolio features a hybrid technical blog engine combining Upstash Redis persistence (runtime database) with local version-controlled MDX files in `src/data/blog/`. When slugs collide, Redis records always take precedence.

Follow these steps to author and publish a new post:

---

## Method A: Admin CMS Dashboard (Recommended for Quick Publishing)

1. Sign in to `/admin/login` using your authorized GitHub account (`ADMIN_GITHUB_ID`).
2. Navigate to `/admin/posts/new`.
3. Fill in the article details:
   - **Title & Slug**: The slug is automatically normalized.
   - **Category**: Select from approved categories (`Engineering`, `AI/ML`, `Systems`, `Tutorials`, `Insights`).
   - **Cover Image**: Upload an image (automatically compressed client-side to WebP <300 KB and stored in Redis under `/api/blog/cover/<uuid>`) or provide an external HTTPS image URL.
   - **YouTube Embed**: (Optional) Provide a YouTube video URL or ID.
   - **Tags**: Comma-separated tags.
   - **Content**: Compose using Markdown/MDX with real-time live preview.
4. Toggle **Publish** (or leave as draft to save privately).
5. Click **Save Post**. Server Actions automatically revalidate `/blog` and `/blog/<slug>`.

---

## Method B: Version-Controlled Local MDX File

### 1. Create MDX File

- Create the target file in `src/data/blog/<slug>.mdx`.
- The slug will become the URL path (`/blog/<slug>`). Use lowercase alphanumeric characters and hyphens.

### 2. Define Valid Frontmatter

The file loader in `src/lib/blog-file-loader.ts` and parser in `src/lib/blog.ts` strictly validate frontmatter against `BlogFrontmatter`. Add the header:

```yaml
---
title: 'Article Title'
description: 'A compelling 1-2 sentence overview for the card preview and meta tags.'
date: 'YYYY-MM-DD'
tags: ['AI', 'C++', 'Systems']
category: 'Engineering'
coverImage: '/blog/article-banner.png'
youtubeId: ''
isPublished: true
---
```

> [!IMPORTANT]
> If `isPublished` is set to `false`, the article will be hidden from the public listing page (`/blog`) and sitemap, but viewable in development or by the admin.

### 3. Article Content Guidelines

- **Structure**: Use standard Markdown headings (`##`, `###`). Heading IDs are automatically generated for the dynamic Table of Contents.
- **Code Fences**: Use standard language identifiers (e.g., ` ```python `, ` ```cpp `, ` ```typescript `, ` ```bash `) so that Shiki highlights syntax with a copy button.
- **Math & Equations**: KaTeX is fully supported for inline math (`$E=mc^2$`) and block equations (`$$...$$`).
- **Static Assets**: Store local illustrations in `public/blog/` and reference them via `/blog/<filename>`.
- **Tone**: Technical, structured, and focused on practical implementation details.

---

## Verification Checklist

1. Run the local dev server (`npm run dev`) and visit `/blog/<slug>`.
2. Verify:
   - Header title, date, reading time, category, and tags render cleanly.
   - Table of contents links navigate to headings correctly.
   - Code blocks render syntax highlighting and copy button works.
   - KaTeX formulas render without syntax errors.
   - Mobile and desktop responsive layouts.
3. Run `npm run build` to verify Next.js static generation passes without MDX parsing errors.
