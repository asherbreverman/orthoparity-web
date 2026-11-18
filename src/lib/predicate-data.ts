import { supabase } from "@/integrations/supabase/client";
import type { Brief, Comparison, BatchRow, ProductCode } from "./reviewer-data";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Vendor, VendorBrief, VendorComparison, PortfolioRow, ProductPayments, OwnershipMode } from './vendor-data';
import type { Signals, VendorSignals } from './signals';
import { vendorCoverage, type VendorCoverage } from './vendor-coverage';
import {
  cacheKey,
  preferredSearchResults,
  type BrandFamily,
  type Chain,
  type Meta,
  type SearchResult,
} from "./predicate-chain";

function getClient() { return supabase; }
export async function searchVendors(q: string, signal?: AbortSignal): Promise<Vendor[]> {
  const {data, error} = await researchClient.rpc('pc_vendor_search', {q, lim: 50}).abortSignal(signal ?? new AbortController().signal);
  if (error) throw error;
  return data ?? [];
}
export async function getVendorBrief(v: string, m: OwnershipMode): Promise<VendorBrief> {
  const {data, error} = await researchClient.rpc('pc_vendor_brief', {v, m}); if (error) throw error; return data as VendorBrief;
}
export async function getVendorPortfolio(v: string, m: OwnershipMode): Promise<PortfolioRow[]> {
  const {data, error} = await researchClient.rpc('pc_vendor_portfolio', {v, m, p_anatomy: null, p_kind: null, p_code: null, lim: 500}); if (error) throw error; return data ?? [];
}
export async function getVendorComparison(a: string, b: string, m: OwnershipMode): Promise<VendorComparison> {
  const {data, error} = await researchClient.rpc('pc_vendor_compare', {a, b, m}); if (error) throw error; return data as VendorComparison;
}
export async function getProductPayments(k: string): Promise<ProductPayments> {
  const {data, error} = await researchClient.rpc('pc_product_payments', {k}); if (error) throw error; return data as ProductPayments;
}
// Existing research RPCs may precede regeneration of the generated schema types.
const researchClient: SupabaseClient = supabase;
let coverage: Promise<VendorCoverage> | undefined;
export function getVendorCoverage() {
  coverage ??= (async () => {
    const [count, first, last] = await Promise.all([
      researchClient.from('pc_vendors').select('vendor_id', {count:'exact',head:true}),
      researchClient.from('pc_vendors').select('first_clearance_year').not('first_clearance_year','is',null).order('first_clearance_year',{ascending:true}).limit(1),
      researchClient.from('pc_vendors').select('last_clearance_year').not('last_clearance_year','is',null).order('last_clearance_year',{ascending:false}).limit(1),
    ]);
    if (count.error || first.error || last.error) throw count.error || first.error || last.error;
    return vendorCoverage(count.count, first.data?.[0]?.first_clearance_year, last.data?.[0]?.last_clearance_year);
  })();
  return coverage;
}
export async function getSignals(k: string): Promise<Signals> {
  const { data, error } = await researchClient.rpc('pc_signals', { k }); if (error) throw error; return data as Signals;
}
export async function getVendorSignals(v: string, m: OwnershipMode): Promise<VendorSignals> {
  const { data, error } = await researchClient.rpc('pc_vendor_signals', { v, m }); if (error) throw error; return data as VendorSignals;
}
const portfolios = new Map<string, Promise<PortfolioRow[]>>();
export function getCachedPortfolio(v: string, m: OwnershipMode) {
  const key = `${v}|${m}`; let p = portfolios.get(key);
  if (!p) { p = getVendorPortfolio(v, m); portfolios.set(key, p); p.catch(() => portfolios.delete(key)); }
  return p;
}
export async function getBrief(k: string): Promise<Brief> {
  const { data, error } = await researchClient.rpc("pc_brief", { k });
  if (error) throw error;
  return data as Brief;
}
export async function compareDevices(a: string, b: string): Promise<Comparison> {
  const { data, error } = await researchClient.rpc("pc_compare", { a, b });
  if (error) throw error;
  return data as Comparison;
}
export async function batchDevices(ks: string[]): Promise<BatchRow[]> {
  const { data, error } = await researchClient.rpc("pc_batch", { ks });
  if (error) throw error;
  return (data ?? []) as BatchRow[];
}
export async function getProductCodes(codes: string[]): Promise<ProductCode[]> {
  if (!codes.length) return [];
  const { data, error } = await researchClient.from("pc_product_codes").select("product_code,plain_name,fda_name").in("product_code", [...new Set(codes)]);
  if (error) throw error;
  return (data ?? []) as ProductCode[];
}
export function isDataConnected() {
  return true;
}
let metadata: Promise<Meta> | undefined;
export function getMeta() {
  metadata ??= (async () => {
    const { data, error } = await getClient().from("pc_meta").select("key,value");
    if (error) throw error;
    return Object.fromEntries((data ?? []).map((row) => [row.key, row.value ?? ""]));
  })();
  return metadata;
}
export async function searchDevices(q: string, signal?: AbortSignal): Promise<SearchResult[]> {
  const { data, error } = await getClient()
    .rpc("pc_search", { q, lim: 50 })
    .abortSignal(signal ?? new AbortController().signal);
  if (error) throw error;
  return preferredSearchResults(data ?? []);
}
export async function getFamily(k: string): Promise<BrandFamily> {
  const { data, error } = await getClient().rpc("pc_brand_family", { k });
  if (error) throw error;
  return data as unknown as BrandFamily;
}
const chains = new Map<string, Promise<Chain>>();
export function lookupChain(roots: string[], max_gen: number) {
  const key = cacheKey(roots, max_gen);
  let pending = chains.get(key);
  if (!pending) {
    pending = (async () => {
      const { data, error } = await getClient().rpc("pc_lookup", { roots, max_gen });
      if (error) throw error;
      return data as unknown as Chain;
    })();
    chains.set(key, pending);
    pending.catch(() => chains.delete(key));
  }
  return pending;
}
