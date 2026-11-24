import type { DecisionCard } from './signals';

const priority = [['novelty'], ['alternatives'], ['payments'], ['catalog'], ['medicare', 'procedures']];

export function firstVendorQuestion(card: DecisionCard) {
  return (card.asks?.length ? card.asks : [card.ask]).find(question => question.trim()) ?? '';
}

/** The requested five, selected by card identity rather than display position. */
export function topVendorQuestions(cards: DecisionCard[]) {
  return priority.map(keys => cards.find(card => keys.includes(card.key))).filter(card => card !== undefined).map(firstVendorQuestion).filter(Boolean);
}

export function vacSummaryText({ name, number, owner, decisionDate, bottomLine, cards, dataThrough, url }: {
  name: string; number: string; owner: string; decisionDate: string; bottomLine: string; cards: DecisionCard[]; dataThrough: string; url: string;
}) {
  const top = topVendorQuestions(cards);
  return [
    `${name} · ${number}`,
    `Owner today: ${owner}`,
    `Decision date: ${decisionDate}`,
    `Bottom line: ${bottomLine}`,
    '',
    ...cards.map(card => `${card.question}: ${card.badge}`),
    '',
    'Top 5 questions for the vendor',
    ...top.map((question, index) => `${index + 1}. ${question}`),
    '',
    `Data current through ${dataThrough}. Sources: FDA and CMS public records. ${url}`,
  ].join('\n');
}
