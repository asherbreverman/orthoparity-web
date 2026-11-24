import { afterEach, describe, expect, it, vi } from 'vitest';
import { boundedPageData, pageSubject, PAGE_CACHE_MS, PAGE_WAIT_MS, previewMetadata, productPreview, vendorPreview } from '@/lib/page-preview';
import type { Brief } from '@/lib/reviewer-data';
import type { VendorSignals } from '@/lib/signals';

afterEach(() => vi.useRealTimers());
describe('Public page reads', () => {
  it('allows at least an hour of caching', () => expect(PAGE_CACHE_MS).toBe(3600000));
  it('stops optional reads at two seconds and preserves finished live counts', async () => {
    vi.useFakeTimers();
    const abort = vi.fn();
    const pending = boundedPageData({ meta: Promise.resolve({ starting_set_clearances: '18224' }), coverage: Promise.resolve({ count: 1898, devices: 18355, first: 1971, last: 2026 }), preview: new Promise(() => {}) }, abort);
    await vi.advanceTimersByTimeAsync(1999);
    expect(abort).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(await pending).toEqual({ meta: { starting_set_clearances: '18224' }, coverage: { count: 1898, devices: 18355, first: 1971, last: 2026 }, preview: null });
    expect(abort).toHaveBeenCalledOnce();
    expect(PAGE_WAIT_MS).toBe(2000);
  });
  it('failed reads leave browser fallbacks available', async () => {
    expect(await boundedPageData({ meta: Promise.reject(new Error('private provider detail')), coverage: Promise.reject(new Error('unavailable')), preview: Promise.resolve(null) }, vi.fn())).toEqual({ meta: null, coverage: null, preview: null });
  });
  it('normalizes the selected clearance and prioritizes it over a vendor', () => expect(pageSubject({ k: 'k151105', v: 'stryker' })).toEqual({ k: 'K151105', v: '' }));
  it('returns only the selected product title and one-sentence description', () => {
    const brief = { found: true, device: { device_name: 'Smith and Nephew Suture Anchors - 5.0mm Absorbable Polymer Anchor, Smith and Nephew Suture Anchors - TAG Bioraptor', knumber: 'K151105' }, product_code: { plain_description: 'A biodegradable anchor.', procedures: 'Rotator cuff repair' } } as Brief;
    expect(productPreview(brief)).toEqual({ title: 'Smith and Nephew Suture Anchors - 5.0mm Absorbable Polymer Anchor (K151105) | OrthoParity', description: 'A biodegradable anchor, used in rotator cuff repair.' });
  });
  it('uses the vendor display name and source bottom line', () => {
    const signals: VendorSignals = { found: true, mode: 'current', vendor: { display_name: 'Stryker' }, bottom_line: 'Public orthopedic records.', cards: [], competition: [], acquisitions: [], notes: [] };
    expect(vendorPreview(signals)).toEqual({ title: 'Stryker: orthopedic devices, payments and recalls | OrthoParity', description: 'Public orthopedic records.' });
  });
  it('formats the PFN product tab without changing the clearance number', () => {
    const brief = { found: true, device: { device_name: 'PROXIMAL FEMORAL NAIL (PFN) SYSTEM', knumber: 'K970097' } } as Brief;
    expect(productPreview(brief)?.title).toBe('Proximal Femoral Nail (PFN) System (K970097) | OrthoParity');
  });
  it('canonicalizes the product without transient comparison or view state', () => expect(previewMetadata({ k: 'K151105', v: '' }, null).url).toBe('https://www.orthoparity.com/?k=K151105'));
  it('canonicalizes the vendor without dropping its id', () => expect(previewMetadata({ k: '', v: 'stryker' }, null).url).toBe('https://www.orthoparity.com/?v=stryker'));
  it('falls back to the home title and description after an unsuccessful lookup', () => {
    const home = previewMetadata({ k: 'K000000', v: '' }, null);
    expect(home.title).toBe('OrthoParity: orthopedic part, product and company benchmarks from public FDA and CMS data');
    expect(home.description).toBe('Their public record plus your private pricing. Look up any orthopedic part, product or company, or put them side by side. Free and open source, built only from public FDA and CMS data. OrthoParity never asks for your pricing.');
  });
});