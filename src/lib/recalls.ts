import { parseBatch } from './reviewer-data';

export interface RecallEvent {
  event_id: string | number; recall_number: string; initiated: string | null; terminated: string | null;
  status: string; recall_class: string; products: number; product: string | null; reason: string | null;
  root_cause: string | null; recalling_firm: string | null; knumbers: string | string[] | null;
}
export interface DeviceRecalls {
  knumber: string; device: RecallEvent[]; predicates: RecallEvent[]; predicate_knumbers: string[];
  category: { product_code: string; events_last5: number; companies_last5: number; class1_last5: number } | null;
  source: string;
}
export interface VendorRecalls { events_all: number; events_last5: number; by_year: {year: number; events: number}[]; events: RecallEvent[]; source: string }
export const recallLimitation = "Recalls come from FDA's recall database through openFDA (2002 to present). Each recall is linked to a vendor by a 510(k) number it lists or, failing that, by the recalling firm's name. Recall counts reflect both product issues and how readily a company reports and corrects them; larger portfolios usually have more recalls. 'Open' is FDA's status, which can stay open for years after a company finishes its correction. Older recalls have no class in openFDA.";
export const recallCaption = "A recall event can cover many catalog numbers. FDA's recall class: Class I is the most serious, Class III the least.";
export function recallKnumbers(value: RecallEvent['knumbers']) { return parseBatch(Array.isArray(value) ? value.join(';') : value ?? ''); }
export function recallDate(value: string | null) {
  const match = /^(\d{4})-(\d{2})/.exec(value ?? '');
  const month = match ? ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][Number(match[2])-1] : undefined;
  return match && month ? `${month} ${match[1]}` : 'NOT FOUND';
}
export function recentRecallEvents(events: RecallEvent[]) { return [...events].sort((a,b) => (b.initiated ?? '').localeCompare(a.initiated ?? '')); }
export function recallYears(rows: VendorRecalls['by_year'], endYear: number) { const values = new Map(rows.map(r => [r.year,r.events])); return Array.from({length: Math.max(0,endYear-2002+1)}, (_,i) => ({year: 2002+i, events: values.get(2002+i) ?? 0})); }