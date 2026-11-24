export type PrivatePrices = Record<string, string>;

function decode(value: string) {
  try { return decodeURIComponent(value); } catch { return ''; }
}

/** Read only the fragment. Browsers do not include it in HTTP requests. */
export function parsePricesHash(hash: string): PrivatePrices {
  const raw = hash.replace(/^#/, '').split('&').find(part => part.startsWith('prices='))?.slice(7) ?? '';
  const prices: PrivatePrices = {};
  for (const entry of raw.split(',')) {
    const separator = entry.indexOf(':');
    if (separator <= 0) continue;
    const key = decode(entry.slice(0, separator));
    const value = decode(entry.slice(separator + 1));
    if (key && value) prices[key] = value;
  }
  return prices;
}

/** Keep the simple product form readable; escape part-row keys and typed values. */
export function serializePrices(prices: PrivatePrices): string {
  return Object.entries(prices).filter(([key, value]) => key && value.trim()).map(([key, value]) => `${encodeURIComponent(key)}:${encodeURIComponent(value)}`).join(',');
}

/** Synchronous, user-triggered download; delayed cleanup also works in Safari. */
export function downloadCsvText(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
