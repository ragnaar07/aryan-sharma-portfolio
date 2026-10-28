import { NextRequest, NextResponse } from 'next/server';

import { generateSystemPrompt } from '@/config/ChatPrompt';
import { getPublishedBlogPostsAsync } from '@/lib/blog';
import { getPortfolioFallback } from '@/lib/chat-knowledge';
import { extractGeminiTextChunk } from '@/lib/chat-response';
import { getPublishedProjects } from '@/lib/projects';

export const runtime = 'nodejs';

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:streamGenerateContent?alt=sse';
const GEMINI_TIMEOUT_MS = 12000;
const MAX_PROJECT_CONTEXT = 20;
const MAX_BLOG_CONTEXT = 12;

function fallbackResponse(message: string) {
  return new Response(getPortfolioFallback(message), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Chat-Mode': 'fallback',
    },
  });
}

type ChatMessage = {
  sender: 'user' | 'bot';
  text: string;
};

type GeminiContent = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

function buildGeminiContents(
  messages: ChatMessage[],
  currentMessage: string,
): GeminiContent[] {
  const cleanMessages = messages.filter(
    (m) => m && typeof m.text === 'string' && m.text.trim().length > 0,
  );

  // If the last message in cleanMessages is already the current user message, exclude it from history
  const candidateHistory =
    cleanMessages.length > 0 &&
    cleanMessages[cleanMessages.length - 1].sender === 'user' &&
    cleanMessages[cleanMessages.length - 1].text.trim() ===
      currentMessage.trim()
      ? cleanMessages.slice(0, -1)
      : cleanMessages;

  // Take recent turns (up to 8)
  const recent = candidateHistory.slice(-8);

  // Gemini contents must begin with a 'user' turn.
  // Find the index of the first 'user' message in recent history.
  const firstUserIdx = recent.findIndex((m) => m.sender === 'user');
  const validHistory = firstUserIdx >= 0 ? recent.slice(firstUserIdx) : [];

  const turns: { role: 'user' | 'model'; text: string }[] = [];

  for (const item of validHistory) {
    const role: 'user' | 'model' = item.sender === 'user' ? 'user' : 'model';
    const text = item.text.trim();

    if (turns.length > 0 && turns[turns.length - 1].role === role) {
      turns[turns.length - 1].text += `\n${text}`;
    } else {
      turns.push({ role, text });
    }
  }

  // Append current user message
  if (turns.length > 0 && turns[turns.length - 1].role === 'user') {
    turns[turns.length - 1].text += `\n${currentMessage.trim()}`;
  } else {
    turns.push({ role: 'user', text: currentMessage.trim() });
  }

  return turns.map((item) => ({
    role: item.role,
    parts: [{ text: item.text }],
  }));
}

