import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { partAttr, partFdaLink, partLeadLine } from '@/lib/part-comparison';
import { parseCompareIds } from '@/lib/research-groups';
import { ascRangeText, ascTooltip } from '@/lib/procedure-data';
import type { PartMatch } from '@/lib/predicate-data';

const base: PartMatch = { part_number: '14-589508', match: 'exact', number: null, brand: 'POLARIS', in_distribution: true, device_name: null, company: 'BIOMET SPINE LLC', vendor_id: null, on_site: false, fda_number_note: 'FDA number NOT FOUND in GUDID.', product_code: 'KWP', product_code_name: 'Posterior spinal hook', device_ids: 1, units_per_package: 1, sterile: null, mri_safety: null };

describe('part rows', () => {
  it('number null gives NOT FOUND, never a brief link', () => { expect(partFdaLink(base)).toEqual({ kind: 'none' }); });
  it('on_site false with a K number links to the FDA record', () => {
    expect(partFdaLink({ number: 'K123456', on_site: false })).toEqual({ kind: 'fda', number: 'K123456', url: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=K123456' });
    expect(partFdaLink({ number: 'P010001', on_site: false })).toMatchObject({ url: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpma/pma.cfm?id=P010001' });
  });
  it('on_site true keeps the brief link', () => { expect(partFdaLink({ number: 'K140881', on_site: true }).kind).toBe('site'); });
  it('units and sterile say Differs only across several device IDs', () => {
    expect(partAttr(null, 3)).toBe('Differs'); expect(partAttr(null, 1)).toBe('NOT FOUND'); expect(partAttr(null, 3, false)).toBe('NOT FOUND'); expect(partAttr(2, 3)).toBe('2');
  });
  it('lead line adds the no-number and outside counts', () => {
    expect(partLeadLine(3, { shown: 3, on_site: 0, other_fda_number: 0, fda_number_not_found: 3 })).toBe("3 matches in FDA's GUDID. 3 list no FDA number.");
    expect(partLeadLine(5, { shown: 5, on_site: 3, other_fda_number: 2, fda_number_not_found: 0 })).toBe("5 matches in FDA's GUDID. 2 list an FDA number outside OrthoParity's orthopedic set.");
  });
  it('renders the note and NOT FOUND badge for a row with no FDA number', async () => {
    const { PartFdaCell } = await import('@/components/part-results');
    const { container } = render(<PartFdaCell row={base} />);
    expect(container.textContent).toBe('NOT FOUND');
    expect(container.querySelector('a')).toBeNull();
  });
});

describe('compare list', () => {
  it('keeps order', () => { expect(parseCompareIds('b,c,d', 'a')).toEqual(['b', 'c', 'd']); });
  it('allows at most 4 extra companies', () => { expect(parseCompareIds('b,c,d,e,f,g', 'a')).toEqual(['b', 'c', 'd', 'e']); });
  it('drops duplicates and the primary company', () => { expect(parseCompareIds('b,a,b, ,c', 'a')).toEqual(['b', 'c']); });
});

describe('ASC column', () => {
  const asc = (low: number, high: number) => ({ low, high, year: 2027, codes: [{ cpt: '27447', procedure: 'Total knee replacement', asc_rate: 9753.2, device_portion: 6088.4, status: 'On the ASC list' }] });
  it('shows a range', () => { expect(ascRangeText(asc(9753.2, 10049.4))).toBe('$9,753 to $10,049'); });
  it('shows one figure when equal', () => { expect(ascRangeText(asc(5341.66, 5341.66))).toBe('$5,342'); });
  it('returns null when not loaded', () => { expect(ascRangeText(null)).toBeNull(); });
  it('lists each code in the tooltip', () => { expect(ascTooltip(asc(1, 2))).toBe('27447 Total knee replacement $9,753 (device portion $6,088)'); });
});
