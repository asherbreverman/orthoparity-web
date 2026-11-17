import { supabase } from "@/integrations/supabase/client";
import type { Brief, Comparison, BatchRow, ProductCode } from "./reviewer-data";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  cacheKey,
  preferredSearchResults,
  type BrandFamily,
  type Chain,
  type Meta,
  type SearchResult,
} from "./predicate-chain";

function getClient() { return supabase; }
// Existing research RPCs may precede regeneration of the generated schema types.
const researchClient: SupabaseClient = supabase;
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
