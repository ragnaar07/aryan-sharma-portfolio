import { NextRequest, NextResponse } from 'next/server';

import { systemPrompt } from '@/config/ChatPrompt';
import { getPortfolioFallback } from '@/lib/chat-knowledge';

export const runtime = 'nodejs';

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const GEMINI_TIMEOUT_MS = 12000;

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

function isWeakResponse(text: string) {
  return (
    text.length < 60 ||
    /^here (are|is)\b.*:?$/i.test(text.trim()) ||
    /^sure\b.*:?$/i.test(text.trim())
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
    return NextResponse.json(
      { error: 'Message is required.' },
      { status: 400 },
    );
  }

  // Deterministic fallback if API key is not configured
  if (!apiKey) {
    return NextResponse.json({ text: getPortfolioFallback(message) });
  }

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), GEMINI_TIMEOUT_MS);

  let geminiResponse: Response;

  try {
    geminiResponse = await fetch(
      `${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`,
      {
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
                    '- Use concrete details from the portfolio context.',
                    '- If listing projects, include project names and one-line summaries.',
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
      },
    );
  } catch {
    return NextResponse.json({ text: getPortfolioFallback(message) });
  } finally {
    clearTimeout(timeout);
  }

  if (!geminiResponse.ok) {
    return NextResponse.json({ text: getPortfolioFallback(message) });
  }

  const payload = await geminiResponse.json().catch(() => null);
  const text = extractText(payload);

  if (!text) {
    return NextResponse.json({ text: getPortfolioFallback(message) });
  }

  return NextResponse.json({
    text: isWeakResponse(text) ? getPortfolioFallback(message) : text,
  });
}
