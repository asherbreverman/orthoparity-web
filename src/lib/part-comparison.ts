import type { PartCounts, PartMatch } from './predicate-data';
import { maxCompareProducts } from './product-comparison';
import type { PrivatePrices } from './private-prices';

export function normalizePartNumber(value: string) {
  return value.replace(/[\s-]/g, '').toUpperCase();
}

/** One per line, comma or semicolon; formatting-only duplicates count once. */
export function parsePartList(value: string) {
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const raw of value.split(/[\n,;]+/)) {
    const part = raw.trim();
    const key = normalizePartNumber(part);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    parts.push(part);
    if (parts.length === maxCompareProducts) break;
  }
  return parts;
}

export function partPriceKey(row: Pick<PartMatch, 'part_number' | 'number'>) {
  return `${normalizePartNumber(row.part_number)}@${(row.number ?? 'NONE').toUpperCase()}`;
}

export function duplicatePartCompanyNotes(rows: PartMatch[]) {
  const companies = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!row.company) continue;
    const key = normalizePartNumber(row.part_number);
    const names = companies.get(key) ?? new Set<string>();
    names.add(row.company);
    companies.set(key, names);
  }
  return [...companies.values()].filter(names => names.size > 1).map(names => `One catalog number, ${names.size} companies. Catalog numbers are unique within a company's labeling, not across companies, so confirm the company with the vendor.`);
}

const csvCell = (value: string | number) => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** How the FDA number cell renders: on-site brief link, outside FDA record link, or NOT FOUND. */
export function partFdaLink(row: Pick<PartMatch, 'number' | 'on_site'>): { kind: 'site'; number: string } | { kind: 'fda'; number: string; url: string } | { kind: 'none' } {
  if (!row.number) return { kind: 'none' };
  if (row.on_site !== false) return { kind: 'site', number: row.number };
  const n = row.number.toUpperCase();
  const url = n.startsWith('P') ? `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpma/pma.cfm?id=${encodeURIComponent(n)}` : `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=${encodeURIComponent(n)}`;
  return { kind: 'fda', number: row.number, url };
}
/** Units and sterile show "Differs" when several device IDs disagree; MRI safety never does. */
export function partAttr(value: string | number | null | undefined, deviceIds: number | null | undefined, canDiffer = true) {
  if (value !== null && value !== undefined && value !== '') return String(value);
  return canDiffer && (deviceIds ?? 0) > 1 ? 'Differs' : 'NOT FOUND';
}
export function partProductName(row: Pick<PartMatch, 'device_name' | 'product_code_name'>) { return row.device_name ?? row.product_code_name ?? null; }
export function partLeadLine(shown: number, counts: PartCounts | null) {
  let text = `${shown.toLocaleString('en-US')} ${shown === 1 ? 'match' : 'matches'} in FDA's GUDID.`;
  if (counts?.fda_number_not_found) text += ` ${counts.fda_number_not_found.toLocaleString('en-US')} list no FDA number.`;
  if (counts?.other_fda_number) text += ` ${counts.other_fda_number.toLocaleString('en-US')} list an FDA number outside OrthoParity's orthopedic set.`;
  return text;
}

export function partCsv(rows: PartMatch[], prices: PrivatePrices, generated: string) {
  const lines = [
    `OrthoParity part lookup, generated ${generated} from public FDA GUDID data. Prices were entered in this browser.`,
    ['Part number', 'Match', 'FDA number', 'Product', 'Company', 'Brand', 'In distribution', 'Your price', 'on_site', 'fda_number_note', 'product_code', 'product_code_name', 'device_ids', 'units_per_package', 'sterile', 'mri_safety'].map(csvCell).join(','),
    ...rows.map(row => [row.part_number, row.match, row.number ?? 'NOT FOUND', partProductName(row) ?? 'NOT FOUND', row.company ?? 'NOT FOUND', row.brand ?? 'NOT FOUND', row.in_distribution === false ? 'No' : row.in_distribution ? 'Yes' : 'NOT FOUND', prices[partPriceKey(row)] ?? '', row.on_site === undefined ? '' : String(row.on_site), row.fda_number_note ?? '', row.product_code ?? '', row.product_code_name ?? '', row.device_ids ?? '', row.units_per_package ?? '', row.sterile ?? '', row.mri_safety ?? ''].map(csvCell).join(',')),
  ];
  return `${lines.join('\n')}\n`;
}

export function partCsvName(date: Date) {
  return `orthoparity-parts-${date.toISOString().slice(0, 10)}.csv`;
}
