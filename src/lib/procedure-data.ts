export type ProcedureValue = number | string | null;
export interface ProcedureNotes { source: string; definitions: {term: string; text: string}[]; limitations: string[] }
export interface ProcedureFamily { family_id: string; name: string; description: string; drgs: string[]; flagship: boolean; data_year: number; discharges: number; hospitals: number }
export interface ProcedureSummary extends ProcedureFamily { medicare_pays: ProcedureValue; patient_other_pays: ProcedureValue; total_payment: ProcedureValue; device_categories: number }
export interface ProcedureList { procedures: ProcedureSummary[]; notes: ProcedureNotes }
export interface ProcedureVendor { vendor_id: string; name: string; clearances: number; latest: string | null }
export interface ProcedureDevice { role: string; product_code: string; plain_name: string | null; fda_name: string; clearances_all: number; clearances_recent: number; active_vendors: number; status: string; vendors: ProcedureVendor[] }
export interface DeviceProcedures { knumber: string; product_code: string | null; procedures: {family_id: string; name: string; role: string; flagship: boolean; status: string}[] }
export interface VendorProcedureCategory {role: string; product_code: string; plain_name: string | null; clearances_all: number; clearances_recent: number; latest: string | null}
export interface VendorProcedure {family_id: string; name: string; flagship: boolean; data_year: number; categories_total: number; categories_with_clearances: number; categories_recent: number; clearances_recent: number; latest: string | null; categories: VendorProcedureCategory[]}
export interface VendorProcedures {vendor_id: string; mode: 'pit' | 'current'; window: {from: string; to: string}; procedures: VendorProcedure[]; procedures_total: number}
export interface ProcedureDetail {
  found: boolean;
  family: ProcedureFamily;
  payment: {medicare_pays: ProcedureValue; patient_other_pays: ProcedureValue; total_payment: ProcedureValue; patient_other_share: number};
  supply_range: {note: string | null; shares: number[]; on_medicare: ProcedureValue[]; on_total: ProcedureValue[]};
  drgs: {drg: string; description: string; discharges: ProcedureValue; hospitals: ProcedureValue; medicare_pays: ProcedureValue; patient_other_pays: ProcedureValue; total_payment: ProcedureValue; share_of_family: number | null; hospital_medicare_spread: {p25: ProcedureValue; median: ProcedureValue; p75: ProcedureValue} | null; spread_note: string | null; note: string | null}[];
  outpatient: {cpt: string; procedure: string; status: string; apc: string; apc_description: string | null; apc_services: ProcedureValue; apc_medicare_pays: ProcedureValue; apc_patient_other_pays: ProcedureValue; apc_total_allowed: ProcedureValue; source: string; source_url: string}[];
  devices: ProcedureDevice[];
  evidence: {source: string; procedure: string; data_years: string; measure: string; result: string; source_url: string}[];
  worksheet: {step: number; question: string; hint: string}[];
  vendor_window: {from: string; to: string};
  notes: ProcedureNotes;
}
export function procedureNumber(value: ProcedureValue | undefined): string { return typeof value === 'number' ? value.toLocaleString('en-US') : value ?? 'NOT FOUND'; }
export function procedureDollars(value: ProcedureValue | undefined): string { return typeof value === 'number' ? value.toLocaleString('en-US', {style: 'currency', currency: 'USD', maximumFractionDigits: 0}) : value ?? 'NOT FOUND'; }
export function flagshipFirst(rows: ProcedureSummary[]) { return [...rows.filter(r => r.flagship), ...rows.filter(r => !r.flagship)]; }
export interface WorksheetRow {item: string; units: string; price: string}
export function worksheetHasNumbers(rows: WorksheetRow[], other: string) {
  return [...rows.flatMap(row => [row.units, row.price]), other].some(value => value.trim() !== '' && Number.isFinite(Number(value)));
}
export function procedureRoleGroups(devices: ProcedureDevice[]) {
  return ['Implant', 'Biologic', 'Cement and accessories', 'Enabling technology'].filter(role => devices.some(device => device.role.toLowerCase() === role.toLowerCase()));
}
const inputNumber = (value: string) => {const n = Number(value); return Number.isFinite(n) && n > 0 ? n : 0;};
export function worksheetTotals(rows: WorksheetRow[], other: string, medicare: ProcedureValue, total: ProcedureValue) {
  const construct = rows.reduce((sum, row) => sum + inputNumber(row.units) * inputNumber(row.price), 0);
  const supplies = construct + inputNumber(other);
  return {construct, supplies, medicareShare: typeof medicare === 'number' && medicare > 0 ? supplies / medicare : null, totalShare: typeof total === 'number' && total > 0 ? supplies / total : null};
}
export function sharePosition(share: number | null) {
  if (share === null) return 'NOT FOUND';
  if (share < .3) return 'less than 30%';
  if (share === .3) return 'at 30%';
  if (share < .4) return 'between 30% and 40%';
  if (share === .4) return 'at 40%';
  if (share < .5) return 'between 40% and 50%';
  return share === .5 ? 'at 50%' : 'more than 50%';
}
export function procedureVendorName(name: string) { return /hospital|surgeon/i.test(name) ? 'Vendor' : name; }