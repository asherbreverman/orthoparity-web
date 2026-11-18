import {describe,expect,it} from 'vitest';
import {getVendorBrief,getVendorPortfolio,getVendorComparison,getProductPayments,searchVendors} from '@/lib/predicate-data';
describe('Public vendor RPC acceptance checks',()=>{
 it('finds Globus and returns the ownership-specific portfolio',async()=>{expect((await searchVendors('globus')).find(v=>v.vendor_id==='globus')?.display_name).toBe('Globus Medical');const pit=await getVendorBrief('globus','pit');const current=await getVendorBrief('globus','current');expect(pit.portfolio.clearances).toBe(171);expect(current.portfolio.clearances).toBe(368);expect(current.family.find(f=>f.vendor_id==='nuvasive')?.since).toBe('2023-09-01');},30000);
 it('loads the requested 500-row-bounded portfolio on demand',async()=>{const rows=await getVendorPortfolio('globus','pit');expect(rows.length).toBe(171);expect(rows.length).toBeLessThanOrEqual(500);expect(rows.some(r=>r.knumber==='K253876')).toBe(true);},30000);
 it('compares anonymous professional relationships without individual records',async()=>{const result=await getVendorComparison('globus','medtronic','pit');expect(result.found).toBe(true);expect(result.shared_surgeons.all_years).toBe(221);expect(result.shared_surgeons.latest_year).toBe(95);expect(Object.keys(result.shared_surgeons).sort()).toEqual(['a_relationships','all_years','b_relationships','definition','latest_year']);},30000);
 it('keeps exact and brand-match payments distinct for HEDRON',async()=>{const p=await getProductPayments('K253876');expect(p.exact.total).toBe(0);expect(p.brand_match.total).toBeGreaterThan(3000000);expect(p.brand).toBe('HEDRON');expect(p.royalty).toBe(3174936.41);},30000);
 it('preserves a missing payment profile instead of inventing records',async()=>{const b=await getVendorBrief('n_medical','pit');expect(b.found).toBe(true);expect(b.payments.profile_latest).toBeNull();expect(b.payments.mix_latest).toEqual([]);},30000);
});
import {getSignals,getVendorSignals} from '@/lib/predicate-data';
describe('Decision signal RPCs',()=>{
 it('returns five product cards for K253876',async()=>{const s=await getSignals('K253876');expect(s.found).toBe(true);expect(s.cards.map(c=>c.key)).toEqual(['novelty','alternatives','payments','evidence','catalog']);expect(s.header.product_code).toBe('OVE');},30000);
 it('returns six vendor cards for Globus',async()=>{const s=await getVendorSignals('globus','pit');expect(s.found).toBe(true);expect(s.cards.map(c=>c.key)).toEqual(['breadth','momentum','ownership','payments','evidence','supply']);expect(s.acquisitions.find(a=>a.vendor_id==='nuvasive')?.date).toBe('2023-09-01');},30000);
});
