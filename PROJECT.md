# Project: Aryan Sharma Portfolio Audit & Hardening

## Overview & Architecture

Next.js 15 App Router portfolio with Tailwind CSS v4, Upstash Redis blog storage, MDX local fallback, Auth.js GitHub authentication, and Gemini-powered chat assistant.

Key directories:

- `src/config/`: Single source of truth for portfolio data (Hero, Projects, Experience, About, BlogAdmin, etc.)
- `src/lib/`: Backend business logic, chat knowledge, Upstash Redis persistence, auth guards, blog loader
- `src/app/`: Next.js App Router (layout, admin, blog, journey, api/chat, api/auth, api/admin, api/blog)
- `src/components/`: UI components (admin, blog, landing, ui, technologies)
- `public/`: Static assets (assets, blog, project, company, resume)

---

## Feature Inventory & Resolution Status

| #   | Feature / Issue                      | Description                                                                                                    | Milestone | Status   |
| --- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------- | --------- | -------- |
| 1   | R1.1 Gemini Route Logic              | Invert Gemini chat route logic in `src/app/api/chat/route.ts` to call Gemini API first                         | M2        | RESOLVED |
| 2   | R1.2 Gemini Model Endpoint           | Use valid Gemini model identifier (`gemini-2.0-flash`)                                                         | M2        | RESOLVED |
| 3   | R1.3 Unsplash RemotePattern          | Add `images.unsplash.com` to `remotePatterns` in `next.config.ts`                                              | M1        | RESOLVED |
| 4   | R1.4 Redis Date Parsing              | Safely handle invalid dates in `src/lib/redis-posts.ts` without throwing RangeError                            | M2        | RESOLVED |
| 5   | R1.5 Missing Asset /assets/me.png    | Resolve missing fallback asset `/assets/me.png` referenced in blog components                                  | M3        | RESOLVED |
| 6   | R1.6 Nested Form in Admin Preview    | Eliminate illegal nested `<form>` in `PostForm.tsx` preview caused by `CodeCopyButton`                         | M3        | RESOLVED |
| 7   | R1.7 Hero CTA DOM Nesting            | Fix invalid `<button><a>` DOM nesting in `Hero.tsx` using `asChild`                                            | M3        | RESOLVED |
| 8   | R2.1 Standardize on npm              | Standardize on npm for package management and script execution                                                 | M1        | RESOLVED |
| 9   | R2.2 Unify Prettier Config           | Eliminate conflicting dual configs (`.prettierrc` and `.prettierrc.json`)                                      | M1        | RESOLVED |
| 10  | R2.3 Clean .env.example              | Remove stray commands, add missing `UPSTASH_REDIS_REST_URL` and `_TOKEN`                                       | M1        | RESOLVED |
| 11  | R2.4 Fix TypeScript Errors           | Resolve TS compilation errors in `actions.ts`, `expandable-chat.tsx`, `certificates/page.tsx`, `tsconfig.json` | M1        | RESOLVED |
| 12  | R2.5 Corrupt Blog Image              | Fix 1-byte corrupt image placeholder `public/blog/quantum-tunneling-zener-diode.png`                           | M1        | RESOLVED |
| 13  | R3.1 OnekoCat Script Path            | Fix `OnekoCat.tsx` script path to use absolute path for subroutes                                              | M3        | RESOLVED |
| 14  | R3.2 ThemeSwitch resolvedTheme       | Inspect `resolvedTheme` in `ThemeSwitch.tsx` and remove debug logs                                             | M3        | RESOLVED |
| 15  | R3.3 Github Calendar Theme           | Use `resolvedTheme` in `Github.tsx` calendar theme evaluation                                                  | M3        | RESOLVED |
| 16  | R3.4 Mount Toaster in Root Layout    | Mount `<Toaster />` in `src/app/layout.tsx` so contact form toasts appear                                      | M3        | RESOLVED |
| 17  | R3.5 Setup Page Copy                 | Implement working clipboard copy functionality in `src/app/setup/page.tsx`                                     | M3        | RESOLVED |
| 18  | R3.6 TooltipTrigger asChild          | Add `asChild` to `<TooltipTrigger>` wrapping `<Link>` in `ProjectCard.tsx`                                     | M3        | RESOLVED |
| 19  | R3.7 Guard Admin Layout Widgets      | Prevent public widgets (Navbar, OnekoCat, Quote, Footer, ChatBubble) on `/admin`                               | M3        | RESOLVED |
| 20  | R3.8 Eliminate Undefined CSS Classes | Clean undefined classes in `Container.tsx`, `ProjectList.tsx`, `CertificatesGallery.tsx`                       | M3        | RESOLVED |
| 21  | R3.9 Fix Tailwind Classes in Quote   | Replace phantom utility classes in `Quote.tsx` with valid Tailwind v4 theme tokens                             | M3        | RESOLVED |
| 22  | R3.10 Fix AudioContext Leak          | Ensure AudioContext instances are closed or reused in `use-haptic-feedback.ts`                                 | M3        | RESOLVED |
| 23  | R3.11 Accessibility Deficiencies     | Fix `Hero.tsx` aria-label, `resume/page.tsx` title, `Skill.tsx` rel                                            | M3        | RESOLVED |
| 24  | R3.12 Remove Dead Components         | Remove `GearCard.tsx`, `BackToTop.tsx`, `sidebar.tsx`, outdated `ProjectComponents.tsx`                        | M3        | RESOLVED |
| 25  | R3.13 Centralize Contact Email       | Import contact email from `src/config/` in `ContactForm.tsx`                                                   | M3        | RESOLVED |
| 26  | R3.14 Fix ChatBubble onKeyPress      | Replace deprecated `onKeyPress` with `onKeyDown` in `ChatBubble.tsx`                                           | M3        | RESOLVED |
| 27  | R4.1 Chat Knowledge Intent Keywords  | Align keywords with `getPortfolioFallback` handlers for 'agent', 'predictive', 'concurrency'                   | M2        | RESOLVED |
| 28  | R4.2 Clean File MDX Post Deletion    | Handle local file-based MDX post deletion cleanly with clear feedback                                          | M2        | RESOLVED |
| 29  | R4.3 Validate callbackUrl in Login   | Prevent open redirect vulnerabilities on `callbackUrl` in `src/app/admin/login/page.tsx`                       | M2        | RESOLVED |
| 30  | R4.4 Separate Gemini Instructions    | Separate system instructions and user input in Gemini chat route using role separation                         | M2        | RESOLVED |
| 31  | R4.5 Remove ADMIN_GITHUB_ID Log      | Remove `ADMIN_GITHUB_ID` exposure in server logs in `src/auth.ts`                                              | M2        | RESOLVED |
| 32  | R4.6 Replace Private Next Imports    | Replace `next/dist/...` imports in `actions.ts` and `blog/page.tsx` with public APIs                           | M2        | RESOLVED |
| 33  | R4.7 Journey Route Metadata          | Add missing route metadata for `/journey` and `/journey/certificates` in `Meta.tsx`                            | M2        | RESOLVED |
| 34  | R4.8 Multi-bullet Chat Experience    | Prevent truncation of multi-bullet work experience descriptions in `chat-knowledge.ts`                         | M2        | RESOLVED |

