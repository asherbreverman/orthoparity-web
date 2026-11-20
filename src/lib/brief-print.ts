import type { DecisionCard } from './signals';

/** Keep the browser's native Save as PDF flow, after its fonts have settled. */
export async function printBrief() {
  await document.fonts.ready;
  window.print();
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