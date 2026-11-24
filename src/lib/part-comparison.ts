import type { PartMatch } from './predicate-data';
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
  return `${normalizePartNumber(row.part_number)}@${row.number.toUpperCase()}`;
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

export function partCsv(rows: PartMatch[], prices: PrivatePrices, generated: string) {
  const lines = [
    `OrthoParity part lookup, generated ${generated} from public FDA GUDID data. Prices were entered in this browser.`,
    ['Part number', 'Match', 'FDA number', 'Product', 'Company', 'Brand', 'In distribution', 'Your price'].map(csvCell).join(','),
    ...rows.map(row => [row.part_number, row.match, row.number, row.device_name ?? 'NOT FOUND', row.company ?? 'NOT FOUND', row.brand ?? 'NOT FOUND', row.in_distribution === false ? 'No' : row.in_distribution ? 'Yes' : 'NOT FOUND', prices[partPriceKey(row)] ?? ''].map(csvCell).join(',')),
  ];
  return `${lines.join('\n')}\n`;
}

export function partCsvName(date: Date) {
  return `orthoparity-parts-${date.toISOString().slice(0, 10)}.csv`;
}
