import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { resilient } from './predicate-data';
import type { OwnershipMode } from './vendor-data';

type Nullable<T> = { [K in keyof T]: T[K] | null };
export type AddOnItem = Nullable<{
  tech_id: string; program: 'NTAP' | 'TPT'; period: string; status: string;
  technology: string; company: string; vendor_id: string; fda_numbers: string;
  hcpcs: string; cms_descriptor: string; apc: string; max_payment: number;
  cms_codes: string; pathway: string; effective: string; pass_through_ends: string;
  cms_source: string; fda_source: string; note: string;
}> & { example_knumber?: string | null; products?: number | null };
export type DeviceAddOn = { knumber: string; has_add_on: boolean; items: AddOnItem[]; product_code: string | null; category: AddOnItem[]; notes: string[] };
export type VendorAddOn = { vendor_id: string; items: AddOnItem[]; ntap: number; pass_through: number; notes: string[] };

const researchClient: SupabaseClient = supabase;
const deviceRead = resilient(async (k: string): Promise<DeviceAddOn> => {
  const { data, error } = await researchClient.rpc('pc_device_add_on', { k });
  if (error) throw error;
  return data as DeviceAddOn;
});
const vendorRead = resilient(async (v: string, m: OwnershipMode): Promise<VendorAddOn> => {
  const { data, error } = await researchClient.rpc('pc_vendor_add_on', { v, m });
  if (error) throw error;
  return data as VendorAddOn;
});
const devices = new Map<string, Promise<DeviceAddOn>>();
const vendors = new Map<string, Promise<VendorAddOn>>();
export function getDeviceAddOn(k: string) {
  let pending = devices.get(k);
  if (!pending) { pending = deviceRead(k); devices.set(k, pending); pending.catch(() => devices.delete(k)); }
  return pending;
}
export function getVendorAddOn(v: string, m: OwnershipMode) {
  const key = JSON.stringify([v, m]);
  let pending = vendors.get(key);
  if (!pending) { pending = vendorRead(v, m); vendors.set(key, pending); pending.catch(() => vendors.delete(key)); }
  return pending;
}
export function addOnAmount(value: number | null) {
  return value === null ? 'NOT FOUND' : value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2 });
}
export function addOnStatus(item: AddOnItem) {
  if (item.program === 'NTAP') return item.status === 'new' ? 'New for FY 2027' : item.status === 'continued' ? 'Continues in FY 2027' : item.status === 'discontinued' ? 'Ended for FY 2027' : 'NOT FOUND';
  if (item.program !== 'TPT') return 'NOT FOUND';
  return `${item.status === 'new' ? 'New January 1, 2027' : 'Continues in CY 2027'}${item.pass_through_ends === 'during CY 2027' ? ' (expires during 2027)' : ''}`;
}