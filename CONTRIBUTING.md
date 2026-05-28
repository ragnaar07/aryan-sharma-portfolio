# Maintaining Aryan Sharma's Portfolio

This repository is Aryan Sharma's personal portfolio. Changes should keep the site focused, professional, and aligned with the AI/ML Engineer positioning.

## Engineering Standards

- Keep the site fast, responsive, and accessible.
- Prefer existing components and config files before adding new abstractions.
- Keep personal information, links, project descriptions, and resume assets accurate.
- Do not commit secrets, API keys, local cache files, or generated build output.
- Run a production build before publishing changes.

## Project Structure

```text
sleek-portfolio/
├── public/
│   ├── assets/        # Aryan profile images
│   ├── company/       # Alstom, SJVN, and other company logos
│   ├── project/       # Project artwork
│   └── resume/        # Resume and CV PDFs
├── src/
│   ├── app/           # Next.js app router pages and API routes
│   ├── components/    # React components
│   ├── config/        # Portfolio content and site configuration
│   ├── data/          # MDX content
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utilities
│   └── types/         # TypeScript types
```

## Updating Portfolio Content

Use `src/config` for most changes:

- Update hero copy, buttons, skills, and socials in `src/config/Hero.tsx`.
- Update experience entries in `src/config/Experience.tsx`.
- Update projects in `src/config/Projects.tsx`.
- Update resume/CV links in `src/config/Resume.ts`.
- Update SEO metadata in `src/config/Meta.tsx`.
- Update chat suggestions and prompt context in `src/config/ChatPrompt.ts`.

Avoid hardcoding personal content deep inside UI components unless the component is specifically personal-site-only.

## Chat Assistant

The assistant uses `src/app/api/chat/route.ts`.

Rules:

- Keep `GEMINI_API_KEY` server-side only.
- Store local keys in `.env.local`; never commit them.
- Keep portfolio-specific fallback answers working even when Gemini is unavailable.
- For common portfolio questions, deterministic answers are preferred over slow AI responses.

Required local environment:

```env
GEMINI_API_KEY="your-gemini-api-key"
NEXT_PUBLIC_URL="http://localhost:3001"
```

## Styling Guidelines

- Use Tailwind CSS utilities.
- Keep the portfolio clean, dense, and professional.
- Preserve dark/light mode support.
- Use responsive layouts and test mobile widths.
- Avoid oversized marketing sections that dilute the portfolio content.
- Keep project and experience sections easy to scan.

## Assets

When updating files in `public`:

- Compress large images before committing.
- Keep file names stable where possible.
- Use `public/assets/profile-avatar.jpg` for small avatar contexts.
- Use `public/assets/profile-photo.jpg` for larger profile/photo contexts.
- Keep resume files under `public/resume/`.

## Git Workflow

Before committing:

```bash
npm run build
```

Recommended commit style:

```text
feat(portfolio): add new AI project
fix(chat): improve portfolio answer matching
docs(readme): update deployment notes
```

## Deployment Checklist

Before publishing:

1. Run `npm run build`.
2. Confirm `/`, `/projects`, `/resume`, and `/contact` work.
3. Confirm `/api/chat` returns a response.
4. Confirm `GEMINI_API_KEY` is set in the deployment provider.
5. Confirm no `.env.local` or API keys are committed.
6. Confirm resume/CV PDFs are current.

## Ownership

This site represents Aryan Sharma. Keep the copy direct, accurate, and focused on AI/ML engineering, production software, automation, C++, Linux, and industrial software experience.
