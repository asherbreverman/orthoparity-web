export type Tone = 'info' | 'attention';
export interface DecisionCard { key: string; question: string; short?: string; asks?: string[]; headline?: string; figs?: { value: string | number; label: string }[]; badge: string; tone: Tone | string; finding: string; why: string; ask: string; evidence: string }
export interface DeviceIndications { knumber: string; found: boolean; ifu_text: string | null; page: string | null; predicate: { knumber: string; device_name: string | null; ifu_text: string | null } | null; similarity: number | null }
export interface AlternativeRow { vendor_id: string; company: string; clearances: number; latest_knumber: string | null; latest_device: string | null; latest_date: string | null }
export interface SignalHeader { device_name: string | null; company: string | null; owner: string | null; plain_name: string | null; fda_name: string | null; product_code: string | null; cleared: string | null; device_class: string | null; procedures: string | null; anatomy: string | null; kind: string | null; summary_url: string | null; pattern: string | null }
export interface Signals { found: boolean; knumber: string; header: SignalHeader; bottom_line: string; cards: DecisionCard[]; alternatives: { window: string; companies: number; rows: AlternativeRow[] }; notes: string[] }
export interface CompetitionRow { product_code: string; plain_name: string | null; fda_name: string | null; anatomy: string | null; kind: string | null; clearances: number; last5: number; code_last5: number; share_last5_pct: number; rank_last5: number | null; competitors_last5: number; position: string }
export interface Acquisition { vendor_id: string; name: string; date: string | null; relation: string; source_url: string | null }
export interface VendorSignals { found: boolean; mode: string; vendor: Record<string, unknown>; bottom_line: string; cards: DecisionCard[]; competition: CompetitionRow[]; acquisitions: Acquisition[]; notes: string[] }
export type View = 'brief' | 'analyst';

/** Only "attention" renders amber; anything else is the neutral info pill. Never a verdict color. */
export function toneClass(tone: string) { return tone === 'attention' ? 'tone-attention' : 'tone-info'; }
export function positionClass(position: string) { return position === 'Top 3' ? 'position-top' : position === 'No recent clearances' ? 'position-quiet' : 'position-active'; }
export function askLines(cards: DecisionCard[]) { return cards.flatMap(c => (c.asks?.length ? c.asks : [c.ask])).filter(Boolean); }
export function questionHue(index: number) { return `question-hue-${(index % 7) + 1}`; }
export function numberedText(lines: string[]) { return lines.map((q, i) => `${i + 1}. ${q}`).join('\n'); }
export function longDate(value: string | null | undefined) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? '');
  if (!m) return 'NOT FOUND';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}`;
}
export function evidenceIsOpen(view: View, opened: ReadonlySet<string>, id: string) { return view === 'analyst' || opened.has(id); }
/** Brands that have GUDID devices but none currently in commercial distribution. */
export function brandsOutOfDistribution(rows: { gudid_brand?: string | null; gudid_devices?: number; gudid_in_distribution?: number }[]) {
  const brands = new Map<string, { devices: number; inDistribution: number }>();
  for (const r of rows) { if (!r.gudid_brand) continue; const b = brands.get(r.gudid_brand) ?? { devices: 0, inDistribution: 0 }; b.devices += r.gudid_devices ?? 0; b.inDistribution += r.gudid_in_distribution ?? 0; brands.set(r.gudid_brand, b); }
  return [...brands].filter(([, b]) => b.devices > 0 && b.inDistribution === 0).map(([brand, b]) => ({ brand, devices: b.devices })).sort((a, b) => a.brand.localeCompare(b.brand));
}
export const decisionLimitations = [
  'Decision cards come from fixed rules on public data. Each one frames a question for the vendor; none is a judgment of a device or a company.',
  'Alternatives and competition count 510(k) clearances in the same FDA product code. A product code is broad, so not every alternative is a direct substitute, and clearance counts measure product activity, not sales or quality.',
  'Catalog counts are the GUDID device IDs that cite a 510(k). A system sold under several 510(k)s spreads its items across them.',
  'Research for companies with large non-orthopedic businesses is limited to orthopedic studies by rule; some broad research programs may still include non-orthopedic work.',
];
