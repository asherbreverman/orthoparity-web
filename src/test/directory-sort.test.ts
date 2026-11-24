import { describe, expect, it } from 'vitest';
import { directoryProcedureOptions, filterCodesByProcedure, sortCodes, type DirectoryCode } from '@/lib/directory';
import { isStateQuery, stateHospitals, type TeamHospital } from '@/lib/team';

const code = (product_code: string, products: number, latest: string | null, fams: string[] = []): DirectoryCode => ({ product_code, plain_name: product_code, fda_name: null, device_class: 2, anatomy: null, kind: null, products, approvals: 0, companies: 1, companies_last5: 0, listed_in_distribution: 0, latest, procedures: fams.map(f => ({ family_id: f, name: f.toUpperCase() })) });
const codes = [code('AAA', 10, '2020-01-01', ['knee']), code('BBB', 50, '2019-01-01'), code('CCC', 5, '2026-05-01', ['knee', 'hip'])];

describe('browse sort and procedure filter', () => {
  it('sorts by most records', () => expect(sortCodes(codes, 'records').map(c => c.product_code)).toEqual(['BBB', 'AAA', 'CCC']));
  it('sorts by latest record', () => expect(sortCodes(codes, 'latest').map(c => c.product_code)).toEqual(['CCC', 'AAA', 'BBB']));
  it('keeps only codes linked to the procedure', () => expect(filterCodesByProcedure(codes, 'hip').map(c => c.product_code)).toEqual(['CCC']));
  it('lists each linked procedure once', () => expect(directoryProcedureOptions([{ segment: 'Recon', product_codes: 3, products: 65, companies: 3, codes }]).map(p => p.family_id)).toEqual(['hip', 'knee']));
});

describe('TEAM state search', () => {
  const h = (hospital: string, state: string) => ({ hospital, state, ccn: hospital }) as TeamHospital;
  it('treats two letters as a state', () => { expect(isStateQuery('az')).toBe(true); expect(isStateQuery('Phoenix')).toBe(false); });
  it('drops name matches from other states', () => expect(stateHospitals([h('ADVENTHEALTH CASTLE ROCK', 'CO'), h('UCSF', 'CA')], 'ca').map(x => x.hospital)).toEqual(['UCSF']));
});
