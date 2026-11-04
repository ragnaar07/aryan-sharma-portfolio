import { describe, expect, it } from 'vitest';

import {
  chatSuggestions,
  generateSystemPrompt,
} from '../src/config/ChatPrompt';
import {
  getPortfolioFallback,
  getPortfolioKnowledgeContext,
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

  it('instructs the assistant to use a natural Hindi-English style with light Himachali expressions', () => {
    const prompt = generateSystemPrompt();

    expect(prompt).toContain('natural mix of Hindi and English (Hinglish)');
    expect(prompt).toContain('simple Himachali expressions');
    expect(prompt).toContain("Match the visitor's language");
  });

  it('answers hobby questions with the updated interests and recognizes them as portfolio topics', () => {
    const answer = getPortfolioFallback(
      'What are Aryan’s hobbies and interests?',
    );

    expect(answer).toContain('Hmji ji');
    expect(hasPortfolioIntent('Does Aryan enjoy VLSI and trekking?')).toBe(
      true,
    );
    expect(answer).toContain('Kareri Lake');
    expect(answer).toContain('Manimahesh Kailash');
    expect(answer).toContain('VLSI');
    expect(answer).toContain('yoga');
    expect(answer).toContain('Solo Leveling');
  });

  it('answers every suggested question with a specific portfolio response', () => {
    for (const question of chatSuggestions) {
      const answer = getPortfolioFallback(question);

      expect(hasPortfolioIntent(question), question).toBe(true);
      expect(answer, question).not.toContain(
        'The portfolio does not list a specific answer to that question.',
      );
    }
  });

  it('answers where Aryan studied with schooling and award details', () => {
    const answer = getPortfolioFallback('Where did Aryan study?');
    const knowledgeContext = getPortfolioKnowledgeContext();

    expect(hasPortfolioIntent('Where did Aryan study?')).toBe(true);
    expect(answer).toContain('NIT Hamirpur');
    expect(answer).toContain('DAV Public School Lathiani');
    expect(answer).toContain('Children Science Congress Fair Winner');
    expect(knowledgeContext).toContain('DAV Public School Lathiani');
    expect(knowledgeContext).toContain('Children Science Congress Fair Winner');
    expect(hasPortfolioIntent('What awards has Aryan received?')).toBe(true);
    expect(getPortfolioFallback('What awards has Aryan received?')).toContain(
      'Children Science Congress Fair Winner',
    );
  });

  it('recognizes questions about interests outside engineering', () => {
    const question = 'What do you enjoy outside engineering?';

    expect(hasPortfolioIntent(question)).toBe(true);
    expect(getPortfolioFallback(question)).toContain('Trekking & adventure');
  });
});
