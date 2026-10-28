import { describe, expect, it } from 'vitest';

import { generateSystemPrompt } from '../src/config/ChatPrompt';
import {
  getPortfolioFallback,
  hasPortfolioIntent,
} from '../src/lib/chat-knowledge';
import { extractGeminiTextChunk } from '../src/lib/chat-response';

describe('Gemini streaming response parsing', () => {
  it('extracts text parts from candidate chunks', () => {
    expect(
      extractGeminiTextChunk({
        candidates: [
          {
            content: {
              parts: [{ text: 'Aryan built ' }, { text: 'it with C++.' }],
            },
          },
        ],
      }),
    ).toBe('Aryan built it with C++.');
  });

  it('returns an empty string when a chunk has no text candidates', () => {
    expect(extractGeminiTextChunk({ candidates: [] })).toBe('');
    expect(extractGeminiTextChunk(null)).toBe('');
  });

  it('instructs the assistant to give evidence-based project answers', () => {
    const prompt = generateSystemPrompt(
      'Transformer Predictive Maintenance: XGBoost, SHAP. Project page: /projects/transformer-predictive-maintenance',
    );

    expect(prompt).toContain('explain what the project does');
    expect(prompt).toContain('say it is not listed');
    expect(prompt).toContain('/projects/transformer-predictive-maintenance');
  });

  it('answers hobby questions with the updated interests and recognizes them as portfolio topics', () => {
    const answer = getPortfolioFallback(
      'What are Aryan’s hobbies and interests?',
    );

    expect(hasPortfolioIntent('Does Aryan enjoy VLSI and trekking?')).toBe(
      true,
    );
    expect(answer).toContain('Kareri Lake');
    expect(answer).toContain('Manimahesh Kailash');
    expect(answer).toContain('VLSI');
    expect(answer).toContain('yoga');
    expect(answer).toContain('Solo Leveling');
  });
});
