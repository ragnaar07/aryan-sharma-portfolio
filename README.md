# Aryan Sharma Portfolio

Personal portfolio for **Aryan Sharma**, focused on AI/ML engineering, production software, automation, C++ systems work, Linux workflows, and industrial validation projects.

The site includes Aryan's resume, CV, GitHub projects, experience, profile photo, project visuals, resume downloads, contact flow, and portfolio assistant.

## Live Focus

This portfolio is designed to present Aryan as an:

- AI/ML Engineer
- Software Engineer
- Python and C++ developer
- Linux and automation-focused engineer
- Builder of practical ML, GenAI, RAG, validation, and industrial software systems

## Main Sections

- **Hero**: Aryan's AI/ML Engineer positioning, primary skills, resume link, and contact CTA.
- **Experience**: Alstom Transport India Ltd. and SJVN Ltd.
- **Projects**: Projects from Aryan's CV/resume and public GitHub profile.
- **GitHub**: Public contribution/activity section for `ragnaar07`.
- **Resume / CV**: Downloadable resume and CV PDFs.
- **Contact**: Free `mailto:` contact flow.
- **Chat Assistant**: Portfolio assistant backed by server-side Gemini when available, with local fallback answers for portfolio questions.

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Shadcn/Radix UI components
- MDX
- Gemini API through a server-side API route

## Environment Variables

Create a local `.env.local` file:

```env
GEMINI_API_KEY="your-gemini-api-key"
NEXT_PUBLIC_URL="http://localhost:3001"
```

Notes:

- `.env.local` is ignored by Git and must not be committed.
- The Gemini key is read only by `/api/chat` on the server.
- If `GEMINI_API_KEY` is missing or Gemini is slow/unavailable, the assistant still answers portfolio-specific questions using local fallback logic.
- For deployment, set `GEMINI_API_KEY` in the hosting provider's environment variables.

## Local Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev -- -p 3001
```

Open:

```text
http://localhost:3001
```

Build for production:

```bash
npm run build
```

## Content Map

Most portfolio content is configured in `src/config`:

- `About.tsx` - about section and short bio
- `ChatPrompt.ts` - assistant prompt and quick questions
- `Contact.tsx` - contact page copy
- `Experience.tsx` - work experience
- `Footer.tsx` - footer text
- `Github.tsx` - GitHub username
- `Hero.tsx` - hero copy, skills, links, and buttons
- `Meta.tsx` - SEO metadata
- `Navbar.tsx` - navigation and logo
- `Projects.tsx` - project showcase
- `Resume.ts` - resume/CV links

Static assets live in `public`:

- `public/assets/` - profile images
- `public/company/` - company logos
- `public/project/` - project visuals
- `public/resume/` - resume and CV PDFs

## Project Sources

Projects are based on:

- Aryan's resume and CV PDFs
- Public GitHub repositories from `https://github.com/ragnaar07`

CV/resume-only projects link to `/resume` when no public GitHub repository exists.

## Deployment Notes

Recommended deployment targets:

- Vercel
- Netlify
- Any platform that supports Next.js app router server routes

Before deploying:

1. Set `GEMINI_API_KEY` in deployment environment variables.
2. Set `NEXT_PUBLIC_URL` to the deployed domain.
3. Run `npm run build`.
4. Do not expose API keys in client code or committed files.

## License

This repository contains Aryan Sharma's personal portfolio.
