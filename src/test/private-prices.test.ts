import { describe, expect, it } from 'vitest';
import { parsePricesHash, serializePrices } from '@/lib/private-prices';

describe('private price fragments', () => {
  it('keeps the documented product form readable', () => {
    const encoded = serializePrices({ K171651: '1250', K250477: '980' });
    expect(encoded).toBe('K171651:1250,K250477:980');
    expect(parsePricesHash(`#prices=${encoded}`)).toEqual({ K171651: '1250', K250477: '980' });
  });

  it('round-trips part-row keys, commas, dollar signs and hash characters', () => {
    const prices = { '2136505@K011976': '$1,250.50 # list' };
    expect(parsePricesHash(`#prices=${serializePrices(prices)}`)).toEqual(prices);
  });

  it('omits blank prices and ignores malformed entries', () => {
    expect(serializePrices({ K171651: '  ' })).toBe('');
    expect(parsePricesHash('#prices=broken,K171651:1250,%ZZ:900')).toEqual({ K171651: '1250' });
  });
});
