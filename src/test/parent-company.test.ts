import { describe, expect, it } from 'vitest';
import { ownerLine, redirectNavigation, showsRedirectNote, vendorOption, type DeviceOwner, type VendorResolve } from '@/lib/vendor-data';
const base: DeviceOwner = { found: true, knumber: 'K1', filer: 'X', filer_vendor_id: 'x', owner_vendor_id: 'x', owner_name: 'X', now_part_of: false, divested: false, explanation: null, source_url: null };
const res = (o: Partial<VendorResolve>): VendorResolve => ({ found: true, requested: 'nuvasive', requested_name: 'NuVasive', vendor_id: 'globus', name: 'Globus Medical', redirected: true, event: 'acquired', explanation: 'NuVasive was acquired by Globus Medical on 2023-09-01.', steps: [], ...o });
describe('parent-company rules', () => {
  it('redirect replaces history and keeps from', () => {
    expect(redirectNavigation('globus', 'nuvasive', 'brief')).toEqual({ to: '/', search: { v: 'globus', from: 'nuvasive', view: undefined }, replace: true });
  });
  it('notice shows only when from resolves to v', () => {
    expect(showsRedirectNote(res({}), 'globus')).toBe(true);
    expect(showsRedirectNote(res({}), 'stryker')).toBe(false);
    expect(showsRedirectNote(res({ redirected: false }), 'globus')).toBe(false);
  });
  it('search option text with and without via', () => {
    const o = vendorOption({ vendor_id: 'globus', display_name: 'Globus Medical', segment: 'Spine', clearances: 387, via_name: 'NuVasive' });
    expect(o.extra).toBe('via NuVasive'); expect(o.label).toBe('Globus Medical, via NuVasive'); expect(o.detail).toBe('Spine · 510(k)s: 387');
    const g = vendorOption({ vendor_id: 'globus', display_name: 'Globus Medical', clearances: 387 });
    expect(g.label).toBe('Globus Medical'); expect(g.extra).toBeUndefined();
  });
  it('divested product shows owner with source', () => {
    expect(ownerLine({ ...base, owner_name: 'Stryker', now_part_of: true, divested: true, explanation: 'This product line was sold to Stryker on 2024-09-11.', source_url: 'https://example.com/a' })).toEqual({ text: 'Now part of Stryker. This product line was sold to Stryker on 2024-09-11.', source: 'https://example.com/a' });
  });
  it('acquired filer shows owner without source', () => {
    expect(ownerLine({ ...base, owner_name: 'Globus Medical', now_part_of: true, explanation: 'NuVasive was acquired by Globus Medical on 2023-09-01.', source_url: 'https://example.com/b' })).toEqual({ text: 'Now part of Globus Medical. NuVasive was acquired by Globus Medical on 2023-09-01.', source: null });
  });
  it('own parent shows no line', () => { expect(ownerLine(base)).toBeNull(); });
});
