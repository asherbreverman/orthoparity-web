import { describe, expect, it, vi } from 'vitest';
import { getDataEnd } from '@/lib/predicate-data';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: vi.fn().mockResolvedValue({ data: '2026-11-13', error: null }), from: vi.fn() } }));

describe('FDA data end fallback', () => {
  it('uses one cached pc_data_end read', async () => {
    const first = getDataEnd();
    expect(getDataEnd()).toBe(first);
    expect(await first).toBe('2026-11-13');
    expect(supabase.rpc).toHaveBeenCalledExactlyOnceWith('pc_data_end');
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
