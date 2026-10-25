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
- `src/lib/`:
  - `chat-knowledge.ts`: Knowledge retrieval and fallback query matching for the portfolio chat assistant.
  - `blog.ts`: MDX loader, slug resolution, and metadata parser for articles.
- `src/app/`: Next.js 15 App Router pages and `/api/chat` route.
- `src/components/`: Radix/Shadcn primitives in `ui/`, section blocks in `landing/`, tech icons in `technologies/`.
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

- `GEMINI_API_KEY` is strictly for server-side use in `src/app/api/chat/route.ts`.
- Never expose API keys in client-rendered components (`'use client'`).
- Never commit `.env.local` or private tokens.

### Rule 5: MDX Blog Content Compliance

- MDX blog posts must reside in `src/data/blog/<slug>.mdx`.
- Frontmatter must satisfy `BlogFrontmatter` (`title`, `description`, `date`, `tags`, `isPublished`).

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
