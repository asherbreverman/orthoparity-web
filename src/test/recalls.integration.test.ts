import {describe,it,expect} from 'vitest';
import {getDeviceRecalls,getVendorRecalls} from '@/lib/predicate-data';
describe('existing recall RPCs',()=>{
  it('reads K254043 and its predicate recall event',async()=>{const data=await getDeviceRecalls('K254043');expect(data.knumber).toBe('K254043');expect(data.device).toEqual([]);expect(data.predicates.some(e=>String(e.event_id)==='75540')).toBe(true);expect(data.category?.product_code).toBe('LPH');},30000);
  it('reads at most 50 parent-company vendor events',async()=>{const r=await getVendorRecalls('globus','current');expect(r.events.length).toBeLessThanOrEqual(50);expect(r.events_all).toBeGreaterThanOrEqual(5);},30000);
});