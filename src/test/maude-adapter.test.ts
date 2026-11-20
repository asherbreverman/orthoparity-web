import { describe, expect, it, vi } from 'vitest';
const rpc = vi.hoisted(() => vi.fn(async () => ({ data: { knumber: 'K120578', has_reports: true }, error: null })));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc } }));
import { getDeviceMaude } from '@/lib/predicate-data';
describe('Read-only cached MAUDE adapter', () => {
  it('shares one RPC promise per product', async () => {
    const first = getDeviceMaude('K120578');
    expect(getDeviceMaude('K120578')).toBe(first);
    expect((await first).knumber).toBe('K120578');
    expect(rpc).toHaveBeenCalledExactlyOnceWith('pc_device_maude', { k: 'K120578' });
  });
});