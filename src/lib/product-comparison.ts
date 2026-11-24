import type { DecisionCard } from './signals';

const questionOrder = ['novelty', 'indications', 'owner', 'alternatives', 'payments', 'evidence', 'catalog', 'recalls', 'adverse_events', 'supplier', 'medicare', 'add_on'];
export function productComparisonRows(a: DecisionCard[], b: DecisionCard[]) {
  return [...new Set([...questionOrder, ...a.map(c => c.key), ...b.map(c => c.key)])].flatMap(key => {
    const left = a.find(c => c.key === key);
    const right = b.find(c => c.key === key);
    return left || right ? [{ key, question: left?.question ?? right?.question ?? '', a: left?.badge ?? 'NOT FOUND', b: right?.badge ?? 'NOT FOUND' }] : [];
  });
}

export function headerOwnerChanged(filer: string, owner: string): boolean {
  const normalize = (name: string) => name.toLowerCase().replace(/[&+]/g, ' and ').replace(/\b(incorporated|inc|corporation|corp|limited|ltd|llc|plc)\b/g, '').replace(/[^a-z0-9]/g, '');
  return !!filer && !!owner && normalize(filer) !== normalize(owner);
}
import { normalizeDeviceNumber as normalizeCompareNumber } from './fda-device';

export const maxCompareProducts = 50;

/** Parse the compare URL value: normalize, drop duplicates and the main product, keep at most 49. */
export function parseCompareList(raw: string | undefined, main: string): string[] {
  const out: string[] = [];
  for (const part of (raw ?? '').split(',')) {
    const n = normalizeCompareNumber(part.trim());
    if (n && n !== main && !out.includes(n)) out.push(n);
  }
  return out.slice(0, maxCompareProducts - 1);
}

/** Product-compare heading: first three names, then "and N more". */
export function compareHeading(names: string[]): string {
  if (names.length <= 3) return names.length < 3 ? names.join(' and ') : `${names[0]}, ${names[1]} and ${names[2]}`;
  return `${names.slice(0, 3).join(', ')} and ${names.length - 3} more`;
}

/** Run tasks with at most `limit` in flight, reporting each settled result. */
export async function runLimited<T>(items: string[], limit: number, task: (item: string) => Promise<T>, onSettled: (item: string, result: T | null) => void): Promise<void> {
  let next = 0;
  const worker = async () => { while (next < items.length) { const item = items[next++] as string; let result: T | null = null; try { result = await task(item); } catch { result = null; } onSettled(item, result); } };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

const csvCell = (value: string | number) => { const s = String(value); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export interface CompareCsvRow { number: string; product: string; company: string; decision: string; code: string; badges: Record<string, string> }
export function compareCsv(rows: CompareCsvRow[], columns: { key: string; label: string }[], generated: string): string {
  const lines = [`OrthoParity product comparison, generated ${generated} from public FDA and CMS data. Badges are facts, not verdicts.`,
    ['Number', 'Product', 'Company', 'FDA decision date', 'Product code', ...columns.map(c => c.label)].map(csvCell).join(','),
    ...rows.map(r => [r.number, r.product, r.company, r.decision, r.code, ...columns.map(c => r.badges[c.key] ?? 'NOT FOUND')].map(csvCell).join(','))];
  return lines.join('\n') + '\n';
}
export function compareCsvName(date: Date) { return `orthoparity-compare-${date.toISOString().slice(0, 10)}.csv`; }

/** Question columns in the fixed product-page order, labelled by each card's short label. */
export function compareColumns(cardSets: DecisionCard[][]): { key: string; label: string }[] {
  const keys = [...new Set([...questionOrder, ...cardSets.flatMap(cards => cards.map(c => c.key))])];
  return keys.flatMap(key => { const card = cardSets.flatMap(c => c).find(c => c.key === key); return card ? [{ key, label: card.short ?? card.question }] : []; });
}

export function noCodeNote(count: number, company: string) { return `${count} ${company} ${count === 1 ? 'product has' : 'products have'} no FDA product code on file, so ${count === 1 ? "it isn't" : "they aren't"} in these lists.`; }
