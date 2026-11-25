import { describe, expect, it, vi } from 'vitest';
import { getVendorCoverage } from '@/lib/predicate-data';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({supabase: {rpc: vi.fn().mockResolvedValue({data: {parent_companies:1898, devices:18355, approvals:131, filer_companies:2000, first_year:1971, last_year:2026, data_end:'2026-11-13', with_product_code:18267}, error:null}), from: vi.fn()}}));

describe('Cached parent-company coverage', () => {
  it('uses one RPC, not vendor table reads, and counts parents rather than filers', async () => {
    const first = getVendorCoverage();
    expect(getVendorCoverage()).toBe(first);
    expect(await first).toEqual({count:1898, devices:18355, first:1971, last:2026, data_end:'2026-11-13', with_product_code:18267});
    expect(supabase.rpc).toHaveBeenCalledExactlyOnceWith('pc_vendor_coverage');
    expect(supabase.from).not.toHaveBeenCalled();
  });
});