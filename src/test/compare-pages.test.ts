import { describe, expect, it } from 'vitest';
import { compareCsv, compareCsvName, compareHeading, compareTabTitle, companyComparisonSummary, identicalAcross, noCodeNote, parseCompareList, partitionCompareColumns, runLimited } from '@/lib/product-comparison';

describe('compare list', () => {
  it('normalizes, drops duplicates and the main product', () => {
    expect(parseCompareList('k250477, K250477,K171651,K 193210', 'K171651')).toEqual(['K250477', 'K193210']);
  });
  it('keeps old single-number links', () => { expect(parseCompareList('K250477', 'K171651')).toEqual(['K250477']); });
  it('caps at 49 others (50 products)', () => {
    const many = Array.from({ length: 60 }, (_, i) => `K${String(100000 + i)}`).join(',');
    expect(parseCompareList(many, 'K171651')).toHaveLength(49);
  });
});

describe('compare heading', () => {
  it('names the first three then "and N more"', () => { expect(compareHeading(['A', 'B', 'C', 'D', 'E'])).toBe('A, B, C and 2 more'); });
  it('joins two names', () => { expect(compareHeading(['A', 'B'])).toBe('A and B'); });
  it('prefixes browser titles and uses both for exactly two products', () => {
    expect(compareTabTitle(['First product', 'Second product', 'Third product', 'Fourth product'])).toBe('Compare: First product, Second product, Third product and 1 more | OrthoParity');
    expect(identicalAcross(2)).toBe('identical across both');
    expect(identicalAcross(3)).toBe('identical across all 3');
  });
});

describe('compare CSV', () => {
  it('starts with the disclaimer line and uses short labels', () => {
    const csv = compareCsv([{ number: 'K1', product: 'Cage, lumbar', price: '1250', company: 'Globus', decision: 'Jan 1, 2024', code: 'MAX', badges: { recalls: 'None' } }], [{ key: 'recalls', label: 'Recalls' }], 'Nov 24, 2026');
    const lines = csv.split('\n');
    expect(lines[0]).toBe('OrthoParity product comparison, generated Nov 24, 2026 from public FDA and CMS data. Badges are facts, not verdicts.');
    expect(lines[1]).toBe('Number,Product,Your price,Company,FDA decision date,Product code,Recalls');
    expect(lines[2]).toBe('K1,"Cage, lumbar",1250,Globus,"Jan 1, 2024",MAX,None');
  });
  it('names the file by date', () => { expect(compareCsvName(new Date('2026-11-24T12:00:00Z'))).toBe('orthoparity-compare-2026-11-24.csv'); });
});

describe('no product code note', () => {
  it('uses the singular for one product', () => { expect(noCodeNote(1, 'Alphatec Spine')).toBe("1 Alphatec Spine product has no FDA product code on file, so it isn't in these lists."); });
});

describe('difference filtering', () => {
  it('keeps only question columns whose values differ', () => {
    const rows = [
      { number: 'K1', product: 'A', price: '', company: '', decision: '', code: '', badges: { owner: 'Same company', recalls: '1 recall' } },
      { number: 'K2', product: 'B', price: '', company: '', decision: '', code: '', badges: { owner: 'Same company', recalls: 'None' } },
    ];
    const columns = [{ key: 'owner', label: 'Owner' }, { key: 'recalls', label: 'Recalls' }];
    expect(partitionCompareColumns(rows, columns)).toEqual({ differing: [columns[1]], identical: [columns[0]] });
  });
});

describe('company summary', () => {
  it('starts with FDA records, not sales', () => expect(companyComparisonSummary('They overlap in 24 product codes.')).toBe('By FDA records, not sales: they overlap in 24 product codes.'));
});

describe('request limit', () => {
  it('keeps at most 6 requests in flight', async () => {
    let live = 0, peak = 0; const seen: string[] = [];
    await runLimited(Array.from({ length: 20 }, (_, i) => String(i)), 6, async () => { live++; peak = Math.max(peak, live); await new Promise(r => setTimeout(r, 5)); live--; return 1; }, n => seen.push(n));
    expect(peak).toBe(6); expect(seen).toHaveLength(20);
  });
});
