import { describe, expect, it } from 'vitest';
import { getMeta, searchDevices, getFamily, lookupChain } from '@/lib/predicate-data';
import { statistics } from '@/lib/predicate-chain';

// Public read-only integration checks against the connected research dataset.
// Only SELECT pc_meta and the three existing research RPCs are invoked.
describe('Connected Predicate Chain acceptance checks', () => {
  it('K241487 reaches 715 devices', async () => {
    const meta = await getMeta();
    const chain = await lookupChain(['K241487'], Number(meta.max_generations));
    expect(statistics(chain).devices).toBe(715);
  }, 30000);
  it('K241487 reaches generation 10', async () => {
    const chain = await lookupChain(['K241487'], 10);
    expect(statistics(chain).deepest).toBe(10);
  }, 30000);
  it('K241487 reaches decision year 1979', async () => {
    const chain = await lookupChain(['K241487'], 10);
    expect(statistics(chain).earliest).toBe(1979);
  }, 30000);
  it('Interwedge search lists two clearances', async () => {
    expect((await searchDevices('Interwedge')).map(row => row.knumber)).toEqual(['K261809','K241487']);
  }, 30000);
  it('K110694 CONCORDE brand family contains 21 ancestry devices', async () => {
    const family = await getFamily('K110694');
    expect(family.brand).toBe('CONCORDE');
    const chain = await lookupChain(family.family.map(row => row.knumber), 10);
    expect(statistics(chain).devices).toBe(21);
  }, 30000);
  it('K110694 has 11 excluded name matches', async () => {
    expect((await getFamily('K110694')).excluded).toHaveLength(11);
  }, 30000);
  it('loads the release metadata used by the header', async () => {
    const meta = await getMeta();
    expect(meta.exported_utc).toBe('2026-11-17 18:23');
    expect(meta.parser_version).toBe('1.3.1');
    expect(meta.max_generations).toBe('10');
  }, 30000);
});