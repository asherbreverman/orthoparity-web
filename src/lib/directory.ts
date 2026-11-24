import { csvCell } from './reviewer-export';
import { companyName } from './format';

export interface DirectoryProcedure { family_id: string; name: string; role?: string }
export interface DirectoryCode { product_code: string; plain_name: string | null; fda_name: string | null; device_class: string | number | null; anatomy: string | null; kind: string | null; products: number; approvals: number; companies: number; companies_last5: number; listed_in_distribution: number; latest: string | null; procedures: DirectoryProcedure[] | null }
export interface DirectorySegment { segment: string; product_codes: number; products: number; companies: number; codes: DirectoryCode[] }
export interface DirectoryIndex { segments: DirectorySegment[]; totals: { products: number; product_codes: number; companies: number; data_end: string; no_product_code: number }; note: string; source: string }
export interface DirectoryCompany { owner_id: string; owner_name: string; products: number; last5: number; listed_in_distribution: number; first: string | null; latest: string | null }
export interface DirectoryRow { number: string; pathway: string; product: string | null; device_name: string | null; filer: string | null; owner_id: string | null; owner_name: string | null; decision_date: string | null; gudid_brand: string | null; gudid_devices: number; gudid_in_distribution: number }
export interface DirectoryFound { found: true; product_code: { product_code: string; fda_name: string | null; regulation_number: string | null; device_class: string | number | null; fda_definition: string | null; plain_name: string | null; plain_description: string | null; anatomy: string | null; procedures: unknown; kind: string | null; segment: string | null }; procedures: DirectoryProcedure[] | null; totals: { products: number; clearances: number; approvals: number; companies: number; companies_last5: number; listed_in_distribution: number; no_gudid: number; first: string | null; latest: string | null; data_end: string | null }; companies: DirectoryCompany[]; rows: DirectoryRow[]; notes: string[] | null; source: string }
export type DirectoryDetail = DirectoryFound | { found: false; note: string };

export const DIRECTORY_PAGE_SIZE = 100;
export type SortState<K extends string> = { col: K; dir: 1 | -1 };

/** Numbers compare numerically, text and ISO dates as text; empty values sort last either way. */
export function sortRows<T, K extends string>(rows: T[], sort: SortState<K>, value: (row: T, col: K) => string | number | null | undefined): T[] {
  return [...rows].sort((a, b) => {
    const x = value(a, sort.col), y = value(b, sort.col);
    if (x == null || x === '') return y == null || y === '' ? 0 : 1;
    if (y == null || y === '') return -1;
    const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'en', { numeric: true, sensitivity: 'base' });
    return c * sort.dir;
  });
}
const has = (q: string, ...values: (string | null | undefined)[]) => values.some(v => v?.toLowerCase().includes(q));
export function filterCodes(codes: DirectoryCode[], query: string) {
  const q = query.trim().toLowerCase();
  return q ? codes.filter(c => has(q, c.product_code, c.plain_name, c.fda_name)) : codes;
}
export function filterRows(rows: DirectoryRow[], query: string) {
  const q = query.trim().toLowerCase();
  return q ? rows.filter(r => has(q, r.number, r.product, r.device_name, r.filer, r.owner_name, r.gudid_brand)) : rows;
}
export function pageOf<T>(rows: T[], page: number) {
  const pages = Math.max(1, Math.ceil(rows.length / DIRECTORY_PAGE_SIZE));
  const current = Math.min(Math.max(page, 1), pages);
  return { pages, current, rows: rows.slice((current - 1) * DIRECTORY_PAGE_SIZE, current * DIRECTORY_PAGE_SIZE) };
}
/** Owner today is shown only when it is a different company from the printed filer. */
export function ownerDiffers(row: Pick<DirectoryRow, 'filer' | 'owner_name'>) {
  if (!row.owner_name) return false;
  return companyName(row.filer ?? '').toLowerCase() !== companyName(row.owner_name).toLowerCase();
}
export function distributionText(row: Pick<DirectoryRow, 'gudid_devices' | 'gudid_in_distribution'>) {
  return row.gudid_in_distribution > 0 ? `${row.gudid_in_distribution.toLocaleString('en-US')} of ${row.gudid_devices.toLocaleString('en-US')} device IDs` : 'None listed';
}
export function directoryCsv(code: string, plainName: string, rows: DirectoryRow[], generated: string) {
  const fields = ['number', 'pathway', 'product', 'device_name', 'filer', 'owner', 'decision_date', 'gudid_brand', 'gudid_devices', 'gudid_in_distribution'];
  return [`OrthoParity category directory, ${code} ${plainName}, generated ${generated} from public FDA data. A listing is a regulatory fact, not a ranking.`, fields.join(','),
    ...rows.map(r => [r.number, r.pathway, r.product, r.device_name, r.filer, r.owner_name, r.decision_date, r.gudid_brand, r.gudid_devices, r.gudid_in_distribution].map(csvCell).join(','))].join('\n') + '\n';
}
export function directoryCsvName(code: string, date: Date) { return `orthoparity-${code}-${date.toISOString().slice(0, 10)}.csv`; }
export function directoryTitle(detail: DirectoryDetail | undefined, code: string) {
  return detail?.found ? `${detail.product_code.plain_name ?? detail.product_code.fda_name ?? code} (${detail.product_code.product_code}): every FDA record` : 'Category not found';
}
