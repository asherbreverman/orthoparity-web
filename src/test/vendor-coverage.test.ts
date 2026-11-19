import { describe, expect, it } from 'vitest';
import { vendorCoverage, fallbackVendorCoverage } from '@/lib/vendor-coverage';
import { getVendorCoverage } from '@/lib/predicate-data';

describe('Vendor coverage', () => {
  it('uses the requested loading and failure fallback', () => {
    expect(fallbackVendorCoverage).toEqual({count:2040,first:1976,last:2026});
    expect(vendorCoverage(null, undefined, undefined)).toEqual({count:2040,first:1976,last:2026});
  });
  it('uses the exact count and minimum and maximum supplied years', () => {
    expect(vendorCoverage(3123,1978,2027)).toEqual({count:3123,first:1978,last:2027});
  });
  it('reads parent-company coverage and year bounds from the coverage RPC', async () => {
    expect(await getVendorCoverage()).toEqual({count:1895,first:1976,last:2026});
  }, 30000);
});