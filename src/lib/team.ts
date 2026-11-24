/** Medicare TEAM types and pure arithmetic. Calculator inputs stay in the browser and never reach these reads. */
export interface TeamRegionPrice { region: string; region_name: string; target_price: number | null; benchmark_price: number | null; trend_factor: number | null; discount_factor: number | null }
export interface TeamPrice { drg: string; title: string | null; year: number; min: number | null; max: number | null; median: number | null; regions: TeamRegionPrice[] }
export interface TeamTrigger { code_type: string; code: string; price_drg: string | null; setting: string | null; note: string | null }
export interface TeamFamily {
  is_team: boolean; checked: boolean; note: string | null; basis: string | null; family_id?: string;
  category?: string; category_id?: string; family_drgs_not_in_team?: string[] | string | null;
  triggers?: TeamTrigger[]; prices_2027?: TeamPrice[]; prices_2026?: TeamPrice[]; range_2027?: {min: number | null; max: number | null} | null;
  participants?: number | null; participants_as_of?: string | null; notes?: string[]; sources?: {name: string; url: string}[];
}
export interface TeamCode { found: boolean; note?: string | null; code?: string; code_type?: string; category?: string; setting?: string; price_drg?: string; families?: {family_id: string; name: string}[]; prices_2027?: TeamPrice[]; source?: string; source_url?: string }
export interface TeamHospital { ccn: string; hospital: string; participation: string | null; cbsa: string | null; cbsa_name: string | null; state: string | null; start_date: string | null; end_date: string | null; region: string | null; region_name: string | null; track: string | null; prices_2027: {category: string; drg: string; target_price: number | null}[] }
export interface TeamHospitalSearch { query: string; results: TeamHospital[]; note: string | null; as_of: string | null; total: number | null; source_url: string | null; prices_note: string | null }

export const teamFamilies = ['hip_knee_replacement', 'hip_fracture_replacement', 'hip_femur_fixation', 'cervical_fusion', 'thoracolumbar_fusion'] as const;

export function teamDollars(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'NOT FOUND';
  const abs = Math.abs(value).toLocaleString('en-US', {style: 'currency', currency: 'USD', maximumFractionDigits: 0});
  return value < 0 ? `-${abs}` : abs;
}
export function teamDate(iso: string | null | undefined): string {
  if (!iso) return 'NOT FOUND';
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'});
}
export function lowerFirst(text: string) { return text ? text.charAt(0).toLowerCase() + text.slice(1) : text; }

/** Blank stays blank: never default an input to zero. */
export function parseInput(raw: string): number | null {
  const t = raw.replace(/[$,\s]/g, '');
  if (t === '' || t === '-' || t === '.') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export interface ClaimInputs { cases: number | null; implantNow: number | null; implantNew: number | null; losDays: number | null; costPerDay: number | null; readmitPts: number | null; readmitPay: number | null; postAcutePts: number | null; postAcutePay: number | null }
export interface Ledger { implantDiff: number | null; losCost: number | null; hospital: number | null; readmit: number | null; postAcute: number | null; episode: number | null; episodePct: number | null; net: number | null; perYear: number | null; breakEven: number | null }

const mul = (...v: (number | null)[]) => v.some(x => x === null) ? null : (v as number[]).reduce((a, b) => a * b, 1);
/** Sum of the entered lines only; null when none was entered. */
export function sumEntered(...v: (number | null)[]) { const e = v.filter((x): x is number => x !== null); return e.length ? e.reduce((a, b) => a + b, 0) : null; }

/** effect scales the claimed length-of-stay, readmission and post-acute changes; the implant difference is not scaled. */
export function teamLedger(i: ClaimInputs, target: number | null, effect = 1): Ledger {
  const implantDiff = i.implantNew !== null && i.implantNow !== null ? i.implantNew - i.implantNow : null;
  const losCost = mul(i.losDays, i.costPerDay, effect);
  const readmit = mul(i.readmitPts, i.readmitPay, effect) === null ? null : (i.readmitPts! * effect) / 100 * i.readmitPay!;
  const postAcute = mul(i.postAcutePts, i.postAcutePay, effect) === null ? null : (i.postAcutePts! * effect) / 100 * i.postAcutePay!;
  const hospital = sumEntered(implantDiff, losCost);
  const episode = sumEntered(readmit, postAcute);
  const episodePct = episode !== null && target ? episode / target * 100 : null;
  const net = sumEntered(hospital, episode);
  const perYear = net !== null && i.cases !== null ? net * i.cases : null;
  const effects = sumEntered(losCost, episode);
  const breakEven = effects === null ? null : -effects;
  return {implantDiff, losCost, hospital, readmit, postAcute, episode, episodePct, net, perYear, breakEven};
}

/** A two-letter query is a state: list every hospital CMS places in it. */
export function isStateQuery(q: string) { return /^[A-Za-z]{2}$/.test(q.trim()); }
/** Keeps only hospitals in the searched state; name matches like "CA" in "Castle" drop out. */
export function stateHospitals(results: TeamHospital[], q: string) {
  const st = q.trim().toUpperCase();
  return [...results].filter(h => h.state?.toUpperCase() === st).sort((a, b) => a.hospital.localeCompare(b.hospital));
}
