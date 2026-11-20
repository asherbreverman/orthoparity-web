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