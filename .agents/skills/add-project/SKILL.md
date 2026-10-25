---
name: add-project
description: >-
  Use this skill whenever adding a new engineering, AI/ML, or software project to Aryan's
  portfolio. It guides artwork placement, tech icon mapping, config entry creation,
  and AI chat knowledge base synchronization.
---

# Add New Project Runbook

Follow these steps to add a new project to Aryan Sharma's portfolio:

## 1. Asset Preparation

- Obtain or create a visual representation (SVG or WebP preferred) and save it in `public/project/`:
  - Example: `public/project/my-new-project.svg`
- Keep file sizes under 200KB. Ensure the visual looks clean in both dark and light modes.

## 2. Technology Icon Verification

- Check if icons for the required technologies exist in `src/components/technologies/`.
- If an icon is missing:
  - Create a new component in `src/components/technologies/<TechName>.tsx` using Lucide or SVG.
  - Export it cleanly and ensure it supports `className="size-4"` or similar dimensions.

## 3. Register in `src/config/Projects.tsx`

- Open `src/config/Projects.tsx`.
- Import necessary technology icons.
- Add the project definition to the `projects` array:
  ```typescript
  {
    title: 'Project Name',
    description: 'Crisp 1-2 sentence description highlighting business impact, architecture, and engineering stack.',
    image: '/project/my-new-project.svg',
    link: 'https://github.com/ragnaar07/...', // or resumeLink if private
    github: 'https://github.com/ragnaar07/...',
    technologies: [
      { name: 'Python', icon: <Python key="python" /> },
      { name: 'FastAPI', icon: <FastAPI key="fastapi" /> },
    ],
    live: 'https://...',
    details: false,
    projectDetailsPageSlug: '/projects',
    isWorking: true,
  }
  ```

## 4. AI Assistant Knowledge Synchronization (Mandatory)

- Open `src/lib/chat-knowledge.ts`:
  - Verify that the title and tech stack words are matched in `getRelevantProjects()`.
  - Check `getPortfolioFallback()`: if the project introduces a new technology category (e.g. ROS, WebAssembly, Kubernetes), add matching intent triggers so visitors asking about it receive accurate answers.
- Open `src/config/ChatPrompt.ts`:
  - Consider adding a sample query to `suggestedQuestions` if the project represents a major milestone.

## 5. Verification

- Run a type check and build verification:
  ```bash
  npm run build
  ```
- Navigate to `/projects` in your local development server to confirm rendering and responsiveness.
