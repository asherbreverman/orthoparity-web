/** Every search value on this site is a string; keep URLs plain (no JSON quoting). */
export function parsePlainSearch(searchStr: string): Record<string, string> {
  const out: Record<string, string> = {};
  new URLSearchParams(searchStr.startsWith('?') ? searchStr.slice(1) : searchStr).forEach((value, key) => {
    out[key] = value.length >= 2 && value.startsWith('"') && value.endsWith('"') ? value.slice(1, -1) : value;
  });
  return out;
}
export function stringifyPlainSearch(search: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, typeof value === 'string' ? value : JSON.stringify(value));
  }
  const text = params.toString();
  return text ? `?${text}` : '';
}
