import { describe, expect, it } from 'vitest';
import { getMeta, searchDevices, getFamily, lookupChain, getBrief, compareDevices, batchDevices } from '@/lib/predicate-data';
import { statistics } from '@/lib/predicate-chain';

// Public read-only integration checks against the connected research dataset.
// Only the existing read-only research RPCs and metadata SELECT are invoked.
describe('Connected Predicate Chain acceptance checks', () => {
  it('loads device-tailored VAC questions from the existing brief RPC', async () => {
    const brief = await getBrief('K253876');
    expect(brief.vac_questions).toHaveLength(16);
    expect(brief.vac_questions?.[0]?.topic).toBe('Coding and reimbursement');
    expect(brief.vac_questions?.[0]?.question).toContain('Anterior cervical discectomy and fusion (ACDF)');
  }, 30000);
  it('loads K110694 reviewer brief from the existing brief function', async () => {
    const brief = await getBrief('K110694');
    expect(brief.found).toBe(true);
    expect(brief.product_code?.plain_name).toBe('Lumbar interbody cage');
    expect(brief.peers.total).toBe(126);
    expect(brief.ifu?.found).toBe(true);
  }, 30000);
  it('compares K110694 and K241487 through shared ancestry', async () => {
    const comparison = await compareDevices('K110694', 'K241487');
    expect(comparison.shared_count).toBe(18);
    expect(comparison.shared_ancestors.find(row => row.knumber === 'K081917')).toMatchObject({gen_a: 1, gen_b: 3});
  }, 30000);
  it('batch keeps missing clearance results visible', async () => {
    const rows = await batchDevices(['K110694','K999999']);
    expect(rows.find(row=>row.knumber==='K110694')?.found).toBe(true);
    expect(rows.find(row=>row.knumber==='K999999')?.found).toBe(false);
  }, 30000);
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
    expect(meta.exported_utc).toBe('2026-11-17 20:13');
    expect(meta.parser_version).toBe('1.3.1');
    expect(meta.max_generations).toBe('10');
  }, 30000);
});