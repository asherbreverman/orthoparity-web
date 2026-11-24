/** Registered-trial types and pure helpers; browser-safe. */
export interface Trial { nct: string; url: string | null; title: string | null; status: string | null; study_type?: string | null; phase?: string | null; sponsor: string | null; start_date: string | null; primary_completion?: string | null; has_results: boolean | null; enrollment?: number | null; primary_outcome: string | null; primary_timeframe: string | null; allocation: string | null; devices?: string | null; conditions?: string | null; last_update?: string | null; basis?: string | null; context?: string | null; sponsor_vendor?: string | null }
export interface DeviceTrials { number: string; total: number; with_results: number; active: number; trials: Trial[]; notes: string[]; source: string | null }
export interface VendorTrials { vendor_id: string; total: number; with_results: number; active: number; completed: number; completed_with_results: number; stopped: number; started_last5: number; by_status: {status: string; n: number}[]; sponsors: {sponsor: string; vendor_id: string; n: number}[]; trials: Trial[]; notes: string[]; source: string | null }
export interface TrialLookup extends Partial<Trial> { found: boolean; stored: boolean; nct: string; note?: string | null; products?: {number: string; basis: string}[]; companies?: {vendor_id: string; name: string}[] }

export function normalizeNct(raw: string): string | null { const m = raw.trim().toUpperCase().replace(/\s+/g, ''); return /^NCT\d{8}$/.test(m) ? m : null; }
export const filterByStatus = (rows: Trial[], status: string | null) => status ? rows.filter(r => r.status === status) : rows;

/** Reads the protocol fields the packet check shows from a ClinicalTrials.gov v2 study record. */
export function parseCtGov(nct: string, json: unknown): Trial {
  const s = (json ?? {}) as Record<string, any>; const p = s['protocolSection'] ?? {};
  const out = p.outcomesModule?.primaryOutcomes?.[0];
  return {nct, url: `https://clinicaltrials.gov/study/${nct}`, title: p.identificationModule?.briefTitle ?? null, status: p.statusModule?.overallStatus ?? null, sponsor: p.sponsorCollaboratorsModule?.leadSponsor?.name ?? null, start_date: p.statusModule?.startDateStruct?.date ?? null, has_results: typeof s['hasResults'] === 'boolean' ? s['hasResults'] : null, primary_outcome: out?.measure ?? null, primary_timeframe: out?.timeFrame ?? null, allocation: p.designModule?.designInfo?.allocation ?? null};
}
const pretty = (v: string | null) => v && /^[A-Z_]+$/.test(v) ? v.charAt(0) + v.slice(1).toLowerCase().replace(/_/g, ' ') : v;
export function trialStatus(t: Trial | null) { return pretty(t?.status ?? null); }

export interface PacketClaim { outcome: string; comparator: string; timeframe: string; nct: string }
export function packetQuestions(claim: PacketClaim, trial: Trial | null, vendorQuestions: string[]): string[] {
  const out = [...vendorQuestions];
  if (!claim.nct.trim()) out.push('Which registered trial supports this claim, and what is its NCT number?');
  if (trial && trialStatus(trial)?.toLowerCase() === 'completed' && trial.has_results === false) out.push('This trial is completed with no results posted on ClinicalTrials.gov. When will results be posted?');
  if (claim.outcome.trim()) out.push(`Is '${claim.outcome.trim()}' the trial's registered primary outcome, a secondary outcome or an outcome measured afterward?`);
  if (claim.comparator.trim()) out.push(`Which product, generation or treatment is '${claim.comparator.trim()}', and is it what our surgeons use today?`);
  return out;
}