---

## Milestones Summary

| #   | Name                             | Scope                                                                                                                         | Dependencies | Status |
| --- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------ | ------ |
| M0  | Survey & Scope Mapping           | Survey all 34 cataloged issues across codebase                                                                                | none         | DONE   |
| M1  | Build, Tooling & Environment     | R2.1-R2.5 + R1.3 (package.json, prettier, .env, tsconfig, corrupt img, next.config)                                           | M0           | DONE   |
| M2  | Backend, Security & Chat         | R1.1, R1.2, R1.4, R4.1-R4.8 (chat route, redis-posts, auth, actions, chat-knowledge, Meta)                                    | M0           | DONE   |
| M3  | UI, Frontend & DOM Hardening     | R1.5-R1.7, R3.1-R3.14 (layout, admin widgets, components, hooks, dead components)                                             | M0           | DONE   |
| M4  | Consolidated QA & Forensic Audit | Single consolidated verification (`npm run lint`, `npm run knip`, `tsc --noEmit`, `npm run build`) & Forensic Integrity Audit | M1, M2, M3   | DONE   |

---

## Forensic Quality Verification Status

All gates have been executed and verified in the live workspace:

- **Prettier Code Formatting**: `npm run format:all` passes across all source and markdown files.
- **ESLint 9 Static Analysis**: `npm run lint` passes with 0 warnings and 0 errors.
- **Knip Dead Code Audit**: `npm run knip` confirms zero unused files, exports, or devDependencies.
- **TypeScript Strict Compilation**: `npm run typecheck` (`tsc --noEmit`) passes with 0 errors.
- **Automated Tests**: `npm test` (`vitest run`) executes and passes all test suites (including chat fallback routing and KaTeX MDX math pipeline).
- **Next.js Production Build**: `npm run build` compiles with Turbopack, generating all static (31/31) and dynamic server routes cleanly.
