import {describe, expect, it} from 'vitest';
import {getProcedureList, getProcedure} from '@/lib/predicate-data';
describe('Public procedure reads', () => {
  it('caches the procedure list for the session', async () => {
    const first = getProcedureList();
    expect(getProcedureList()).toBe(first);
    const result = await first;
    expect(result.procedures.find(p => p.family_id === 'hip_knee_replacement')).toMatchObject({data_year:2024, medicare_pays:14636, total_payment:17727});
    expect(result.notes.limitations.length).toBeGreaterThan(0);
  }, 30000);
  it('reads supplied ranges and the seven questions without deriving payments', async () => {
    const first = getProcedure('hip_knee_replacement');
    expect(getProcedure('hip_knee_replacement')).toBe(first);
    const result = await first;
    expect(result.found).toBe(true);
    expect(result.supply_range).toEqual({shares:[.3,.4,.5], on_medicare:[4391,5855,7318], on_total:[5318,7091,8864]});
    expect(result.worksheet).toHaveLength(7);
    expect(result.devices.find(d => d.product_code === 'JWH')?.vendors.some(v => v.vendor_id === 'stryker')).toBe(true);
  }, 30000);
  it('preserves the not-found response', async () => {
    expect((await getProcedure('not_a_procedure')).found).toBe(false);
  }, 30000);
});