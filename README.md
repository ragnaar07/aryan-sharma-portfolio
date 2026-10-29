# Aryan Sharma Portfolio

Personal engineering portfolio and content management system for **Aryan Sharma**, focused on AI/ML engineering, systems software, Python/C++ development, Linux automation, GenAI/RAG architectures, and industrial software validation.

The platform includes showcase projects, career history, an interactive resume/CV viewer, a live GitHub activity tracker, a server-side Gemini AI assistant with local fallback retrieval, and a hybrid MDX/Redis technical blog with an authenticated admin CMS.

---

## Live Focus & Domains

- **AI/ML Engineering**: GenAI pipelines, RAG systems, predictive maintenance, model training, and signal processing.
- **Systems & Software Engineering**: Modern C++ (C++17/20), Python, FastAPI, Linux automation, and low-level systems.
- **Industrial Systems & Validation**: Railway signaling validation (Alstom Transport India Ltd.) and hydro-power plant automation (SJVN Ltd.).
- **Hardware & Physics**: Semiconductor devices, VLSI, solid-state physics, and STM32 embedded platforms.

---

## Core Capabilities & Features

### 1. Interactive Portfolio Showcase

- **Hero & Identity**: Professional positioning, headline, core skills, banner visuals, and quick contact actions.
- **Experience Timeline**: Career milestones at **Alstom Transport India Ltd.** and **SJVN Ltd.** with detailed role descriptions and engineering deliverables.
- **Projects Catalog**: CV/resume projects and public repositories (`ragnaar07`) with tech stack tags, live demos, and source code links.
- **GitHub Calendar**: Live public GitHub activity visualizer for `ragnaar07`.
- **Career Journey & Certifications**: Dedicated timeline at `/journey` and verified credential showcase at `/journey/certificates`.
- **Workstation & Setup**: Hardware, Linux tools, and development environment setup at `/setup` (and `/gears`).
- **Interactive Resume**: Online resume viewer and downloadable CV/Resume PDFs at `/resume`.
- **Direct Contact**: Contact form and email dispatch flow at `/contact`.

### 2. Hybrid Technical Blog Engine

- **Dual Persistence Architecture**: Combines database-backed posts in Upstash Redis with version-controlled local MDX files in `src/data/blog/`.
- **Deterministic Precedence**: If a database post and a file-based post share the same slug, the Redis version takes precedence.
- **MDX Reader**:
  - Syntax highlighting powered by **Shiki** with one-click code copy.
  - Mathematical equations rendered via **KaTeX** ($...$ and $$...$$).
  - Dynamic **Table of Contents (TOC)** with scroll-aware heading anchors.
  - Automatic word-count reading time calculation.
  - Responsive YouTube video embeds and custom interactive callouts.
  - Category and tag filtering.

### 3. Authenticated Admin CMS

- **Secure Management Dashboard**: Access `/admin` to create, edit, publish, draft, or delete technical articles and manage projects.
- **Live MDX Preview Editor**: Real-time side-by-side editing and preview at `/admin/posts/new` and `/admin/posts/[slug]/edit`.
- **Automated Image Pipeline**: Client-side image compressor downscales cover photos to WebP (<300 KB) before uploading to Upstash Redis (`/api/admin/upload-cover`).
- **Immutable CDN Delivery**: Covers are served from `/api/blog/cover/[id]` with `Cache-Control: public, max-age=31536000, immutable` and ETag 304 validation.
- **Auth.js v5 GitHub OAuth**: Dedicated login page at `/admin/login` restricted to a single administrator via numeric GitHub ID whitelist (`ADMIN_GITHUB_ID`).
- **Server Guard Enforcement**: Every administrative Server Action and page loader executes `requireAdmin()` on the server.

### 4. Grounded AI Portfolio Assistant

- **Gemini Route**: Chat route at `/api/chat` powered by Google Gemini with conversational multi-turn capability.
- **Deterministic Fallback Engine**: If the Gemini API is offline or unconfigured, `src/lib/chat-knowledge.ts` provides instant, deterministic answers using local knowledge extracted from `src/config/`.
- **Strict Content Sync**: Grounded directly on Aryan's verified projects, experience, skills, and background.

---

## Tech Stack

| Domain                | Technologies                                                               |
| --------------------- | -------------------------------------------------------------------------- |
| **Framework**         | Next.js 15 (App Router, Turbopack)                                         |
| **Frontend**          | React 19, TypeScript, Lucide Icons, Radix UI Primitives, Framer Motion     |
| **Styling**           | Tailwind CSS v4 (`@theme inline`), `next-themes` (Dark/Light mode support) |
| **Database & Cache**  | Upstash Redis (`@upstash/redis` REST API)                                  |
| **Authentication**    | Auth.js v5 (`next-auth@beta`, GitHub OAuth provider)                       |
| **MDX & Content**     | Next-MDX-Remote, Unified, Remark GFM, Remark Math, Rehype KaTeX, Shiki     |
| **Validation**        | Zod schemas (`src/lib/blog-validation.ts`)                                 |
| **AI Integration**    | Google Gemini API (server-side route) + custom knowledge matcher           |
| **Testing & Quality** | Vitest, ESLint 9 (Flat Config), Knip, Prettier, Husky, lint-staged         |

---

## Environment Variables

Create a local `.env.local` file in the project root:

