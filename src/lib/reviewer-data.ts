import { normalizeDeviceNumber, type DeviceApproval, type DevicePathway } from './fda-device';

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
  pathway?: DevicePathway;
  approval?: DeviceApproval | null;
  found: boolean; device: Device | null; product_code: ProductCode | null;
  ifu: { found?: boolean; ifu_text?: string | null; page?: string | number | null; source?: string } | null;
  pattern: string; direct_predicates: DirectPredicate[];
  lineage: { path: LineageStep[]; generations: number; oldest_year: number | null; ends_at: LineageStep | null; stopped_by_limit: boolean };
  peers: { total: number; other_companies: number; same_code: number; peers: Peer[] };
  category: { product_code: string; total: number; latest_year: number; last5_clearances: number; last5_companies: number;
    by_year: { year: number; n: number }[]; top_companies: { applicant: string; clearances: number; last5: number }[];
    top_companies_last5: { applicant: string; clearances: number }[] } | null;
  questions: string[];
  vac_questions?: { topic: string; question: string }[];
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
  const matches = text.match(/\b(?:DEN(?:[\s-]*\d){6}|[KPH](?:[\s-]*\d){6}|N(?:[\s-]*\d){4,5})\b(?![\s-]*\d)/gi) ?? [];
  return [...new Set(matches.map(normalizeDeviceNumber).filter((number): number is string => number !== null))];
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
export interface QuestionGroup { topic: string; items: { id: number; question: string }[] }
export function questionGroups(brief: Pick<Brief, 'questions' | 'vac_questions'>): QuestionGroup[] {
  const groups: QuestionGroup[] = [{ topic: 'Specific to this device', items: (brief.questions ?? []).map((question, id) => ({ id, question })) }];
  let id = groups[0]?.items.length ?? 0;
  for (const row of brief.vac_questions ?? []) {
    const last = groups.at(-1);
    if (last?.topic === row.topic) last.items.push({ id: id++, question: row.question });
    else groups.push({ topic: row.topic, items: [{ id: id++, question: row.question }] });
  }
  return groups;
}
export function questionsText(groups: QuestionGroup[], selected?: ReadonlySet<number>) {
  return groups.map(group => {
    const items = selected ? group.items.filter(item => selected.has(item.id)) : group.items;
    return items.length ? `${group.topic}\n${items.map(item => `${item.id + 1}. ${item.question}`).join('\n')}` : '';
  }).filter(Boolean).join('\n\n');
}