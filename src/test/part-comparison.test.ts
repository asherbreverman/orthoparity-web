import { describe, expect, it } from 'vitest';
import { duplicatePartCompanyNotes, parsePartList, partCsv, partPriceKey } from '@/lib/part-comparison';
import type { PartMatch } from '@/lib/predicate-data';

const row = (part_number: string, number: string, company: string): PartMatch => ({ part_number, number, company, match: 'exact', brand: null, in_distribution: true, device_name: 'Tibial insert', vendor_id: null });

describe('part comparison', () => {
  it('ignores spaces and dashes and removes formatting-only duplicates', () => {
    expect(parsePartList('213-65-05\n2136505\n525 1300\n525-1300')).toEqual(['213-65-05', '525 1300']);
  });

  it('caps a pasted list at 50', () => expect(parsePartList(Array.from({ length: 55 }, (_, i) => `PART-${i}`).join('\n'))).toHaveLength(50));

  it('keys prices by normalized part and FDA number', () => expect(partPriceKey(row('213-65-05', 'K011976', 'Advita'))).toBe('2136505@K011976'));

  it('warns only when one catalog number crosses companies', () => {
    expect(duplicatePartCompanyNotes([row('5251300', 'K1', 'Nuvasive'), row('5251300', 'K2', 'Medtronic'), row('213-65-05', 'K3', 'Advita')])).toEqual(["One catalog number, 2 companies. Catalog numbers are unique within a company's labeling, not across companies, so confirm the company with the vendor."]);
  });

  it('adds a row-specific Your price column to CSV', () => {
    const item = row('213-65-05', 'K011976', 'Advita');
    const csv = partCsv([item], { [partPriceKey(item)]: '1250.50' }, 'Nov 24, 2026');
    expect(csv.split('\n')[1]).toBe('Part number,Match,FDA number,Product,Company,Brand,In distribution,Your price,on_site,fda_number_note,product_code,product_code_name,device_ids,units_per_package,sterile,mri_safety');
    expect(csv.split('\n')[2]?.startsWith('213-65-05,exact,K011976,Tibial insert,Advita,NOT FOUND,Yes,1250.50,')).toBe(true);
  });
});
