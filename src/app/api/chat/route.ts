import { about } from '@/config/About';
import { systemPrompt } from '@/config/ChatPrompt';
import { experiences } from '@/config/Experience';
import { heroConfig, socialLinks } from '@/config/Hero';
import { projects } from '@/config/Projects';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';
const GEMINI_TIMEOUT_MS = 12000;

type ChatMessage = {
  sender: 'user' | 'bot';
  text: string;
};

function buildPrompt(messages: ChatMessage[], message: string) {
  const recentMessages = messages
    .slice(-8)
    .map((chatMessage) => {
      const speaker = chatMessage.sender === 'user' ? 'Visitor' : 'Assistant';
      return `${speaker}: ${chatMessage.text}`;
    })
    .join('\n');

  return [
    systemPrompt,
    recentMessages ? `Recent conversation:\n${recentMessages}` : '',
    [
      'Answer quality rules:',
      '- Answer the latest visitor question directly.',
      '- Use concrete details from the portfolio context.',
      '- If listing projects, include project names and one-line summaries.',
      '- Do not stop after a generic preface like "Here are...".',
      '- Keep the response concise: 2-5 bullets or one short paragraph.',
    ].join('\n'),
    `Visitor: ${message}`,
    'Assistant:',
  ]
    .filter(Boolean)
    .join('\n\n');
}

function extractText(payload: unknown) {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('candidates' in payload) ||
    !Array.isArray(payload.candidates)
  ) {
    return '';
  }

  return payload.candidates
    .flatMap((candidate) => candidate?.content?.parts ?? [])
    .map((part) => part?.text)
    .filter((text): text is string => typeof text === 'string')
    .join('\n')
    .trim();
}

function getPortfolioFallback(message: string) {
  const lower = message.toLowerCase();
  const skills = heroConfig.skills.map((skill) => skill.name).join(', ');
  const email = socialLinks.find((link) => link.name === 'Email')?.href ?? '';
  const github = socialLinks.find((link) => link.name === 'Github')?.href ?? '';
  const linkedIn =
    socialLinks.find((link) => link.name === 'LinkedIn')?.href ?? '';

  if (
    lower.includes('skill') ||
    lower.includes('tech') ||
    lower.includes('stack') ||
    lower.includes('ai') ||
    lower.includes('ml') ||
    lower.includes('work with')
  ) {
    return `I focus on AI/ML and production software. Core skills: **${skills}**, plus C++ systems work, Linux, automation, and industrial software validation.`;
  }

  if (
    lower.includes('contact') ||
    lower.includes('hire') ||
    lower.includes('reach') ||
    lower.includes('connect') ||
    lower.includes('message') ||
    lower.includes('call') ||
    lower.includes('email') ||
    lower.includes('work together')
  ) {
    return [
      'Best way to reach me:',
      `- **Email**: [aryan.engineer783@gmail.com](${email}) for roles, project details, or collaboration notes.`,
      `- **LinkedIn**: [aryansh7](${linkedIn}) for professional updates and quick outreach.`,
      `- **GitHub**: [ragnaar07](${github}) to review my public projects.`,
      '',
      'For a useful first message, include the role/project, timeline, tech stack, and expected next step.',
    ].join('\n');
  }

  if (
    lower.includes('project') ||
    lower.includes('github') ||
    lower.includes('repo')
  ) {
    const projectList = projects
      .slice(0, 5)
      .map(
        (project) =>
          `- **${project.title}**: ${project.description} [Link](${
            project.github ?? project.link
          })`,
      )
      .join('\n');

    return `My key projects include:\n${projectList}`;
  }

  if (
    lower.includes('experience') ||
    lower.includes('alstom') ||
    lower.includes('job') ||
    lower.includes('intern')
  ) {
    const experienceList = experiences
      .map(
        (experience) =>
          `- **${experience.position}** at ${experience.company} (${experience.startDate} - ${experience.endDate})`,
      )
      .join('\n');

    return `My experience:\n${experienceList}`;
  }

  if (lower.includes('resume') || lower.includes('cv')) {
    return 'You can view my systems resume and AI/ML CV on the [Resume page](/resume).';
  }

  return `${about.description} Ask me about my AI/ML skills, projects, work experience, resume, or contact details.`;
}

function isWeakResponse(text: string) {
  return (
    text.length < 60 ||
    /^here (are|is)\b.*:?$/i.test(text.trim()) ||
    /^sure\b.*:?$/i.test(text.trim())
  );
}

function hasPortfolioIntent(message: string) {
  const lower = message.toLowerCase();

  return (
    lower.includes('skill') ||
    lower.includes('tech') ||
    lower.includes('stack') ||
    lower.includes('ai') ||
    lower.includes('ml') ||
    lower.includes('work with') ||
    lower.includes('project') ||
    lower.includes('github') ||
    lower.includes('repo') ||
    lower.includes('experience') ||
    lower.includes('alstom') ||
    lower.includes('job') ||
    lower.includes('intern') ||
    lower.includes('resume') ||
    lower.includes('cv') ||
    lower.includes('contact') ||
    lower.includes('hire') ||
    lower.includes('reach') ||
    lower.includes('connect') ||
    lower.includes('message') ||
    lower.includes('call') ||
    lower.includes('email') ||
    lower.includes('work together')
  );
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  const body = await request.json().catch(() => null);
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  const messages = Array.isArray(body?.messages)
    ? (body.messages as ChatMessage[])
    : [];

  if (!message) {
    return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
  }

  if (hasPortfolioIntent(message)) {
    return NextResponse.json({ text: getPortfolioFallback(message) });
  }

  if (!apiKey) {
    return NextResponse.json({ text: getPortfolioFallback(message) });
  }

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), GEMINI_TIMEOUT_MS);

  let geminiResponse: Response;

  try {
    geminiResponse = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: buildPrompt(messages, message) }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 260,
        },
      }),
      signal: abortController.signal,
    });
  } catch {
    return NextResponse.json({ text: getPortfolioFallback(message) });
  } finally {
    clearTimeout(timeout);
  }

  const payload = await geminiResponse.json().catch(() => null);

  if (!geminiResponse.ok) {
    return NextResponse.json({ text: getPortfolioFallback(message) });
  }

  const text = extractText(payload);

  if (!text) {
    return NextResponse.json({ text: getPortfolioFallback(message) });
  }

  return NextResponse.json({
    text: isWeakResponse(text) ? getPortfolioFallback(message) : text,
  });
}
