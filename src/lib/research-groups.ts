// Browser-safe types and pure helpers for grouped search, establishment sites and multi-company compare.
export interface GroupItem { number: string; device_name: string | null; filer: string | null; decision_date: string | null; product_code: string | null }
export interface SearchGroup { label: string; kind: 'brand' | 'owner'; owner_id: string | null; owner_name: string | null; records: number; first: string | null; latest: string | null; product_codes: string[]; filed_as: { name: string; records: number }[]; gudid_brands: string[] | null; gudid_brand_count: number; items: GroupItem[] }
export interface InsideWordGroup { label: string; records: number; by_owner: { owner_id: string; owner_name: string; records: number }[]; items: GroupItem[] }
export interface SearchGroups { total: number; whole_word: number; inside_word: number; note: string | null; groups: SearchGroup[]; inside_word_group: InsideWordGroup | null; notes: string[] }

export interface CodeSites { sites: number; countries: number; making_sites: number; records_under_code: number; records_with_a_site: number; by_country: { country: string; country_code: string; sites: number; making_sites: number }[]; notes: string[] }

export interface ManyVendorPayments { year: number; total: number | null; recipients: number | null; physicians: number | null; median_per_recipient: number | null; royalty_r: number | null; consulting_r: number | null }
export interface ManyVendor { vendor_id: string; display_name: string; product_codes: number; records: number; no_code: number; payments: ManyVendorPayments | null; payment_mix: { nature_group: string; amount: number }[] | null }
export interface ManyCode { product_code: string; plain_name: string | null; fda_name: string | null; anatomy: string | null; kind: string | null; held_by: number; counts: Record<string, number> }
export interface VendorCompareMany { found: boolean; note?: string | null; summary: string | null; vendors: ManyVendor[]; codes: ManyCode[]; codes_held_by_all: number; codes_held_by_some: number; codes_held_by_one: number; payments_year: number | null; payments_note: string | null; shared_recipients: { all_years: number | null; definition: string } | null; notes: string[] }

export const maxExtraCompanies = 4;

/** compare=b,c,d: comma-separated vendor IDs in order, deduplicated, never the primary company, at most 4. */
export function parseCompareIds(compare: string, primary = '') {
  const seen = new Set<string>(primary ? [primary] : []);
  const out: string[] = [];
  for (const raw of compare.split(',')) {
    const id = raw.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id); out.push(id);
    if (out.length === maxExtraCompanies) break;
  }
  return out;
}

export type HeldFilter = 'all' | 'every' | 'some' | 'one';
export function filterHeld(codes: ManyCode[], filter: HeldFilter, companies: number) {
  if (filter === 'every') return codes.filter(c => c.held_by === companies);
  if (filter === 'one') return codes.filter(c => c.held_by === 1);
  if (filter === 'some') return codes.filter(c => c.held_by > 1 && c.held_by < companies);
  return codes;
}

/** "Filed as Zimmer (27), Zimmer Biomet (2)". */
export function filedAsText(list: { name: string; records: number }[]) {
  return list.length ? `Filed as ${list.map(f => `${f.name} (${f.records})`).join(', ')}` : '';
}
export function gudidBrandText(group: Pick<SearchGroup, 'gudid_brands' | 'gudid_brand_count'>) {
  return group.gudid_brands?.length ? `GUDID lists it under ${group.gudid_brand_count} brand names (${group.gudid_brands.slice(0, 4).join(', ')})` : '';
}
export function groupSummary(q: string, d: Pick<SearchGroups, 'total' | 'whole_word' | 'inside_word'>) {
  if (!d.total) return `No FDA records name "${q}".`;
  return `${d.whole_word.toLocaleString('en-US')} FDA records name "${q}", grouped by brand and today's parent company.${d.inside_word > 0 ? ` ${d.inside_word.toLocaleString('en-US')} more contain it inside another word.` : ''}`;
}

export function vendorCompareCsv(codes: ManyCode[], vendors: ManyVendor[], generated: string) {
  const cell = (v: string | number) => { const t = String(v); return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
  return [
    `OrthoParity company comparison, generated ${generated} from public FDA records. Counts are FDA records, not sales.`,
    ['Product code', 'Product', ...vendors.map(v => v.display_name), 'Held by'].map(cell).join(','),
    ...codes.map(c => [c.product_code, c.plain_name ?? c.fda_name ?? '', ...vendors.map(v => c.counts[v.vendor_id] ?? 0), c.held_by].map(cell).join(',')),
  ].join('\n') + '\n';
}
