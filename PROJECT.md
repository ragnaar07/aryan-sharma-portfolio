# Project: Aryan Sharma Portfolio Audit & Hardening

## Architecture

Next.js 15 App Router portfolio with Tailwind CSS v4, Upstash Redis blog storage, MDX local fallback, Auth.js GitHub authentication, and Gemini-powered chat assistant.

Key directories:

- `src/config/`: Single source of truth for portfolio data (Hero, Projects, Experience, About, etc.)
- `src/lib/`: Backend business logic, chat knowledge, Upstash Redis persistence, auth guards, blog loader
- `src/app/`: Next.js App Router (layout, admin, blog, journey, api/chat, api/auth)
- `src/components/`: UI components (admin, blog, landing, ui, technologies)
- `public/`: Static assets (assets, blog, project, company)

## Feature Inventory

| #   | Feature / Issue                      | Description                                                                                                    | Milestone | Source  |
| --- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------- | --------- | ------- |
| 1   | R1.1 Gemini Route Logic              | Invert Gemini chat route logic in `src/app/api/chat/route.ts` to call Gemini API first                         | M2        | Request |
| 2   | R1.2 Gemini Model Endpoint           | Use valid Gemini model identifier (e.g. `gemini-1.5-flash` or `gemini-2.0-flash`)                              | M2        | Request |
| 3   | R1.3 Unsplash RemotePattern          | Add `images.unsplash.com` to `remotePatterns` in `next.config.ts`                                              | M1        | Request |
| 4   | R1.4 Redis Date Parsing              | Safely handle invalid dates in `src/lib/redis-posts.ts` without throwing RangeError                            | M2        | Request |
| 5   | R1.5 Missing Asset /assets/me.png    | Resolve missing fallback asset `/assets/me.png` referenced in blog components                                  | M3        | Request |
| 6   | R1.6 Nested Form in Admin Preview    | Eliminate illegal nested `<form>` in `PostForm.tsx` preview caused by `CodeCopyButton`                         | M3        | Request |
| 7   | R1.7 Hero CTA DOM Nesting            | Fix invalid `<button><a>` DOM nesting in `Hero.tsx` using `asChild`                                            | M3        | Request |
| 8   | R2.1 Standardize on npm              | Standardize on npm for package management and script execution                                                 | M1        | Request |
| 9   | R2.2 Unify Prettier Config           | Eliminate conflicting dual configs (`.prettierrc` and `.prettierrc.json`)                                      | M1        | Request |
| 10  | R2.3 Clean .env.example              | Remove stray commands, add missing `UPSTASH_REDIS_REST_URL` and `_TOKEN`                                       | M1        | Request |
| 11  | R2.4 Fix TypeScript Errors           | Resolve TS compilation errors in `actions.ts`, `expandable-chat.tsx`, `certificates/page.tsx`, `tsconfig.json` | M1        | Request |
| 12  | R2.5 Corrupt Blog Image              | Fix 1-byte corrupt image placeholder `public/blog/quantum-tunneling-zener-diode.png`                           | M1        | Request |
| 13  | R3.1 OnekoCat Script Path            | Fix `OnekoCat.tsx` script path to use absolute path for subroutes                                              | M3        | Request |
| 14  | R3.2 ThemeSwitch resolvedTheme       | Inspect `resolvedTheme` in `ThemeSwitch.tsx` and remove debug logs                                             | M3        | Request |
| 15  | R3.3 Github Calendar Theme           | Use `resolvedTheme` in `Github.tsx` calendar theme evaluation                                                  | M3        | Request |
| 16  | R3.4 Mount Toaster in Root Layout    | Mount `<Toaster />` in `src/app/layout.tsx` so contact form toasts appear                                      | M3        | Request |
| 17  | R3.5 Setup Page Copy                 | Implement working clipboard copy functionality in `src/app/setup/page.tsx`                                     | M3        | Request |
| 18  | R3.6 TooltipTrigger asChild          | Add `asChild` to `<TooltipTrigger>` wrapping `<Link>` in `ProjectCard.tsx`                                     | M3        | Request |
| 19  | R3.7 Guard Admin Layout Widgets      | Prevent public widgets (Navbar, OnekoCat, Quote, Footer, ChatBubble) on `/admin`                               | M3        | Request |
| 20  | R3.8 Eliminate Undefined CSS Classes | Clean undefined classes in `Container.tsx`, `ProjectList.tsx`, `CertificatesGallery.tsx`                       | M3        | Request |
| 21  | R3.9 Fix Tailwind Classes in Quote   | Replace phantom utility classes in `Quote.tsx` with valid Tailwind v4 theme tokens                             | M3        | Request |
| 22  | R3.10 Fix AudioContext Leak          | Ensure AudioContext instances are closed or reused in `use-haptic-feedback.ts`                                 | M3        | Request |
| 23  | R3.11 Accessibility Deficiencies     | Fix `Hero.tsx` aria-label, `resume/page.tsx` title, `Skill.tsx` rel                                            | M3        | Request |
| 24  | R3.12 Remove Dead Components         | Remove `GearCard.tsx`, `BackToTop.tsx`, `sidebar.tsx`, outdated `ProjectComponents.tsx`                        | M3        | Request |
| 25  | R3.13 Centralize Contact Email       | Import contact email from `src/config/` in `ContactForm.tsx`                                                   | M3        | Request |
| 26  | R3.14 Fix ChatBubble onKeyPress      | Replace deprecated `onKeyPress` with `onKeyDown` in `ChatBubble.tsx`                                           | M3        | Request |
| 27  | R4.1 Chat Knowledge Intent Keywords  | Align keywords with `getPortfolioFallback` handlers for 'agent', 'predictive', 'concurrency'                   | M2        | Request |
| 28  | R4.2 Clean File MDX Post Deletion    | Handle local file-based MDX post deletion cleanly with clear feedback                                          | M2        | Request |
| 29  | R4.3 Validate callbackUrl in Login   | Prevent open redirect vulnerabilities on `callbackUrl` in `src/app/admin/login/page.tsx`                       | M2        | Request |
| 30  | R4.4 Separate Gemini Instructions    | Separate system instructions and user input in Gemini chat route using role separation                         | M2        | Request |
| 31  | R4.5 Remove ADMIN_GITHUB_ID Log      | Remove `ADMIN_GITHUB_ID` exposure in server logs in `src/auth.ts`                                              | M2        | Request |
| 32  | R4.6 Replace Private Next Imports    | Replace `next/dist/...` imports in `actions.ts` and `blog/page.tsx` with public APIs                           | M2        | Request |
| 33  | R4.7 Journey Route Metadata          | Add missing route metadata for `/journey` and `/journey/certificates` in `Meta.tsx`                            | M2        | Request |
| 34  | R4.8 Multi-bullet Chat Experience    | Prevent truncation of multi-bullet work experience descriptions in `chat-knowledge.ts`                         | M2        | Request |

