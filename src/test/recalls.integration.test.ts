import {describe,it,expect} from 'vitest';
import {getDeviceRecalls,getVendorRecalls} from '@/lib/predicate-data';
describe('existing recall RPCs',()=>{
  it('reads K254043 and its predicate recall event',async()=>{const data=await getDeviceRecalls('K254043');expect(data.knumber).toBe('K254043');expect(data.device).toEqual([]);expect(data.predicates.some(e=>String(e.event_id)==='75540')).toBe(true);expect(data.category?.product_code).toBe('LPH');},30000);
  it('reads at most 50 vendor events in each ownership mode',async()=>{const [pit,current]=await Promise.all([getVendorRecalls('globus','pit'),getVendorRecalls('globus','current')]);expect(pit.events_all).toBe(5);expect(pit.events).toHaveLength(5);expect(current.events_all).toBeGreaterThanOrEqual(pit.events_all);expect(current.events.length).toBeLessThanOrEqual(50);expect(pit.events.some(e=>e.recall_class==='Class I'&&e.status==='Open')).toBe(true);},30000);
});