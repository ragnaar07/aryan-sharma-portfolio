# Aryan Sharma Portfolio - Agent Guidelines & Rules

This repository contains the personal portfolio of **Aryan Sharma**, focused on AI/ML engineering, software development, Python/C++ systems, Linux automation, and GenAI/RAG projects.

---

## 1. Project Architecture & Directories

- `src/config/`: **Single source of truth for all portfolio content.**
  - `Projects.tsx`: Showcase projects, links, tech stacks, and flags.
  - `Experience.tsx`: Career history (Alstom, SJVN, etc.).
  - `Hero.tsx`: Bio, headline, core skills, and social links.
  - `About.tsx`: Education, background, and summary.
  - `Resume.ts`: Resume & CV file references.
  - `ChatPrompt.ts`: Assistant system prompt and suggested quick questions.
  - `BlogAdmin.ts`: Blog categories, post limits, and admin UI labels.
- `src/lib/`:
  - `chat-knowledge.ts`: Knowledge retrieval and fallback query matching for the portfolio chat assistant.
  - `blog.ts`: Merge layer combining Redis and local file posts with conflict resolution and public/admin APIs.
  - `blog-file-loader.ts`: Fallback file loader for local MDX articles in `src/data/blog/`.
  - `redis-posts.ts`: Upstash Redis persistence layer for database-backed posts.
  - `redis-covers.ts`: Upstash Redis persistence layer for uploaded cover image buffers.
  - `blog-validation.ts`: Zod schema input validation, slug normalization, and YouTube URL extractor.
  - `blog-reading-time.ts`: Word-count-based reading time calculation.
  - `blog-toc.ts`: Heading anchor extractor and slugifier for table of contents.
  - `auth-guard.ts`: `requireAdmin` server-only session check and authorization gate.
- `src/app/`: Next.js 15 App Router pages, `/api/chat` route, dynamic `/sitemap.xml`, and `/robots.txt`.
  - `admin/`: Admin dashboard (`/admin`), creation editor (`/admin/posts/new`), and edit editor (`/admin/posts/[slug]/edit`).
  - `admin/actions.ts`: Authenticated Server Actions for saving and deleting posts with cache revalidation.
  - `admin/login/`: Dedicated admin GitHub OAuth sign-in page.
  - `api/admin/upload-cover/`: Authenticated admin multipart upload endpoint saving compressed cover images to Redis.
  - `api/blog/cover/[id]/`: Public high-performance image serving route with immutable CDN caching and ETag headers.
  - `api/auth/[...nextauth]/`: Auth.js v5 route handler.
  - `sitemap.ts`: Dynamic sitemap generator including published posts (Redis + file) and excluding drafts/admin.
  - `robots.ts`: Crawler rules with sitemap link and `/admin` disallow rules.
- `src/auth.ts`: Auth.js v5 configuration with single-admin GitHub numeric ID verification.
- `src/middleware.ts`: Edge convenience redirect from `/admin` to `/admin/login` for unauthenticated sessions.
- `src/components/`:
  - `admin/`: Admin UI components (`PostForm.tsx` with live MDX preview, `DeletePostButton.tsx`).
  - `blog/`: Reader components (`BlogCard.tsx`, `BlogContent.tsx`, `TableOfContents.tsx`, `PostNavigation.tsx`, `BlogComponents.tsx`).
  - `ui/`: Radix/Shadcn primitives, `landing/` section blocks, `technologies/` tech icons.
- `public/`: Static assets (`assets/` for photos, `project/` for illustrations, `company/` for logos, `resume/` for PDFs).

---

## 2. Core Operational Rules

### Rule 1: Content Centralization

- **NEVER** hardcode portfolio details, project titles, company names, or bio blurbs directly inside React components.
- Always add or edit data inside the relevant `src/config/*` file and import it into components.

### Rule 2: Mandatory AI Knowledge Sync

The portfolio features an AI assistant powered by Gemini with a deterministic fallback engine (`src/app/api/chat/route.ts`).

- Whenever a project, work experience, or skill is updated in `src/config/`:
  - You **MUST** update `src/lib/chat-knowledge.ts` to ensure keyword matching and fallback answers reflect the changes.
  - Update `src/config/ChatPrompt.ts` if quick-prompt recommendations or high-level context changes.

### Rule 3: Tailwind CSS v4 & Theming

