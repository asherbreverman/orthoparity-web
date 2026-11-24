import { describe, expect, it } from 'vitest';
import { firstVendorQuestion, topVendorQuestions, vacSummaryText } from '@/lib/vac-summary';
import type { DecisionCard } from '@/lib/signals';

const card = (key: string, asks: string[] = []): DecisionCard => ({ key, question: `Question ${key}`, badge: `Answer ${key}`, finding: '', why: '', ask: asks[0] ?? '', asks, evidence: key, tone: 'info' });

describe('VAC packet summary', () => {
  it('selects the first question in the requested card order and skips blanks', () => {
    const cards = [card('medicare', ['Medicare?']), card('catalog', ['Stocking?']), card('novelty', ['New?', 'Other?']), card('owner', ['Owner?']), card('alternatives', ['Alternatives?']), card('payments', [''])];
    expect(topVendorQuestions(cards)).toEqual(['New?', 'Alternatives?', 'Stocking?', 'Medicare?']);
    expect(firstVendorQuestion(cards[2]!)).toBe('New?');
  });

  it('copies every answer and the selected questions in the requested order', () => {
    const cards = [card('novelty', ['New?']), card('owner', ['Owner?'])];
    const text = vacSummaryText({ name: 'ATTUNE knee', number: 'K140881', owner: 'DePuy Synthes', decisionDate: 'Cleared Feb 13, 2015', bottomLine: 'Line extension.', cards, dataThrough: 'Nov 19, 2026', url: 'https://www.orthoparity.com/?k=K140881' });
    expect(text).toContain('ATTUNE knee · K140881\nOwner today: DePuy Synthes\nDecision date: Cleared Feb 13, 2015\nBottom line: Line extension.');
    expect(text).toContain('Question novelty: Answer novelty\nQuestion owner: Answer owner');
    expect(text).toContain('Top 5 questions for the vendor\n1. New?');
    expect(text).toContain('Data current through Nov 19, 2026. Sources: FDA and CMS public records. https://www.orthoparity.com/?k=K140881');
  });
});
