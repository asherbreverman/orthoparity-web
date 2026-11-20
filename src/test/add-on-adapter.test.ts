import { describe, expect, it, vi } from 'vitest';
const rpc = vi.hoisted(() => vi.fn(async () => ({ data: { knumber: 'K230088', items: [] }, error: null })));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc } }));
import { getDeviceAddOn, getVendorAddOn } from '@/lib/add-on';
describe('Read-only cached Medicare add-on adapter', () => {
  it('shares one product RPC promise', async () => {
    const first = getDeviceAddOn('K230088');
    expect(getDeviceAddOn('K230088')).toBe(first);
    expect((await first).knumber).toBe('K230088');
    expect(rpc).toHaveBeenCalledExactlyOnceWith('pc_device_add_on', { k: 'K230088' });
  });
  it('shares one vendor RPC promise', async () => {
    rpc.mockClear();
    const first = getVendorAddOn('stryker', 'current');
    expect(getVendorAddOn('stryker', 'current')).toBe(first);
    await first;
    expect(rpc).toHaveBeenCalledExactlyOnceWith('pc_vendor_add_on', { v: 'stryker', m: 'current' });
  });
  it('keeps ownership modes separate', async () => {
    rpc.mockClear();
    const a = getVendorAddOn('medtronic', 'current');
    const b = getVendorAddOn('medtronic', 'pit');
    expect(a).not.toBe(b);
    await Promise.all([a, b]);
    expect(rpc).toHaveBeenCalledWith('pc_vendor_add_on', { v: 'medtronic', m: 'pit' });
    expect(rpc).toHaveBeenCalledTimes(2);
  });
});
