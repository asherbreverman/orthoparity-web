export interface Device {
  knumber: string; device_name: string | null; applicant: string | null;
  decision_date: string | null; decision_year: string | number | null;
  product_code: string | null; regulation_number: string | null;
  device_class: string | number | null; review_panel?: string | null;
  summary_url: string | null; stop_reason: string | null;
}
export interface ProductCode {
  product_code: string; plain_name?: string | null; fda_name?: string | null;
  plain_description?: string | null; anatomy?: string | null; procedures?: string | null;
  reviewed?: boolean; regulation_number?: string | null;
}
export interface DirectPredicate {
  predicate: string; device_name: string | null; applicant: string | null;
  decision_year: string | number | null; role: string; confidence: string;
  review_source: string; number_as_printed: string | null; same_company: boolean; same_code: boolean;
}
export interface LineageStep {
  generation: number; knumber: string; device_name: string | null; applicant: string | null;
  decision_year: string | number | null; stop: string | null;
}
export interface Peer extends Omit<DirectPredicate, 'predicate' | 'role' | 'confidence' | 'review_source' | 'number_as_printed'> {
  knumber: string; product_code: string | null; shared: string[]; n_shared: number;
}
export interface Brief {
  found: boolean; device: Device | null; product_code: ProductCode | null;
  ifu: { found?: boolean; ifu_text?: string | null; page?: string | number | null; source?: string } | null;
  pattern: string; direct_predicates: DirectPredicate[];
  lineage: { path: LineageStep[]; generations: number; oldest_year: number | null; ends_at: LineageStep | null; stopped_by_limit: boolean };
  peers: { total: number; other_companies: number; same_code: number; peers: Peer[] };
  category: { product_code: string; total: number; latest_year: number; last5_clearances: number; last5_companies: number;
    by_year: { year: number; n: number }[]; top_companies: { applicant: string; clearances: number; last5: number }[];
    top_companies_last5: { applicant: string; clearances: number }[] } | null;
  questions: string[];
}
export interface Comparison {
  a: Device | null; b: Device | null; same_product_code: boolean; same_company: boolean; verdict: string;
  direct_shared: (string | { knumber?: string; predicate?: string; device_name?: string })[];
  shared_ancestors: { knumber: string; gen_a: number; gen_b: number; device_name: string | null; applicant: string | null; decision_year: string | number | null }[];
  shared_count: number;
}
export interface BatchRow extends Omit<Device, 'decision_date' | 'device_class' | 'regulation_number'> {
  found: boolean; plain_name: string | null; pattern: string; direct_predicates: number; primary_predicate: string | null;
}
export function parseBatch(text: string) {
  return [...new Set(text.toUpperCase().match(/\b(?:K\d{6}|DEN\d{6})\b/g) ?? [])];
}
export function batchAllowed(numbers: string[]) { return numbers.length > 0 && numbers.length <= 50; }
export function unreviewedLow(row: Pick<DirectPredicate, 'confidence' | 'review_source'>) {
  return row.confidence === 'LOW' && row.review_source === 'parser';
}
export function filterPeers(rows: Peer[], other: boolean, sameCode: boolean) {
  return rows.filter(row => (!other || !row.same_company) && (!sameCode || row.same_code));
}
export function lineageSentence(lineage: Brief['lineage']) {
  return lineage.oldest_year
    ? `Builds on a primary predicate line going back to ${lineage.oldest_year} (${lineage.generations} generations).`
    : `Primary predicate line: ${lineage.generations} generations; earliest decision year is not available.`;
}
export function patternExplanation(pattern: string, stop: string | null) {
  switch (pattern) {
    case 'line extension': return "Cleared against the same company's own earlier devices.";
    case 'competitive entry': return "Cleared against other companies' devices.";
    case 'mixed': return "Cleared against both the company's own and other companies' devices.";
    default: return `No numbered predicate on file (${stop ?? 'stop reason not available'}).`;
  }
}