```env
# Google Gemini API Key (Server-side assistant)
GEMINI_API_KEY="your-gemini-api-key"
NODE_ENV="development"

# Site URLs
NEXT_PUBLIC_SITE_URL="https://aryan-sharma-portfolio-eta.vercel.app"
NEXT_PUBLIC_URL="http://localhost:3000"

# Admin Authentication (Auth.js v5 / GitHub OAuth)
# Generate AUTH_SECRET with: npx auth secret (or openssl rand -base64 32)
AUTH_SECRET="your-auth-secret-min-32-chars"
AUTH_GITHUB_ID="your-github-oauth-client-id"
AUTH_GITHUB_SECRET="your-github-oauth-client-secret"
# Single Admin Whitelist: Numeric GitHub user ID (e.g. curl -s https://api.github.com/users/<username> | grep '"id":')
ADMIN_GITHUB_ID="your-numeric-github-user-id"

# Upstash Redis Database (REST API for Blog CMS)
UPSTASH_REDIS_REST_URL="https://your-upstash-redis-rest-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-redis-rest-token"
```

> [!IMPORTANT]
>
> - Never prefix server credentials (`GEMINI_API_KEY`, `AUTH_SECRET`, `UPSTASH_REDIS_REST_TOKEN`, etc.) with `NEXT_PUBLIC_`.
> - Never commit `.env.local` to version control.
> - If `GEMINI_API_KEY` is omitted, the chat assistant falls back automatically to local deterministic answers.

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Local Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production

```bash
npm run build
```

---

## Available Scripts

| Script       | Command              | Purpose                                                    |
| ------------ | -------------------- | ---------------------------------------------------------- |
| `dev`        | `npm run dev`        | Starts Next.js development server with Turbopack           |
| `build`      | `npm run build`      | Compiles production build and static pages                 |
| `start`      | `npm start`          | Starts the Next.js production server                       |
| `test`       | `npm test`           | Runs unit and integration tests with Vitest                |
| `lint`       | `npm run lint`       | Runs ESLint 9 static analysis                              |
| `typecheck`  | `npm run typecheck`  | Validates TypeScript types (`tsc --noEmit`)                |
| `knip`       | `npm run knip`       | Scans for unused files, exports, and orphaned dependencies |
| `format:all` | `npm run format:all` | Formats all code and markdown files via Prettier           |

---

## Content Architecture & Directory Map

All personal information and content are centralized in `src/config/`:

```text
src/
├── app/                        # Next.js App Router
│   ├── (public pages)          # /, /projects, /blog, /journey, /resume, /contact, /setup
│   ├── admin/                  # CMS dashboard, post editor, GitHub OAuth login
│   └── api/                    # /api/chat, /api/auth, /api/admin/upload-cover, /api/blog/cover
├── config/                     # SINGLE SOURCE OF TRUTH for portfolio content
│   ├── About.tsx               # Bio, summary, and education history
│   ├── BlogAdmin.ts            # Blog categories, validation limits, admin labels
│   ├── ChatPrompt.ts           # AI system instructions and suggested quick questions
│   ├── Contact.tsx             # Contact details and email address
│   ├── Experience.tsx          # Career history (Alstom, SJVN)
│   ├── Footer.tsx              # Footer labels and links
│   ├── Github.tsx              # GitHub profile username and calendar settings
│   ├── Hero.tsx                # Hero headline, intro copy, skills, and action buttons
│   ├── Meta.tsx                # Page titles, SEO descriptions, and Open Graph tags
│   ├── Navbar.tsx              # Navigation bar menu links and brand config
│   ├── Projects.tsx            # Project entries, descriptions, live links, and tech tags
│   └── Resume.ts               # Resume and CV document paths
├── data/
│   ├── blog/                   # Version-controlled local MDX articles
│   └── journey/                # Career milestone and certification data
├── lib/
│   ├── auth-guard.ts           # requireAdmin server-side authorization check
│   ├── blog.ts                 # Unified blog API merging Redis and local MDX files
│   ├── blog-file-loader.ts     # Local filesystem MDX article loader
│   ├── blog-reading-time.ts    # Word-count reading time calculator
│   ├── blog-toc.ts             # Heading anchor extractor and slugifier for TOC
│   ├── blog-validation.ts      # Zod schemas, slug normalization, URL validation
│   ├── chat-knowledge.ts       # AI prompt grounding and deterministic fallback engine
│   ├── redis-covers.ts         # Redis binary storage for post cover images
│   └── redis-posts.ts          # Redis CRUD operations for database-backed blog posts
├── components/
│   ├── admin/                  # CMS UI (PostForm with preview, DeletePostButton)
│   ├── blog/                   # MDX rendering, TOC, PostNavigation, BlogCard
│   ├── landing/                # Home sections (Hero, About, Projects, Experience, Contact)
│   ├── technologies/           # SVG icons for languages, frameworks, and developer tools
│   └── ui/                     # Radix/Shadcn UI component primitives
└── public/
    ├── assets/                 # Profile photos and avatar graphics
    ├── company/                # Employer company logos
    ├── project/                # Visual artwork for portfolio projects
    └── resume/                 # Downloadable PDF versions of Aryan's Resume and CV
```

---

## Deployment Guide

Recommended hosting platform: **Vercel** or any cloud platform supporting Next.js 15 App Router server routes.

### Production Deployment Steps:

1. Push repository code to GitHub (`main` branch).
2. Connect repository to Vercel.
3. Configure Environment Variables in the project settings:
   - `GEMINI_API_KEY`
   - `AUTH_SECRET`
   - `AUTH_GITHUB_ID`
   - `AUTH_GITHUB_SECRET`
   - `ADMIN_GITHUB_ID`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `NEXT_PUBLIC_SITE_URL`
4. Deploy.

---

## License

This repository contains **Aryan Sharma**'s personal portfolio, content, and design.
