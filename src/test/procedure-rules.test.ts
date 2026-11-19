import {describe, expect, it} from 'vitest';
import {flagshipFirst, procedureDollars, sharePosition, worksheetTotals, procedureVendorName, type ProcedureSummary} from '@/lib/procedure-data';

describe('Procedure worksheet rules', () => {
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