import { describe, expect, it } from 'vitest';
import { vendorCoverage, fallbackVendorCoverage } from '@/lib/vendor-coverage';
import { getVendorCoverage } from '@/lib/predicate-data';

describe('Vendor coverage', () => {
  it('uses the requested loading and failure fallback', () => {
    expect(fallbackVendorCoverage).toEqual({count:1898,first:1971,last:2026,devices:18355});
    expect(vendorCoverage(null, undefined, undefined, undefined)).toEqual({count:1898,first:1971,last:2026,devices:18355});
  });
  it('uses the exact count and minimum and maximum supplied years', () => {
    expect(vendorCoverage(3123,4000,1978,2027)).toEqual({count:3123,devices:4000,first:1978,last:2027});
  });
  it('keeps the fallback device count when the RPC omits it', () => {
    expect(vendorCoverage(1898, undefined, 1971, 2026)).toEqual({count:1898,devices:18355,first:1971,last:2026});
  });
  it('reads parent-company coverage and year bounds from the coverage RPC', async () => {
    expect(await getVendorCoverage()).toEqual({count:1898,devices:18355,first:1971,last:2026});
  }, 30000);
});