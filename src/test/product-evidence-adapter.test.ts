import { describe, expect, it, vi } from 'vitest';
const rpc = vi.hoisted(() => vi.fn(async (_name: string, args: { k: string }) => ({ data: { knumber: args.k, found: true, similarity: 0.27 }, error: null })));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc } }));
import { getDeviceIndications, getDeviceOwner } from '@/lib/predicate-data';
import { getDeviceSupplier } from '@/lib/supplier';
describe('Cached product evidence reads', () => {
  it('shares indications by K number and preserves the supplied similarity', async () => {
    const pending = getDeviceIndications('K230088');
    expect(getDeviceIndications('K230088')).toBe(pending);
    expect((await pending).similarity).toBe(0.27);
    expect(rpc).toHaveBeenCalledExactlyOnceWith('pc_device_indications', { k: 'K230088' });
  });
  it('shares the existing owner read by K number', async () => {
    rpc.mockClear();
    const pending = getDeviceOwner('K230088');
    expect(getDeviceOwner('K230088')).toBe(pending);
    expect((await pending).found).toBe(true);
    expect(rpc).toHaveBeenCalledExactlyOnceWith('pc_device_owner', { k: 'K230088' });
  });
  it('shares supplier evidence by K number', async () => {
    rpc.mockClear();
    const pending = getDeviceSupplier('K230088');
    expect(getDeviceSupplier('K230088')).toBe(pending);
    expect((await pending).knumber).toBe('K230088');
    expect(rpc).toHaveBeenCalledExactlyOnceWith('pc_device_supplier', { k: 'K230088' });
  });
  it('keeps different devices separate in the new read caches', async () => {
    rpc.mockClear();
    const indications = getDeviceIndications('K203153');
    const supplier = getDeviceSupplier('K203153');
    expect(indications).not.toBe(getDeviceIndications('K230088'));
    expect(supplier).not.toBe(getDeviceSupplier('K230088'));
    expect((await indications).knumber).toBe('K203153');
    expect((await supplier).knumber).toBe('K203153');
    expect(rpc).toHaveBeenCalledTimes(2);
  });
});