async function getCurrentPublishedContext(): Promise<string> {
  const [projects, posts] = await Promise.all([
    getPublishedProjects(),
    getPublishedBlogPostsAsync(),
  ]);
  const projectContext = projects
    .slice(0, MAX_PROJECT_CONTEXT)
    .map((project) =>
      [
        `- ${project.title}: ${project.description.slice(0, 600)}`,
        `Technologies: ${project.techStack.join(', ') || 'Not listed'}`,
        project.highlights.length > 0
          ? `Highlights: ${project.highlights.join('; ')}`
          : '',
        project.metrics.length > 0
          ? `Metrics: ${project.metrics.map(({ label, value }) => `${label}: ${value}`).join('; ')}`
          : '',
        `Project page: /projects/${project.slug}`,
        project.repoUrl || project.github
          ? `Repository: ${project.repoUrl || project.github}`
          : '',
        project.liveUrl || project.demoUrl
          ? `Demo: ${project.liveUrl || project.demoUrl}`
          : '',
      ]
        .filter(Boolean)
        .join(' | '),
    );
  const blogContext = posts.slice(0, MAX_BLOG_CONTEXT).map((post) => {
    const description = post.frontmatter.description
      ? `: ${post.frontmatter.description.slice(0, 240)}`
      : '';
    return `- ${post.frontmatter.title}${description} (/blog/${post.slug})`;
  });

  return [
    projectContext.length > 0
      ? `Published projects (up to ${MAX_PROJECT_CONTEXT}):\n${projectContext.join('\n')}`
      : '',
    blogContext.length > 0
      ? `Published blog posts (up to ${MAX_BLOG_CONTEXT}):\n${blogContext.join('\n')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  const body = await request.json().catch(() => null);
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  const messages = Array.isArray(body?.messages)
    ? (body.messages as ChatMessage[])
    : [];

  if (!message) {
    return NextResponse.json(
      { error: 'Message is required.' },
      { status: 400 },
    );
  }

  // Deterministic fallback if API key is not configured
  if (!apiKey) {
    console.warn(
      '[api/chat] GEMINI_API_KEY is not configured; returning local fallback.',
    );
    return fallbackResponse(message);
  }

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), GEMINI_TIMEOUT_MS);

  let geminiResponse: Response;
  try {
    const systemPrompt = generateSystemPrompt(
      await getCurrentPublishedContext(),
    );
    geminiResponse = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: [
                systemPrompt,
                [
                  'Answer quality rules:',
                  '- Answer the latest visitor question directly.',
                  '- For a project question, explain its purpose and available implementation details, list its technologies, and link to its project page or repository.',
                  '- Never invent project features, metrics, role details, or results that are not in the portfolio context. Explicitly say when information is not listed.',
                  '- Do not stop after a generic preface like "Here are...".',
                  '- Keep the response concise: 2-5 bullets or one short paragraph.',
                ].join('\n'),
              ].join('\n\n'),
            },
          ],
        },
        contents: buildGeminiContents(messages, message),
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 260,
        },
      }),
      signal: abortController.signal,
    });
  } catch (error) {
    clearTimeout(timeout);
    console.error('[api/chat] Gemini request failed:', error);
    return fallbackResponse(message);
  }

  if (!geminiResponse.ok) {
    clearTimeout(timeout);
    const errorPayload = await geminiResponse.json().catch(() => null);
    const providerMessage =
      typeof errorPayload === 'object' &&
      errorPayload !== null &&
      'error' in errorPayload &&
      typeof errorPayload.error === 'object' &&
      errorPayload.error !== null &&
      'message' in errorPayload.error &&
      typeof errorPayload.error.message === 'string'
        ? errorPayload.error.message.slice(0, 500)
        : 'No provider error message was returned.';
    console.error(
      `[api/chat] Gemini request failed with status ${geminiResponse.status}: ${providerMessage}`,
    );
    return fallbackResponse(message);
  }

  if (!geminiResponse.body) {
    clearTimeout(timeout);
    console.error(
      '[api/chat] Gemini response did not include a readable stream.',
    );
    return fallbackResponse(message);
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const upstreamReader = geminiResponse.body.getReader();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = '';
      try {
        while (true) {
          const { done, value } = await upstreamReader.read();
          buffer += decoder.decode(value, { stream: !done });
          const events = buffer.split(/\r?\n\r?\n/);
          buffer = events.pop() ?? '';

          for (const event of events) {
            const data = event
              .split(/\r?\n/)
              .filter((line) => line.startsWith('data:'))
              .map((line) => line.slice(5).trim())
              .join('\n');
            if (!data || data === '[DONE]') continue;

            try {
              const text = extractGeminiTextChunk(JSON.parse(data));
              if (text) controller.enqueue(encoder.encode(text));
            } catch (error) {
              console.error(
                '[api/chat] Failed to parse Gemini stream event:',
                error,
              );
            }
          }

          if (done) break;
        }

        if (buffer.trim()) {
          const data = buffer
            .split(/\r?\n/)
            .filter((line) => line.startsWith('data:'))
            .map((line) => line.slice(5).trim())
            .join('\n');
          if (data && data !== '[DONE]') {
            const text = extractGeminiTextChunk(JSON.parse(data));
            if (text) controller.enqueue(encoder.encode(text));
          }
        }
        controller.close();
      } catch (error) {
        console.error('[api/chat] Gemini response stream failed:', error);
        controller.error(error);
      } finally {
        clearTimeout(timeout);
        upstreamReader.releaseLock();
      }
    },
    cancel() {
      abortController.abort();
      clearTimeout(timeout);
      return upstreamReader.cancel();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      'X-Chat-Mode': 'gemini',
    },
  });
}
