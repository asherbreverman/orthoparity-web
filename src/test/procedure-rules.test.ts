import {describe, expect, it} from 'vitest';
import {flagshipFirst, procedureDollars, sharePosition, worksheetTotals, worksheetHasNumbers, procedureRoleGroups, procedureVendorName, type ProcedureDevice, type ProcedureSummary} from '@/lib/procedure-data';

describe('Procedure worksheet rules', () => {
  it('keeps results empty before any number, even when an item name is entered', () => {
    expect(worksheetHasNumbers([{item:'Cage', units:'', price:''}], '')).toBe(false);
  });
  it('treats an explicitly entered zero as a number', () => {
    expect(worksheetHasNumbers([{item:'', units:'0', price:''}], '')).toBe(true);
    expect(worksheetHasNumbers([], '0')).toBe(true);
  });
  it('returns to empty results when all numbers are cleared', () => {
    expect(worksheetHasNumbers([{item:'', units:'', price:'250'}], '')).toBe(true);
    expect(worksheetHasNumbers([{item:'', units:'', price:''}], '')).toBe(false);
  });
  it('includes only device roles with categories, in the existing order', () => {
    const devices = [{role:'implant'}, {role:'enabling technology'}] as ProcedureDevice[];
    expect(procedureRoleGroups(devices)).toEqual(['Implant','Enabling technology']);
    expect(procedureRoleGroups([])).toEqual([]);
  });
  it('adds units times price for the construct', () => {
    expect(worksheetTotals([{item:'Screw', units:'4', price:'250'}, {item:'Cage', units:'1', price:'2000'}], '', 10000, 12000).construct).toBe(3000);
  });
  it('adds other supplies to the construct per case', () => {
    expect(worksheetTotals([{item:'Cage', units:'1', price:'2000'}], '500', 10000, 12000).supplies).toBe(2500);
  });
  it('divides total supply cost by Medicare payment', () => {
    expect(worksheetTotals([{item:'Cage', units:'1', price:'3000'}], '500', 10000, 20000).medicareShare).toBe(.35);
  });
  it('divides total supply cost by total payment', () => {
    expect(worksheetTotals([{item:'Cage', units:'1', price:'3000'}], '500', 10000, 20000).totalShare).toBe(.175);
  });
  it('places shares against 30%, 40% and 50%', () => {
    expect([.2,.3,.35,.4,.45,.5,.6].map(sharePosition)).toEqual(['less than 30%','at 30%','between 30% and 40%','at 40%','between 40% and 50%','at 50%','more than 50%']);
  });
  it('does not divide by absent or zero payments', () => {
    expect(worksheetTotals([], '', 0, null)).toMatchObject({medicareShare:null, totalShare:null});
  });
  it('keeps empty and invalid input from producing invalid totals', () => {
    expect(worksheetTotals([{item:'', units:'', price:'Infinity'}], '-1', 100, 200).supplies).toBe(0);
  });
  it('formats $17,727 as whole dollars', () => {
    expect(procedureDollars(17727)).toBe('$17,727');
    expect(procedureDollars('NOT FOUND')).toBe('NOT FOUND');
  });
  it('preserves fractional worksheet inputs in the calculations', () => {
    expect(worksheetTotals([{item:'Implant', units:'2.5', price:'100.25'}], '49.375', 1000, 2000)).toEqual({construct:250.625, supplies:300, medicareShare:.3, totalShare:.15});
  });
  it.each([
    [3000, .3, .15, 'at 30%'],
    [4000, .4, .2, 'at 40%'],
    [5000, .5, .25, 'at 50%'],
  ])('places a $%s worksheet total at the correct Medicare boundary', (price, medicareShare, totalShare, position) => {
    const totals = worksheetTotals([{item:'Implant', units:'1', price:String(price)}], '', 10000, 20000);
    expect(totals.medicareShare).toBe(medicareShare);
    expect(totals.totalShare).toBe(totalShare);
    expect(sharePosition(totals.medicareShare)).toBe(position);
  });
  it.each([
    [.299999, 'less than 30%'], [.300001, 'between 30% and 40%'],
    [.399999, 'between 30% and 40%'], [.400001, 'between 40% and 50%'],
    [.499999, 'between 40% and 50%'], [.500001, 'more than 50%'],
    [null, 'NOT FOUND'],
  ])('places the share %s without rounding it into a boundary', (share, position) => {
    expect(sharePosition(share)).toBe(position);
  });
  it.each([
    [0, '$0'], [17727.49, '$17,727'], [17727.5, '$17,728'],
    [1234567890, '$1,234,567,890'], [null, 'NOT FOUND'], [undefined, 'NOT FOUND'],
    ['NOT FOUND', 'NOT FOUND'],
  ])('formats the procedure dollar value %s without inventing missing figures', (value, formatted) => {
    expect(procedureDollars(value)).toBe(formatted);
  });
  it('puts flagships first without changing relative source order', () => {
    const rows = [{family_id:'a', flagship:false}, {family_id:'b', flagship:true}, {family_id:'c', flagship:true}, {family_id:'d', flagship:false}] as ProcedureSummary[];
    expect(flagshipFirst(rows).map(r => r.family_id)).toEqual(['b','c','a','d']);
    expect(rows.map(r => r.family_id)).toEqual(['a','b','c','d']);
  });
  it('does not display hospital or surgeon names in vendor rows', () => {
    expect(procedureVendorName('The General Hospital Corporation')).toBe('Vendor');
    expect(procedureVendorName('Globus Medical')).toBe('Globus Medical');
  });
});