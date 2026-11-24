import { createClient } from '@supabase/supabase-js';
import { boundedPageData, PAGE_CACHE_MS, type PageSubject, type PageData } from './page-preview';

/** Edge cache is optional in local development; no database or visitor storage writes. */
async function cachedPublicRead<T>(key: string, signal: AbortSignal, read: () => Promise<T>): Promise<T> {
  const storage = (globalThis as typeof globalThis & { caches?: { default?: Cache } }).caches;
  const cache = storage?.default;
  const request = new Request(`https://www.orthoparity.com/__public-page-cache/v1/${encodeURIComponent(key)}`);
  if (cache) {
    try {
      const hit = await cache.match(request);
      if (hit) return await hit.json() as T;
    } catch { /* Cache availability does not determine page availability. */ }
  }
  const data = await read();
  if (cache && !signal.aborted && data !== null) {
    try { await cache.put(request, new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${PAGE_CACHE_MS / 1000}` } })); } catch { /* Best effort edge cache. */ }
  }
  return data;
}

function publicClient() {
  // Same public project configuration as the generated browser client, never a privileged key.
  const url = process.env['SUPABASE_URL'] ?? 'https://kkexnkcgbdgmipwzsugs.supabase.co';
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'] ?? 'sb_publishable_Qf0UjA07X3BM6NPuZDbQHw_By_3FMBO';
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
      headers.set('apikey', key);
      return fetch(input, { ...init, headers });
    } },
  });
}
export async function readPublicPageData(subject: PageSubject): Promise<PageData> {
  const client = publicClient();
  const controller = new AbortController();
  const { publicPageReads } = await import('./predicate-data');
  const reads = publicPageReads(client, subject, controller.signal);
  return boundedPageData({
    meta: cachedPublicRead('release', controller.signal, reads.meta),
    coverage: cachedPublicRead('coverage', controller.signal, reads.coverage),
    preview: subject.k || subject.v ? cachedPublicRead(`preview:${subject.k || subject.v}`, controller.signal, reads.preview) : Promise.resolve(null),
  }, () => controller.abort());
}

export async function readPublicProcedurePaths(): Promise<string[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2000);
  try {
    const { publicProcedureList } = await import('./predicate-data');
    return await cachedPublicRead('procedure-paths', controller.signal, async () => {
      const list = await publicProcedureList(publicClient(), controller.signal);
      if (!Array.isArray(list.procedures)) throw new Error('Procedure index unavailable');
      return list.procedures.map(row => `/procedures/${encodeURIComponent(row.family_id)}`);
    });
  } finally { clearTimeout(timer); }
}
export async function readPublicDirectoryPaths(): Promise<string[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2000);
  try {
    const { publicDirectoryIndex } = await import('./predicate-data');
    return await cachedPublicRead('directory-paths', controller.signal, async () => {
      const index = await publicDirectoryIndex(publicClient(), controller.signal);
      if (!Array.isArray(index.segments)) throw new Error('Directory index unavailable');
      return index.segments.flatMap(s => s.codes.map(c => `/browse/${encodeURIComponent(c.product_code)}`));
    });
  } finally { clearTimeout(timer); }
}

export async function readPublicReleaseNotes() {
  const {data, error} = await publicClient().from('pc_release_notes').select('id, released_on, title, summary, data_release, url').order('released_on', {ascending: false});
  if (error) throw error;
  return data ?? [];
}
