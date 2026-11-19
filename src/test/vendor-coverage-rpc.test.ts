import { describe, expect, it, vi } from 'vitest';
import { getVendorCoverage } from '@/lib/predicate-data';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({supabase: {rpc: vi.fn().mockResolvedValue({data: {parent_companies:1895, filer_companies:1964, first_year:1976, last_year:2026}, error:null}), from: vi.fn()}}));

describe('Cached parent-company coverage', () => {
  it('uses one RPC, not vendor table reads, and counts parents rather than filers', async () => {
    const first = getVendorCoverage();
    expect(getVendorCoverage()).toBe(first);
    expect(await first).toEqual({count:1895, first:1976, last:2026});
    expect(supabase.rpc).toHaveBeenCalledExactlyOnceWith('pc_vendor_coverage');
    expect(supabase.from).not.toHaveBeenCalled();
  });
});