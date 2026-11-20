import { describe, expect, it, vi } from 'vitest';
const rpc = vi.hoisted(() => vi.fn(async () => ({ data: { vendor_id: 'globus' }, error: null })));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc } }));
import { getVendorSupplier } from '@/lib/supplier';
describe('Supplier read cache', () => {
  it('shares one promise for the vendor and mode', async () => {
    const pending = getVendorSupplier('globus', 'current');
    expect(getVendorSupplier('globus', 'current')).toBe(pending);
    expect((await pending).vendor_id).toBe('globus');
    expect(rpc).toHaveBeenCalledExactlyOnceWith('pc_vendor_supplier', { v: 'globus', m: 'current' });
  });
  it('separates ownership modes', async () => {
    rpc.mockClear();
    const current = getVendorSupplier('stryker', 'current');
    const pit = getVendorSupplier('stryker', 'pit');
    expect(current).not.toBe(pit);
    await Promise.all([current, pit]);
    expect(rpc).toHaveBeenCalledTimes(2);
  });
});