## Milestones

| #   | Name                             | Scope                                                                                                                         | Dependencies | Status      |
| --- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------- |
| M0  | Survey & Scope Mapping           | Survey all 34 cataloged issues across codebase                                                                                | none         | DONE        |
| M1  | Build, Tooling & Environment     | R2.1-R2.5 + R1.3 (package.json, prettier, .env, tsconfig, corrupt img, next.config)                                           | M0           | IN_PROGRESS |
| M2  | Backend, Security & Chat         | R1.1, R1.2, R1.4, R4.1-R4.8 (chat route, redis-posts, auth, actions, chat-knowledge, Meta)                                    | M0           | IN_PROGRESS |
| M3  | UI, Frontend & DOM Hardening     | R1.5-R1.7, R3.1-R3.14 (layout, admin widgets, components, hooks, dead components)                                             | M0           | IN_PROGRESS |
| M4  | Consolidated QA & Forensic Audit | Single consolidated verification (`npm run lint`, `npm run knip`, `tsc --noEmit`, `npm run build`) & Forensic Integrity Audit | M1, M2, M3   | PLANNED     |

## Interface Contracts & Code Layout

### Code Layout & File Boundaries

- M1 owns: `package.json`, `package-lock.json`, `.prettierrc*`, `.env.example`, `tsconfig.json`, `next.config.ts`, `public/blog/quantum-tunneling-zener-diode.png`.
- M2 owns: `src/app/api/chat/route.ts`, `src/lib/redis-posts.ts`, `src/lib/chat-knowledge.ts`, `src/auth.ts`, `src/app/admin/login/page.tsx`, `src/app/admin/actions.ts`, `src/app/blog/page.tsx`, `src/components/ui/Meta.tsx`.
- M3 owns: `src/app/layout.tsx`, `src/components/landing/Hero.tsx`, `src/components/landing/Github.tsx`, `src/components/landing/Quote.tsx`, `src/components/ui/OnekoCat.tsx`, `src/components/ui/ThemeSwitch.tsx`, `src/components/ui/ProjectCard.tsx`, `src/components/ui/ChatBubble.tsx`, `src/components/ui/expandable-chat.tsx`, `src/app/setup/page.tsx`, `src/app/journey/certificates/page.tsx`, `src/components/admin/PostForm.tsx`, `src/components/blog/BlogCard.tsx`, `src/components/blog/BlogContent.tsx`, `src/hooks/use-haptic-feedback.ts`, `src/components/landing/ContactForm.tsx`, `src/components/landing/Skill.tsx`, `src/components/landing/ProjectList.tsx`, `src/components/ui/Container.tsx`, `src/components/journey/CertificatesGallery.tsx`, dead components removal (`GearCard.tsx`, `BackToTop.tsx`, `sidebar.tsx`).
- M4 owns: Verification pass execution, gate reports, and forensic integrity audit.
