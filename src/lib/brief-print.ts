import type { DecisionCard } from './signals';

/** Keep the browser's native Save as PDF flow, after its fonts have settled. */
export async function printBrief(mode: 'full' | 'summary' = 'full') {
  await document.fonts.ready;
  if (mode === 'summary') document.documentElement.dataset['briefMode'] = 'summary';
  else if (document.documentElement) delete document.documentElement.dataset['briefMode'];
  window.print();
}

/** Keep five questions when they fit; omit questions four and five first. */
export function summaryQuestionCount(heights: number[], available: number): number {
  const firstFive = heights.slice(0, 5);
  return firstFive.reduce((total, height) => total + height, 0) <= available ? firstFive.length : Math.min(3, heights.length);
}

export function fitSummaryQuestions(summary: HTMLElement) {
  const questions = Array.from(summary.querySelectorAll<HTMLElement>('.summary-questions li'));
  questions.forEach(question => { question.hidden = false; });
  const list = summary.querySelector<HTMLElement>('.summary-questions');
  const footer = summary.querySelector<HTMLElement>('footer');
  if (!list || !footer) return;
  const heights = questions.map(question => question.getBoundingClientRect().height + parseFloat(getComputedStyle(question).marginBottom || '0'));
  const available = 9.85 * 96 - (list.getBoundingClientRect().top - summary.getBoundingClientRect().top) - footer.getBoundingClientRect().height - 24;
  const count = summaryQuestionCount(heights, available);
  questions.forEach((question, index) => { question.hidden = index >= count; });
}

export function briefFileName(name: string, knumber?: string) {
  return `OrthoParity brief - ${knumber ? `${knumber} - ` : ''}${name}`;
}

/** Group the existing question list without changing its wording or numbering. */
export function printQuestionGroups(cards: DecisionCard[], questions: string[]) {
  let offset = 0;
  const groups = cards.map((card, index) => {
    const count = (card.asks?.length ? card.asks : [card.ask]).filter(Boolean).length;
    const group = { label: card.short ?? card.question, index, start: offset + 1, questions: questions.slice(offset, offset + count) };
    offset += count;
    return group;
  }).filter(group => group.questions.length > 0);
  if (offset < questions.length) groups.push({ label: 'Questions for the vendor', index: cards.length, start: offset + 1, questions: questions.slice(offset) });
  return groups;
}