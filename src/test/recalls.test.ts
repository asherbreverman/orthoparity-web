import {describe,it,expect} from 'vitest';
import {recallDate,recallKnumbers,recallYears,recentRecallEvents,type RecallEvent} from '@/lib/recalls';
import {evidenceIsOpen} from '@/lib/signals';
describe('recall history rules',()=>{
  it('keeps recalls collapsed in the brief and opens them with every section in analyst detail',()=>{expect(evidenceIsOpen('brief',new Set(),'recalls')).toBe(false);expect(evidenceIsOpen('analyst',new Set(),'recalls')).toBe(true);expect(evidenceIsOpen('brief',new Set(['recalls']),'recalls')).toBe(true);});
  it('uses Mon YYYY for initiated dates',()=>{expect(recallDate('2023-12-15')).toBe('Dec 2023');expect(recallDate(null)).toBe('NOT FOUND');});
  it('extracts only named 510(k)s from array or delimited source',()=>{expect(recallKnumbers('K150862; K171651 K150862')).toEqual(['K150862','K171651']);expect(recallKnumbers(['K150862','unrelated'])).toEqual(['K150862']);});
  it('orders most recent events first without changing data',()=>{const rows=[{initiated:'2017-08-25'},{initiated:'2023-12-15'}] as RecallEvent[];expect(recentRecallEvents(rows)[0]?.initiated).toBe('2023-12-15');expect(rows[0]?.initiated).toBe('2017-08-25');});
  it('covers 2002 through the current year with zero-count gaps',()=>{const rows=recallYears([{year:2023,events:2}],2026);expect(rows).toHaveLength(25);expect(rows[0]).toEqual({year:2002,events:0});expect(rows[21]).toEqual({year:2023,events:2});expect(rows[24]).toEqual({year:2026,events:0});});
});