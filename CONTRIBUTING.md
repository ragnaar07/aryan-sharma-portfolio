# Maintaining Aryan Sharma's Portfolio

This repository contains Aryan Sharma's personal engineering portfolio, blog CMS, and AI assistant. Any modifications must maintain high performance, strict typing, responsive design, and professional alignment with Aryan's AI/ML, systems engineering, and low-level software focus.

---

## 1. Engineering Standards & Core Rules

### Rule 1: Content Centralization

- **NEVER** hardcode portfolio details, project descriptions, skills, or career achievements directly inside UI components.
- Always add or modify data inside the appropriate file in `src/config/` (`About.tsx`, `Projects.tsx`, `Experience.tsx`, `Hero.tsx`, `Resume.ts`, `ChatPrompt.ts`, `Meta.tsx`).

### Rule 2: Mandatory AI Knowledge Sync

- Whenever a project, work experience item, skill, or bio entry in `src/config/` is updated, you **MUST** synchronize:
  1. `src/lib/chat-knowledge.ts`: Ensure regex keywords, intent detectors, and deterministic fallback answers reflect the changes.
  2. `src/config/ChatPrompt.ts`: Update sample prompts and system instructions if high-level context changes.

### Rule 3: Tailwind CSS v4 & Theming

- The project runs Tailwind CSS v4 with `@theme inline` in `src/app/globals.css`.
- Use CSS design tokens (`var(--background)`, `var(--foreground)`, `var(--primary)`, etc.) rather than ad-hoc hex values.
- Maintain dark and light mode visual fidelity using `next-themes`.
- Ensure mobile responsiveness across all viewport sizes (`src/hooks/use-mobile.ts`).

### Rule 4: Secret & API Key Isolation

- Server-only credentials must **NEVER** be prefixed with `NEXT_PUBLIC_` or imported into client components (`'use client'`):
  - `GEMINI_API_KEY`: Server-side chat assistant API route (`src/app/api/chat/route.ts`).
  - `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `ADMIN_GITHUB_ID`: Auth.js session signing and single-admin authorization.
  - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis database access.
- Mark server modules containing credentials or database queries with `import 'server-only'`.
- Never commit `.env.local` or private access tokens.

### Rule 5: Blog Storage & Content Compliance

- Articles can originate from version-controlled local files (`src/data/blog/<slug>.mdx`) or from Upstash Redis (runtime database).
- `BlogFrontmatter` (and normalized `Post`) is the shared contract across both sources (`title`, `description`, `date`, `tags`, `isPublished`, `category`, `coverImage`, `youtubeId`, `readingTime`, `updatedDate`).
- When slugs collide, Redis records always win over local file-based MDX.
- Public APIs (`getPublishedBlogPostsAsync`, `getBlogPostBySlug`) must return only published posts (`isPublished: true`). Drafts are strictly accessible through authenticated admin APIs (`getAllPostsForAdmin`, `getPostForAdminBySlug`).
- **Cover Image Constraints**:
  - Never write uploaded files to `public/` at runtime (read-only filesystem on Vercel serverless).
  - Image binary payloads are stored in Upstash Redis under separate keys (`blog:cover:<id>`) to keep post records lightweight.
  - Allowed formats: JPEG, PNG, WebP, and AVIF only.
  - Max upload size is 400 KB server-side; client downscales to WebP (<300 KB).

### Rule 6: Admin Security & Server Action Boundaries

- **Mandatory Server Guard**: Every admin page (`/admin/*`) and every Server Action (`src/app/admin/actions.ts`) **MUST** call `await requireAdmin()` as its first line of execution.
- **Middleware Is Not a Security Boundary**: Next.js edge middleware (`src/middleware.ts`) serves strictly as a convenience UX redirect; authorization security must be enforced on the server within Server Actions and page loaders.
- **Input Validation**: All form submissions and Server Action inputs must be validated with Zod schemas (`src/lib/blog-validation.ts`) before touching Upstash Redis.

---

## 2. Project Directory Structure

```text
aryan-sharma-portfolio/
├── .agents/           # Antigravity CLI skills, teamwork artifacts, and hooks
├── __tests__/         # Vitest unit and integration test suites
├── public/
│   ├── assets/        # Profile photos and avatar graphics
│   ├── company/       # Alstom, SJVN, and other company logos
│   ├── project/       # Project artwork
│   └── resume/        # Downloadable Resume and CV PDFs
├── src/
│   ├── app/           # Next.js App Router (pages, layouts, and API routes)
│   ├── components/    # React components (admin, blog, landing, ui, technologies)
│   ├── config/        # Centralized portfolio content and configuration
│   ├── data/          # MDX blog posts and journey milestones
│   ├── hooks/         # Custom React hooks (e.g. use-mobile, use-haptic-feedback)
│   ├── lib/           # Backend services, Upstash Redis, Auth guards, utilities
│   └── types/         # TypeScript type definitions and interfaces
```

---

## 3. Adding New Content

### Adding a Project

1. Add SVG/WebP visual asset to `public/project/`.
2. Ensure technology icons exist in `src/components/technologies/`.
3. Register the project entry in `src/config/Projects.tsx`.
4. Update `src/lib/chat-knowledge.ts` to ground the AI assistant on the new project.
5. Verify build passes with `npm run build`.

### Publishing a Blog Post

- **Local File Method**: Create `src/data/blog/<slug>.mdx` with valid frontmatter (`title`, `description`, `date`, `tags`, `category`, `isPublished`, `coverImage`).
- **Admin CMS Method**: Sign in at `/admin/login` using your authorized GitHub account, navigate to `/admin/posts/new`, compose your article with live MDX preview, upload a cover image, and save/publish directly to Redis.

---

## 4. Pre-Commit Verification Checklist

Before opening a pull request or committing changes, run the complete verification suite:

```bash
# 1. Format code and docs
npm run format:all

# 2. Run ESLint static analysis
npm run lint

# 3. Check for unused exports and dead dependencies
npm run knip

# 4. Verify TypeScript compilation
npm run typecheck

# 5. Run automated tests
npm test

# 6. Test production build
npm run build

# 7. Check git status to ensure no secrets or .env.local are staged
git status --porcelain
```

---

## 5. Git Commit Conventions

Use concise, imperative commit messages:

```text
feat(blog): add syntax highlighting for C++ snippets
fix(chat): refine intent matching for predictive maintenance
chore(deps): update next-auth to latest beta
docs(readme): refresh architecture and environment documentation
```
