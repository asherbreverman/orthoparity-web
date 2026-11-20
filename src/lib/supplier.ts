import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { resilient } from './predicate-data';
import type { OwnershipMode } from './vendor-data';

type Nullable<T> = { [K in keyof T]: T[K] | null };
export type SupplierSite = Nullable<{
  fei: string | number;
  name: string;
  city: string;
  state: string;
  country: string;
  activities: string;
  makes: boolean;
  products: number;
  last_inspection: Nullable<{ date: string; classification: string }>;
  inspections_last5: number;
  oai_last5: number;
  warning_letters_last5: number;
}>;
export type VendorSupplier = Nullable<{
  vendor_id: string;
  since: string;
  inspections_through: string;
  sites: Nullable<{ company_sites: number; company_making: number; company_countries: number; partner_sites: number; partner_making: number; other_company_sites: number }>;
  countries: Nullable<{ country: string; sites: number }>[];
  inspections_last5: Nullable<{ inspections: number; nai: number; vai: number; oai: number; sites_inspected: number }>;
  inspections_all: Nullable<{ inspections: number; nai: number; vai: number; oai: number; first: string; latest: string }>;
  partner_inspections_last5: Nullable<{ inspections: number; oai: number }>;
  warning_letters: Nullable<{ company_last5: number; company_all: number; partner_last5: number; company_rows: Nullable<{ date: string; type: string; site: string; city: string; country: string; case_id: string | number }>[] }>;
  top_citations: Nullable<{ cfr: string; short_description: string; n: number }>[];
  company_sites: SupplierSite[];
  partner_sites: (SupplierSite & { owner: string | null })[];
  other_company_sites: Nullable<{ company: string; vendor_id: string; sites: number; products: number }>[];
  recalls: Nullable<{ figs: Nullable<{ label: string; value: string | number }>[]; badge: string }>;
  maude_last5: Nullable<{ reports: number; deaths: number; injuries: number; malfunctions: number; other: number; since: string }>;
  sources: Nullable<{ sites: string; inspections: string; compliance: string; warning_letters: string }>;
  notes: string[];
}>;

const researchClient: SupabaseClient = supabase;
export interface DeviceSupplier {
  knumber: string; since: string; inspections_through: string;
  sites: number; making_sites: number; company_sites: number; partner_sites: number; other_company_sites: number;
  partner_making: string[]; countries_making: string[]; inspections_last5: number; oai_last5: number;
  warning_letters_last5: number; flagged_sites: string[];
  rows: { fei: string; name: string; owner: string | null; city: string | null; state: string | null; country: string | null;
    relation: 'company' | 'partner' | 'other_company' | 'other company'; makes: boolean; activities: string | null;
    inspections_last5: number; oai_last5: number; warning_letters_last5: number;
    last_inspection: { date: string; classification: string } | null }[];
  notes: string[]; sources: { sites: string; inspections: string; compliance: string };
}
const deviceRead = resilient(async (k: string): Promise<DeviceSupplier> => {
  const { data, error } = await researchClient.rpc('pc_device_supplier', { k });
  if (error) throw error;
  return data as DeviceSupplier;
});
const deviceReads = new Map<string, Promise<DeviceSupplier>>();
export function getDeviceSupplier(k: string) {
  let pending = deviceReads.get(k);
  if (!pending) { pending = deviceRead(k); deviceReads.set(k, pending); pending.catch(() => deviceReads.delete(k)); }
  return pending;
}
const supplierRead = resilient(async (v: string, m: OwnershipMode): Promise<VendorSupplier> => {
  const { data, error } = await researchClient.rpc('pc_vendor_supplier', { v, m });
  if (error) throw error;
  return data as VendorSupplier;
});
const reads = new Map<string, Promise<VendorSupplier>>();
export function getVendorSupplier(v: string, m: OwnershipMode) {
  const key = JSON.stringify([v, m]);
  let pending = reads.get(key);
  if (!pending) {
    pending = supplierRead(v, m);
    reads.set(key, pending);
    pending.catch(() => reads.delete(key));
  }
  return pending;
}
export function supplierNumber(value: number | string | null | undefined) {
  return value == null ? 'NOT FOUND' : typeof value === 'number' ? value.toLocaleString('en-US') : value;
}
export function supplierLocation(site: { city: string | null; state?: string | null; country: string | null }) {
  let country = site.country;
  if (country && /^[A-Za-z]{2}$/.test(country)) {
    try { country = new Intl.DisplayNames(['en'], { type: 'region' }).of(country.toUpperCase()) ?? country; } catch { /* Keep the supplied country code. */ }
  }
  return [site.city, site.state, country].filter(Boolean).join(', ') || 'NOT FOUND';
}
const activityNames: Record<string, string> = {
  'Manufacture Medical Device': 'Manufacturer',
  'Manufacture Medical Device for Another Party (Contract Manufacturer)': 'Contract manufacturer',
  'Sterilize Medical Device for Another Party (Contract Sterilizer)': 'Contract sterilizer',
  'Develop Specifications But Do Not Manufacture At This Facility': 'Specification developer',
  'Export Device to the United States But Perform No Other Operation on Device': 'Foreign exporter',
  'Complaint File Establishment per 21 CFR 820.198': 'Complaint handling',
  'Repack or Relabel Medical Device': 'Repackager or relabeler',
  'Manufacture Device in the United States for Export Only': 'US maker, export only',
  'Reprocess Single-Use Device': 'Reprocessor',
  'Remanufacture Medical Device': 'Remanufacturer',
  'Foreign Private Label Distributor': 'Private label distributor',
};
export function supplierActivities(activities: string | null) {
  return activities?.split('; ').map(value => activityNames[value] ?? value).join(', ') || 'NOT FOUND';
}
export function inspectionName(code: string | null) {
  return code === 'NAI' ? 'No action indicated' : code === 'VAI' ? 'Voluntary action indicated' : code === 'OAI' ? 'Official action indicated' : undefined;
}