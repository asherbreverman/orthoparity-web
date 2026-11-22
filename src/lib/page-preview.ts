import { benchmarkDescription, benchmarkOrigin, benchmarkTitle, pageTitle } from './benchmark-brand';
import { companyName, displayName, productSentence, shortDeviceName } from './format';
import type { Brief } from './reviewer-data';
import type { VendorSignals } from './signals';
import type { Meta } from './predicate-chain';
import type { VendorCoverage } from './vendor-coverage';

export const PAGE_CACHE_MS = 60 * 60 * 1000;
export const PAGE_WAIT_MS = 2000;
export interface PageSubject { k: string; v: string }
export interface PagePreview { title: string; description: string }
export interface PageData { meta: Meta | null; coverage: VendorCoverage | null; preview: PagePreview | null }
export const emptyPageData = (): PageData => ({ meta: null, coverage: null, preview: null });
export function pageSubject(input: { k?: string | undefined; v?: string | undefined }): PageSubject {
  const k = (input.k ?? '').trim().toUpperCase();
  return { k: /^(K|DEN)\d{6}$/.test(k) ? k : '', v: k ? '' : (input.v ?? '').trim().slice(0, 150) };
}
export function productPreview(brief: Brief): PagePreview | null {
  if (!brief.found || !brief.device) return null;
  const device = brief.device;
  const category = brief.product_code;
  return {
    title: pageTitle(`${shortDeviceName(displayName(device.device_name ?? device.knumber))} (${device.knumber})`),
    description: productSentence(category?.plain_description ?? `Cleared by FDA as ${category?.plain_name ?? category?.fda_name ?? 'Category unavailable'}`, category?.procedures),
  };
}
export function vendorPreview(signals: VendorSignals): PagePreview | null {
  const name = signals.vendor?.['display_name'];
  if (!signals.found || typeof name !== 'string' || !name) return null;
  return { title: pageTitle(`${companyName(name)}: orthopedic devices, payments and recalls`), description: signals.bottom_line };
}
export function previewMetadata(subject: PageSubject, preview: PagePreview | null) {
  const url = new URL('/', benchmarkOrigin);
  if (subject.k) url.searchParams.set('k', subject.k);
  else if (subject.v) url.searchParams.set('v', subject.v);
  return { title: preview?.title ?? benchmarkTitle, description: preview?.description ?? benchmarkDescription, url: url.href };
}
/** Completed fields survive a slow sibling; nothing waits beyond the deadline. */
export async function boundedPageData(reads: { meta: Promise<Meta>; coverage: Promise<VendorCoverage>; preview: Promise<PagePreview | null> }, onTimeout: () => void): Promise<PageData> {
  const result = emptyPageData();
  let accepting = true;
  const tasks = Object.entries(reads).map(async ([key, read]) => {
    try {
      const value = await read;
      if (accepting) Object.assign(result, { [key]: value });
    } catch { /* Optional search data must never prevent the page from rendering. */ }
  });
  let timer: ReturnType<typeof setTimeout> | undefined;
  await Promise.race([
    Promise.all(tasks),
    new Promise<void>(resolve => { timer = setTimeout(() => { accepting = false; onTimeout(); resolve(); }, PAGE_WAIT_MS); }),
  ]);
  accepting = false;
  clearTimeout(timer);
  return result;
}