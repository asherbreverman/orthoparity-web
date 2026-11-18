import { supabase } from "@/integrations/supabase/client";
import type { Brief, Comparison, BatchRow, ProductCode } from "./reviewer-data";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Vendor, VendorBrief, VendorComparison, PortfolioRow, ProductPayments, OwnershipMode } from './vendor-data';
import type { DecisionCard, Signals, VendorSignals } from './signals';
import type { DeviceRecalls, VendorRecalls } from './recalls';
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
export const LOAD_FAILED = "This brief didn't load. Try again in a moment.";
const TIMEOUT_MS = 8000;
function attempt<T>(run: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Request exceeded ${TIMEOUT_MS}ms`)), TIMEOUT_MS);
    run().then(resolve, reject).finally(() => clearTimeout(timer));
  });
}
const aborted = (args: unknown[]) => args.some(a => a instanceof AbortSignal && a.aborted);
/** Retries a failed or slow read once; raw database errors go to the console only. */
export function resilient<A extends unknown[], T>(fn: (...args: A) => Promise<T>): (...args: A) => Promise<T> {
  return async (...args: A) => {
    try { return await attempt(() => fn(...args)); } catch (first) {
      if (aborted(args)) throw first;
      console.error('Research request failed; retrying once.', first);
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('pc-retrying'));
      try { return await attempt(() => fn(...args)); } catch (second) {
        if (aborted(args)) throw second;
        console.error('Research request failed after retry.', second);
        throw new Error(LOAD_FAILED);
      }
    }
  };
}
async function searchVendorsRaw(q: string, signal?: AbortSignal): Promise<Vendor[]> {
  const {data, error} = await researchClient.rpc('pc_vendor_search', {q, lim: 50}).abortSignal(signal ?? new AbortController().signal);
  if (error) throw error;
  return data ?? [];
}
async function getVendorBriefRaw(v: string, m: OwnershipMode): Promise<VendorBrief> {
  const {data, error} = await researchClient.rpc('pc_vendor_brief', {v, m}); if (error) throw error; return data as VendorBrief;
}
async function getVendorPortfolioRaw(v: string, m: OwnershipMode): Promise<PortfolioRow[]> {
  const {data, error} = await researchClient.rpc('pc_vendor_portfolio', {v, m, p_anatomy: null, p_kind: null, p_code: null, lim: 500}); if (error) throw error; return data ?? [];
}
async function getVendorComparisonRaw(a: string, b: string, m: OwnershipMode): Promise<VendorComparison> {
  const {data, error} = await researchClient.rpc('pc_vendor_compare', {a, b, m}); if (error) throw error; return data as VendorComparison;
}
async function getProductPaymentsRaw(k: string): Promise<ProductPayments> {
  const {data, error} = await researchClient.rpc('pc_product_payments', {k}); if (error) throw error; return data as ProductPayments;
}
// Existing research RPCs may precede regeneration of the generated schema types.
const researchClient: SupabaseClient = supabase;
let coverage: Promise<VendorCoverage> | undefined;
export function getVendorCoverage() {
  coverage ??= resilient(async () => {
    const [count, first, last] = await Promise.all([
      researchClient.from('pc_vendors').select('vendor_id', {count:'exact',head:true}),
      researchClient.from('pc_vendors').select('first_clearance_year').not('first_clearance_year','is',null).order('first_clearance_year',{ascending:true}).limit(1),
      researchClient.from('pc_vendors').select('last_clearance_year').not('last_clearance_year','is',null).order('last_clearance_year',{ascending:false}).limit(1),
    ]);
    if (count.error || first.error || last.error) throw count.error || first.error || last.error;
    return vendorCoverage(count.count, first.data?.[0]?.first_clearance_year, last.data?.[0]?.last_clearance_year);
  })();
  coverage.catch(() => { coverage = undefined; });
  return coverage;
}
async function getSignalsRaw(k: string): Promise<Signals> {
  const { data, error } = await researchClient.rpc('pc_signals', { k }); if (error) throw error;
  const signals = data as Signals;
  if (!signals.found || signals.cards.some(c => c.key === 'recalls')) return signals;
  // Older deployed signal RPCs omit the card; preserve the existing FDA-authored card verbatim.
  const recall = await researchClient.rpc('pc_recall_card_product', {kn: k, company: signals.header.company});
  if (recall.error) throw recall.error;
  return {...signals, cards: [...signals.cards, recall.data as DecisionCard]};
}
async function getVendorSignalsRaw(v: string, m: OwnershipMode): Promise<VendorSignals> {
  const { data, error } = await researchClient.rpc('pc_vendor_signals', { v, m }); if (error) throw error;
  const signals = data as VendorSignals;
  if (!signals.found || signals.cards.some(c => c.key === 'recalls')) return signals;
  const recall = await researchClient.rpc('pc_recall_card_vendor', {v, md: m});
  if (recall.error) throw recall.error;
  return {...signals, cards: [...signals.cards, recall.data as DecisionCard]};
}
async function getDeviceRecallsRaw(k: string): Promise<DeviceRecalls> {
  const { data, error } = await researchClient.rpc('pc_device_recalls', { k }); if (error) throw error; return data as DeviceRecalls;
}
async function getVendorRecallsRaw(v: string, m: OwnershipMode): Promise<VendorRecalls> {
  const { data, error } = await researchClient.rpc('pc_vendor_recalls', { v, m, lim: 50 }); if (error) throw error; return data as VendorRecalls;
}
const portfolios = new Map<string, Promise<PortfolioRow[]>>();
export function getCachedPortfolio(v: string, m: OwnershipMode) {
  const key = `${v}|${m}`; let p = portfolios.get(key);
  if (!p) { p = getVendorPortfolio(v, m); portfolios.set(key, p); p.catch(() => portfolios.delete(key)); }
  return p;
}
async function getBriefRaw(k: string): Promise<Brief> {
  const { data, error } = await researchClient.rpc("pc_brief", { k });
  if (error) throw error;
  return data as Brief;
}
async function compareDevicesRaw(a: string, b: string): Promise<Comparison> {
  const { data, error } = await researchClient.rpc("pc_compare", { a, b });
  if (error) throw error;
  return data as Comparison;
}
async function batchDevicesRaw(ks: string[]): Promise<BatchRow[]> {
  const { data, error } = await researchClient.rpc("pc_batch", { ks });
  if (error) throw error;
  return (data ?? []) as BatchRow[];
}
async function getProductCodesRaw(codes: string[]): Promise<ProductCode[]> {
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
  metadata ??= resilient(async () => {
    const { data, error } = await getClient().from("pc_meta").select("key,value");
    if (error) throw error;
    return Object.fromEntries((data ?? []).map((row) => [row.key, row.value ?? ""]));
  })();
  metadata.catch(() => { metadata = undefined; });
  return metadata;
}
async function searchDevicesRaw(q: string, signal?: AbortSignal): Promise<SearchResult[]> {
  const { data, error } = await getClient()
    .rpc("pc_search", { q, lim: 50 })
    .abortSignal(signal ?? new AbortController().signal);
  if (error) throw error;
  return preferredSearchResults(data ?? []);
}
async function getFamilyRaw(k: string): Promise<BrandFamily> {
  const { data, error } = await getClient().rpc("pc_brand_family", { k });
  if (error) throw error;
  return data as unknown as BrandFamily;
}
const chains = new Map<string, Promise<Chain>>();
export function lookupChain(roots: string[], max_gen: number) {
  const key = cacheKey(roots, max_gen);
  let pending = chains.get(key);
  if (!pending) {
    pending = resilient(async () => {
      const { data, error } = await getClient().rpc("pc_lookup", { roots, max_gen });
      if (error) throw error;
      return data as unknown as Chain;
    })();
    chains.set(key, pending);
    pending.catch(() => chains.delete(key));
  }
  return pending;
}

export const searchVendors = resilient(searchVendorsRaw);
export const getVendorBrief = resilient(getVendorBriefRaw);
export const getVendorPortfolio = resilient(getVendorPortfolioRaw);
export const getVendorComparison = resilient(getVendorComparisonRaw);
export const getProductPayments = resilient(getProductPaymentsRaw);
export const getSignals = resilient(getSignalsRaw);
export const getVendorSignals = resilient(getVendorSignalsRaw);
export const getDeviceRecalls = resilient(getDeviceRecallsRaw);
export const getVendorRecalls = resilient(getVendorRecallsRaw);
export const getBrief = resilient(getBriefRaw);
export const compareDevices = resilient(compareDevicesRaw);
export const batchDevices = resilient(batchDevicesRaw);
export const getProductCodes = resilient(getProductCodesRaw);
export const searchDevices = resilient(searchDevicesRaw);
export const getFamily = resilient(getFamilyRaw);
