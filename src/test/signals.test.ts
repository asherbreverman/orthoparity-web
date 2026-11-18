import { describe, expect, it } from 'vitest';
import { money } from '@/lib/vendor-data';
import { toneClass, positionClass, longDate, evidenceIsOpen, brandsOutOfDistribution } from '@/lib/signals';
describe('decision brief rules', () => {
  it('formats money as $32.0M, $722K, $6.9K, $137', () => { expect(money(32_000_000)).toBe('$32.0M'); expect(money(722_000)).toBe('$722K'); expect(money(6_900)).toBe('$6.9K'); expect(money(137.4)).toBe('$137'); });
  it('never shows $0.00', () => { expect(money(0)).toBe('None'); expect(money(null)).toBe('None'); });
  it('uses amber only for attention, neutral otherwise', () => { expect(toneClass('attention')).toBe('tone-attention'); expect(toneClass('info')).toBe('tone-info'); expect(toneClass('anything')).toBe('tone-info'); });
  it('maps competition positions to pills', () => { expect(positionClass('Top 3')).toBe('position-top'); expect(positionClass('Active')).toBe('position-active'); expect(positionClass('No recent clearances')).toBe('position-quiet'); });
  it('formats cleared dates as Mon D, YYYY', () => { expect(longDate('2025-12-22')).toBe('Dec 22, 2025'); expect(longDate(null)).toBe('—'); });
  it('analyst view opens every evidence section; brief view only opened ones', () => { expect(evidenceIsOpen('analyst', new Set(), 'payments')).toBe(true); expect(evidenceIsOpen('brief', new Set(), 'payments')).toBe(false); expect(evidenceIsOpen('brief', new Set(['payments']), 'payments')).toBe(true); });
  it('lists brands with devices but none in distribution', () => { expect(brandsOutOfDistribution([{ gudid_brand: 'A', gudid_devices: 3, gudid_in_distribution: 0 }, { gudid_brand: 'A', gudid_devices: 2, gudid_in_distribution: 0 }, { gudid_brand: 'B', gudid_devices: 4, gudid_in_distribution: 1 }, { gudid_brand: null, gudid_devices: 1 }])).toEqual([{ brand: 'A', devices: 5 }]); });
});
