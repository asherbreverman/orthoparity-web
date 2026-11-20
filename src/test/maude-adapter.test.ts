import { describe, expect, it, vi } from 'vitest';
const rpc = vi.hoisted(() => vi.fn(async () => ({ data: { knumber: 'K120578', has_reports: true }, error: null })));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc } }));
import { getDeviceMaude, getVendorMaude } from '@/lib/predicate-data';
describe('Read-only cached MAUDE adapter', () => {
  it('shares one RPC promise per product', async () => {
    const first = getDeviceMaude('K120578');
    expect(getDeviceMaude('K120578')).toBe(first);
    expect((await first).knumber).toBe('K120578');
    expect(rpc).toHaveBeenCalledExactlyOnceWith('pc_device_maude', { k: 'K120578' });
  });
  it('shares a vendor read with the requested ten-product limit', async () => {
    rpc.mockClear();
    const first = getVendorMaude('stryker', 'current');
    expect(getVendorMaude('stryker', 'current')).toBe(first);
    await first;
    expect(rpc).toHaveBeenCalledExactlyOnceWith('pc_vendor_maude', { v: 'stryker', m: 'current', lim: 10 });
  });
  it('keeps ownership modes in separate cache entries', async () => {
    rpc.mockClear();
    const current = getVendorMaude('globus', 'current');
    const historical = getVendorMaude('globus', 'pit');
    expect(current).not.toBe(historical);
    await Promise.all([current, historical]);
    expect(rpc).toHaveBeenCalledWith('pc_vendor_maude', { v: 'globus', m: 'pit', lim: 10 });
    expect(rpc).toHaveBeenCalledTimes(2);
  });
});