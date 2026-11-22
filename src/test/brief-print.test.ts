import { describe, expect, it, vi } from 'vitest';
import { briefFileName, printBrief, printQuestionGroups, summaryQuestionCount } from '@/lib/brief-print';
import type { DecisionCard } from '@/lib/signals';

const card = (key: string, short: string, asks: string[]): DecisionCard => ({ key, short, asks, question: key, badge: 'None', finding: '', why: '', ask: asks[0] ?? '', evidence: key, tone: 'attention' });

describe('native brief printing', () => {
  it('keeps the first five questions when they fit', () => {
    expect(summaryQuestionCount([20, 20, 20, 20, 20, 20], 100)).toBe(5);
  });
  it('drops questions four and five first when space runs out', () => {
    expect(summaryQuestionCount([20, 20, 20, 20, 20], 99)).toBe(3);
  });
  it('names product and company PDFs without changing source names', () => {
    expect(briefFileName('Smith and Nephew Suture Anchors', 'K151105')).toBe('OrthoParity brief - K151105 - Smith and Nephew Suture Anchors');
    expect(briefFileName('Smith+Nephew')).toBe('OrthoParity brief - Smith+Nephew');
  });
  it('formats the PFN product name in the PDF filename', () => {
    expect(briefFileName('PROXIMAL FEMORAL NAIL (PFN) SYSTEM', 'K970097')).toBe('OrthoParity brief - K970097 - Proximal Femoral Nail (PFN) System');
  });
  it('waits for fonts before calling native print', async () => {
    let finishFonts: (() => void) | undefined;
    const ready = new Promise<void>(resolve => { finishFonts = resolve; });
    const print = vi.fn();
    vi.stubGlobal('document', { fonts: { ready } });
    vi.stubGlobal('window', { print });
    try {
      const pending = printBrief();
      expect(print).not.toHaveBeenCalled();
      finishFonts?.();
      await pending;
      expect(print).toHaveBeenCalledTimes(1);
    } finally { vi.unstubAllGlobals(); }
  });
  it('keeps every worksheet question in order with continuous numbering', () => {
    const cards = [card('novelty', 'New', ['First?', 'Second?']), card('owner', 'Owner', ['Third?'])];
    const groups = printQuestionGroups(cards, ['First?', 'Second?', 'Third?']);
    expect(groups.map(g => [g.label, g.start])).toEqual([['New', 1], ['Owner', 3]]);
    expect(groups.flatMap(g => g.questions)).toEqual(['First?', 'Second?', 'Third?']);
  });
  it('preserves additional questions and the legacy single-question fallback', () => {
    const single = { ...card('owner', 'Owner', []), ask: 'Who owns it?' };
    const groups = printQuestionGroups([single], ['Who owns it?', 'Additional question?']);
    expect(groups.map(g => g.start)).toEqual([1, 2]);
    expect(groups.flatMap(g => g.questions)).toEqual(['Who owns it?', 'Additional question?']);
  });
});