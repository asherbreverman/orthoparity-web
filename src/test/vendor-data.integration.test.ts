import {describe,expect,it} from 'vitest';
import {getVendorBrief,getVendorPortfolio,getVendorComparison,getProductPayments,searchVendors} from '@/lib/predicate-data';
describe('Public vendor RPC acceptance checks',()=>{
 it('finds Globus and returns the parent-company portfolio',async()=>{expect((await searchVendors('globus')).find(v=>v.vendor_id==='globus')?.display_name).toBe('Globus Medical');const pit=await getVendorBrief('globus','current');const current=await getVendorBrief('globus','current');expect(pit.portfolio.clearances).toBe(387);expect(current.portfolio.clearances).toBe(387);expect(current.family.find(f=>f.vendor_id==='nuvasive')?.since).toBe('2023-09-01');},30000);
 it('loads the requested 500-row-bounded portfolio on demand',async()=>{const rows=await getVendorPortfolio('globus','current');expect(rows.length).toBe(387);expect(rows.length).toBeLessThanOrEqual(500);expect(rows.some(r=>r.knumber==='K253876')).toBe(true);},30000);
 it('compares anonymous professional relationships without individual records',async()=>{const result=await getVendorComparison('globus','medtronic','current');expect(result.found).toBe(true);expect(result.shared_surgeons.all_years).toBe(249);expect(result.shared_surgeons.latest_year).toBeGreaterThan(0);expect(Object.keys(result.shared_surgeons).sort()).toEqual(['a_relationships','all_years','b_relationships','definition','latest_year']);},30000);
 it('keeps exact and brand-match payments distinct for HEDRON',async()=>{const p=await getProductPayments('K253876');expect(p.exact.total).toBe(0);expect(p.brand_match.total).toBeGreaterThan(3000000);expect(p.brand).toBe('HEDRON');expect(p.royalty).toBe(3174936.41);},30000);
 it('preserves a missing payment profile instead of inventing records',async()=>{const b=await getVendorBrief('n_medical','current');expect(b.found).toBe(true);expect(b.payments.profile_latest).toBeNull();expect(b.payments.mix_latest).toEqual([]);},30000);
});
import {getSignals,getVendorSignals} from '@/lib/predicate-data';
import {resolveVendor} from '@/lib/predicate-data';
import {sourceLinks,showsRedirectNote} from '@/lib/vendor-data';
import {askLines} from '@/lib/signals';
describe('Parent-company vendor benchmarking',()=>{
 it('finds Globus when searching NuVasive',async()=>{const r=(await searchVendors('nuvasive')).find(v=>v.vendor_id==='globus');expect(r?.via_vendor_id).toBe('nuvasive');expect(r?.via_name).toBe('NuVasive');},30000);
 it('redirects NuVasive to Globus with a dated sourced note',async()=>{const r=await resolveVendor('nuvasive');expect(r.redirected).toBe(true);expect(r.vendor_id).toBe('globus');expect(r.steps[0]?.date).toBe('2023-09-01');expect(sourceLinks(r.steps).map(l=>l.label)).toEqual(['Source']);expect(showsRedirectNote(r,'globus')).toBe(true);expect(showsRedirectNote(r,'medtronic')).toBe(false);},30000);
 it('does not redirect a parent company',async()=>{const r=await resolveVendor('globus');expect(r.redirected).toBe(false);expect(showsRedirectNote(r,'globus')).toBe(false);},30000);
});
describe('Decision signal RPCs',()=>{
 it('keeps all twelve K230088 boxes mapped to their own evidence',async()=>{const s=await getSignals('K230088');expect(s.cards.map(c=>c.evidence)).toEqual(['predicates','indications','owner','alternatives','payments','research','catalog','recalls','maude','supplier','procedures','addon']);expect(askLines(s.cards).length).toBeGreaterThanOrEqual(12);},30000);
 it('keeps all twenty triggered Stryker questions',async()=>{const s=await getVendorSignals('stryker','current');expect(s.cards.length).toBe(11);expect(askLines(s.cards).length).toBe(20);expect(s.cards.map(c=>c.evidence)).toEqual(['competition','portfolio','ownership','payments','research','brands','recalls','maude','supplier','procedures','addon']);},30000);
 it('returns twelve product cards for K253876',async()=>{const s=await getSignals('K253876');expect(s.found).toBe(true);expect(s.cards.map(c=>c.key)).toEqual(['novelty','indications','owner','alternatives','payments','evidence','catalog','recalls','adverse_events','supplier','medicare','add_on']);expect(s.header.product_code).toBe('OVE');},30000);
 it('returns eleven vendor cards for Globus',async()=>{const s=await getVendorSignals('globus','current');expect(s.found).toBe(true);expect(s.cards.map(c=>c.key)).toEqual(['breadth','momentum','ownership','payments','evidence','supply','recalls','adverse_events','supplier','medicare','add_on']);expect(s.acquisitions.find(a=>a.vendor_id==='nuvasive')?.date).toBe('2023-09-01');},30000);
});