- The project runs Tailwind CSS v4 (`@theme inline` in `src/app/globals.css`).
- Use design tokens (`var(--background)`, `var(--foreground)`, `var(--primary)`, etc.) rather than ad-hoc hex values.
- Retain seamless dark/light mode compatibility (`next-themes`).
- Ensure mobile responsiveness (`src/hooks/use-mobile.ts`).

### Rule 4: Secret & API Key Isolation

- Server-only credentials must **NEVER** be prefixed with `NEXT_PUBLIC_` or imported into client components (`'use client'`):
  - `GEMINI_API_KEY`: Server-side chat assistant API route (`src/app/api/chat/route.ts`).
  - `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `ADMIN_GITHUB_ID`: Auth.js session signing, OAuth, and admin whitelisting.
  - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis database access.
- Mark server modules containing credentials or database queries with `import 'server-only'`.
- Never commit `.env.local` or private tokens.

### Rule 5: Blog Storage & Content Compliance

- Blog posts can originate from version-controlled local files (`src/data/blog/<slug>.mdx`) or from Upstash Redis (runtime database).
- `BlogFrontmatter` (and normalized `Post`) is the shared contract across both sources (`title`, `description`, `date`, `tags`, `isPublished`, `category`, `coverImage`, `youtubeId`, `readingTime`, `updatedDate`).
- When slugs collide, Redis records always win over local file-based MDX.
- Public APIs (`getPublishedBlogPostsAsync`, `getBlogPostBySlug`) must return only published posts (`isPublished: true`). Drafts are strictly accessible through authenticated admin APIs (`getAllPostsForAdmin`, `getPostForAdminBySlug`).
- **Cover Image Constraints & Storage**:
  - Never write uploaded files to `public/` at runtime (read-only filesystem on Vercel serverless).
  - Image binary payloads are stored in Upstash Redis under separate keys (`blog:cover:<id>`) to keep post records and list endpoints lightweight.
  - Allowed image formats: JPEG, PNG, WebP, and AVIF only. SVGs and executable file formats are strictly disallowed to prevent XSS.
  - The server validates actual binary magic bytes, rejecting mismatches between file extension and true MIME type.
  - Size limits: 400 KB server maximum. The client compressor downscales images to a maximum width of 1200px and progressively reduces WebP quality until under ~300 KB before upload.
  - Public cover delivery is cached via `Cache-Control: public, max-age=31536000, immutable` and ETag 304 revalidation at `/api/blog/cover/[id]`, preserving the Upstash command quota.
  - Replaced or deleted post covers are automatically cleaned up from Redis via `deleteCover()`.

### Rule 6: Admin Security & Server Action Boundaries

- **Mandatory Server Guard**: Every admin page (`/admin/*`) and every Server Action (`src/app/admin/actions.ts`) **MUST** call `await requireAdmin()` as its first line of execution.
- **Middleware Is Not a Security Boundary**: Next.js edge middleware (`src/middleware.ts`) serves strictly as a convenience UX redirect; authorization security must be enforced on the server within Server Actions and page loaders.
- **Input Validation**: All form submissions and Server Action inputs must be validated with Zod schemas (`src/lib/blog-validation.ts`) before touching Upstash Redis.
- **Untrusted MDX Guard**: Never render MDX from arbitrary or untrusted user inputs; only render MDX authored by the authenticated admin or version-controlled in the repository.

---

## 3. Specialized Subagent Roles

When working on this repository, adopt or invoke the following specialized agent roles:

1. **`portfolio-curator`**:
   - Updates project lists, career entries, certifications, and skills.
   - Synchronizes `src/config/*` with `src/lib/chat-knowledge.ts`.
   - Manages static asset consistency in `public/project/` and `public/company/`.

2. **`ui-craftsman`**:
   - Builds and refines UI components using Tailwind v4, Radix primitives, and Framer Motion.
   - Ensures responsive layouts, accessibility, and theme styling across dark and light modes.

3. **`technical-writer`**:
   - Drafts technical articles in `src/data/blog/*.mdx` and journey milestones in `src/data/journey/`.
   - Formats code blocks for Shiki syntax highlighting and configures SEO metadata.

4. **`qa-guardian`**:
   - Runs `npm run lint` / `bun run lint` (ESLint 9).
   - Scans for dead code with `npm run knip`.
   - Runs `npm run format:all` (Prettier).
   - Validates Next.js production compilation (`npm run build`).
