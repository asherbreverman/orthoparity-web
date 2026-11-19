import {describe, expect, it} from 'vitest';
import {getProcedureList, getProcedure, getDeviceProcedures, getVendorProcedures} from '@/lib/predicate-data';
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
    expect((await getProcedure('not_a_family')).found).toBe(false);
  }, 30000);
  it('preserves the CMS suppression note and missing figures for DRG 461', async () => {
    const result = await getProcedure('hip_knee_replacement');
    expect(result.drgs.find(row => row.drg === '461')).toMatchObject({
      note:'Every hospital row suppressed by CMS (fewer than 11 discharges)',
      medicare_pays:null, patient_other_pays:null, total_payment:null,
    });
  }, 30000);
  it('links K241487 to spinal fusion as an implant without Medicare payments', async () => {
    const result = await getDeviceProcedures('K241487');
    expect(result.procedures.find(row => row.family_id === 'thoracolumbar_fusion')).toMatchObject({name:'Lumbar and thoracolumbar spinal fusion', role:'implant'});
    expect(result).not.toHaveProperty('payment');
    expect(result).not.toHaveProperty('medicare_pays');
  }, 30000);
  it('caches device procedures by 510(k) without payment fields', async () => {
    const first = getDeviceProcedures('K110694');
    expect(getDeviceProcedures('K110694')).toBe(first);
    const data = await first;
    expect(data.product_code).toBe('MAX');
    expect(data.procedures.some(p => p.family_id === 'thoracolumbar_fusion')).toBe(true);
    expect(data).not.toHaveProperty('payment');
  }, 30000);
  it('keeps pit and current-owner vendor procedure caches separate', async () => {
    const pit = getVendorProcedures('globus', 'pit');
    const current = getVendorProcedures('globus', 'current');
    expect(current).not.toBe(pit);
    expect(getVendorProcedures('globus', 'pit')).toBe(pit);
    const [a, b] = await Promise.all([pit, current]);
    expect(a.mode).toBe('pit');
    expect(b.mode).toBe('current');
    expect(a.procedures_total).toBe(8);
    expect(b.procedures.find(p => p.family_id === 'thoracolumbar_fusion')?.clearances_recent).toBeGreaterThan(a.procedures.find(p => p.family_id === 'thoracolumbar_fusion')?.clearances_recent ?? 0);
    expect(b).not.toHaveProperty('payment');
  }, 30000);
});