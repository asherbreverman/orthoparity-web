import { describe, expect, it } from 'vitest';
import { headerOwnerChanged, productComparisonRows } from '@/lib/product-comparison';
import type { DecisionCard } from '@/lib/signals';
const card = (key: string, badge: string): DecisionCard => ({ key, badge, question: key, tone: 'attention', finding: '', why: '', ask: '', evidence: key });
describe('product comparison', () => {
  it('matches by key in the twelve-question order rather than response order', () => {
    const keys = ['novelty', 'indications', 'owner', 'alternatives', 'payments', 'evidence', 'catalog', 'recalls', 'adverse_events', 'supplier', 'medicare', 'add_on'];
    const rows = productComparisonRows(keys.map(k => card(k, `A ${k}`)), [...keys].reverse().map(k => card(k, `B ${k}`)));
    expect(rows.map(r => r.key)).toEqual(keys);
    expect(rows.map(r => [r.a, r.b])).toEqual(keys.map(k => [`A ${k}`, `B ${k}`]));
  });
  it('shows NOT FOUND for a missing card on either side', () => expect(productComparisonRows([card('novelty', 'Line extension')], [card('recalls', '1 recall')])).toEqual([{key:'novelty', question:'novelty', a:'Line extension', b:'NOT FOUND'}, {key:'recalls', question:'recalls', a:'NOT FOUND', b:'1 recall'}]));
  it('shows the renamed shoulder owner in the header', () => expect(headerOwnerChanged('Exactech, Inc.', 'Advita Ortho')).toBe(true));
  it('does not treat company punctuation as an ownership change', () => expect(headerOwnerChanged('Smith & Nephew, Inc.', 'Smith+Nephew')).toBe(false));
});