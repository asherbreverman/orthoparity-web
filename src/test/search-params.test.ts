import { describe, expect, it } from 'vitest';
import { parsePlainSearch, stringifyPlainSearch } from '@/lib/search-params';
describe('plain search params', () => {
  it('writes all-digit part numbers without quotes', () => expect(stringifyPlainSearch({ k: 'K140881', part: '5251300' })).toBe('?k=K140881&part=5251300'));
  it('reads digits as strings', () => expect(parsePlainSearch('?part=5251300')).toEqual({ part: '5251300' }));
  it('strips quotes from old links', () => expect(parsePlainSearch('?part=%225251300%22')).toEqual({ part: '5251300' }));
});
