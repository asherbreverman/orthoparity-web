import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  cacheKey,
  type BrandFamily,
  type Chain,
  type Meta,
  type SearchResult,
} from "./predicate-chain";

let client: SupabaseClient | undefined;
function getClient() {
  const url = import.meta.env["VITE_SUPABASE_URL"];
  const key =
    import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || import.meta.env["VITE_SUPABASE_ANON_KEY"];
  if (!url || !key)
    throw new Error(
      "The research data is not connected yet. Search will be available once the existing data project is connected.",
    );
  client ??= createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}
export function isDataConnected() {
  return Boolean(
    import.meta.env["VITE_SUPABASE_URL"] &&
    (import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || import.meta.env["VITE_SUPABASE_ANON_KEY"]),
  );
}
let metadata: Promise<Meta> | undefined;
export function getMeta() {
  metadata ??= (async () => {
    const { data, error } = await getClient().from("pc_meta").select("key,value");
    if (error) throw error;
    return Object.fromEntries((data ?? []).map((row) => [row.key, String(row.value)]));
  })();
  return metadata;
}
export async function searchDevices(q: string, signal?: AbortSignal): Promise<SearchResult[]> {
  const { data, error } = await getClient()
    .rpc("pc_search", { q, lim: 50 })
    .abortSignal(signal ?? new AbortController().signal);
  if (error) throw error;
  return data ?? [];
}
export async function getFamily(k: string): Promise<BrandFamily> {
  const { data, error } = await getClient().rpc("pc_brand_family", { k });
  if (error) throw error;
  return data;
}
const chains = new Map<string, Promise<Chain>>();
export function lookupChain(roots: string[], max_gen: number) {
  const key = cacheKey(roots, max_gen);
  let pending = chains.get(key);
  if (!pending) {
    pending = (async () => {
      const { data, error } = await getClient().rpc("pc_lookup", { roots, max_gen });
      if (error) throw error;
      return data as Chain;
    })();
    chains.set(key, pending);
    pending.catch(() => chains.delete(key));
  }
  return pending;
}
