---
name: sync-chat-knowledge
description: >-
  Use this skill whenever changes are made to Aryan's experience, projects, skills, education,
  or bio in src/config/. It ensures the server-side Gemini chat assistant and fallback knowledge
  matcher in src/lib/chat-knowledge.ts remain 100% in sync with the portfolio's actual content.
---

# Sync Chat Knowledge Runbook

The portfolio includes a server-side AI assistant in `src/app/api/chat/route.ts` that answers visitor questions about Aryan Sharma. When Gemini is offline, slow, or when questions require deterministic portfolio answers, `src/lib/chat-knowledge.ts` provides instant fallback answers.

Whenever configuration data in `src/config/` is updated, follow this procedure:

## 1. Audit Updated Config Files

Identify what changed in:

- `src/config/Hero.tsx` (headline, top skills, contact info, social links)
- `src/config/About.tsx` (education, timeline, summary)
- `src/config/Experience.tsx` (roles, company names, key achievements, dates)
- `src/config/Projects.tsx` (new projects, updated descriptions, live URLs)
- `src/config/Resume.ts` (updated PDF links)

## 2. Update `src/lib/chat-knowledge.ts`

- **Dynamic Context Builder**:
  - `getPortfolioKnowledgeContext()` builds prompt grounding from config objects. Confirm that any new fields or arrays are included in the generated context string.
- **Intent Detection (`hasPortfolioIntent`)**:
  - Check whether new keywords (e.g. company names, specialized frameworks, domain terms) need to be added to the regex/keyword lists.
- **Fallback Formatter (`getPortfolioFallback`)**:
  - If a new company was added to `Experience.tsx`, ensure `experience` queries list the company properly.
  - If new tech domains were added (e.g. Robotics, LLM fine-tuning), ensure queries like "What does Aryan know about X?" return the relevant projects.

## 3. Update `src/config/ChatPrompt.ts`

- Verify that `systemPrompt` accurately reflects Aryan's current primary title and domains.
- Update `suggestedQuestions` so visitor quick-prompts showcase the latest projects or skills.

## 4. Test Chat Queries

- Run a quick evaluation query in development or test against `getPortfolioFallback(query)`:
  - "Tell me about Aryan's work at [Company]"
  - "What projects has Aryan built with [Technology]?"
  - "Where did Aryan study?"
  - "How can I contact Aryan?"
- Ensure replies are concise, accurate, and include relevant links.
