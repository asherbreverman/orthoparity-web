import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { getSignals } from '@/lib/predicate-data';
import { shortDeviceName } from '@/lib/format';
import { productComparisonRows } from '@/lib/product-comparison';
import { longDate, type Signals } from '@/lib/signals';
import { DeviceSearch, Status, useRefetch } from './reviewer-shared';
import { Button } from './ui/button';

export function ProductCompare({ k, compare, onCompare, onClose }: { k: string; compare?: string | undefined; onCompare: (k: string) => void; onClose: () => void }) {
  const [result, setResult] = useState<{ a: Signals; b: Signals } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [choosing, setChoosing] = useState(!compare);
  const reload = useRefetch();
  useEffect(() => {
    let active = true; setResult(null); setError(''); setBusy(!!compare); setChoosing(!compare);
    if (compare) Promise.all([getSignals(k), getSignals(compare)]).then(([a, b]) => { if (active) setResult({ a, b }); }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [k, compare, reload]);
  const row = (label: string, a: React.ReactNode, b: React.ReactNode) => <tr><th scope="row">{label}</th><td>{a}</td><td>{b}</td></tr>;
  const category = (s: Signals) => `${s.header.plain_name ?? s.header.fda_name ?? 'NOT FOUND'} (${s.header.product_code ?? 'NOT FOUND'})`;
  return <section className="brief-section" aria-label="Product comparison"><h2>Compare products</h2>
    {choosing && <DeviceSearch label="Pick a product to compare" onSelect={device => { setChoosing(false); onCompare(device.knumber); }} />}
    <Status busy={busy} error={error} />
    {result && (!result.a.found || !result.b.found) && <p className="section-caption">NOT FOUND: one of these products isn't in this database.</p>}
    {result?.a.found && result.b.found && <>
      {result.a.header.product_code !== result.b.header.product_code && <p className="section-caption">These products are in different FDA product codes, so some questions compare different categories.</p>}
      <div className="brief-table-scroll" tabIndex={0}><table className="brief-table product-comparison-table"><thead><tr><th scope="col">Question</th><th scope="col">{k}</th><th scope="col">{compare}</th></tr></thead><tbody>
        {row('Product', <Link to="/" search={{ k }} className="brief-link">{shortDeviceName(result.a.header.device_name ?? k)}</Link>, <Link to="/" search={{ k: compare }} className="brief-link">{shortDeviceName(result.b.header.device_name ?? compare ?? 'NOT FOUND')}</Link>)}
        {row('Company', result.a.header.company ?? 'NOT FOUND', result.b.header.company ?? 'NOT FOUND')}
        {row('Cleared', longDate(result.a.header.cleared), longDate(result.b.header.cleared))}
        {row('Product code', category(result.a), category(result.b))}
        {productComparisonRows(result.a.cards, result.b.cards).map(r => <tr key={r.key} data-question-key={r.key}><th scope="row">{r.question}</th><td>{r.a}</td><td>{r.b}</td></tr>)}
      </tbody></table></div>
    </>}
    <div className="brief-actions no-print">{compare && <Button variant="secondary" onClick={() => setChoosing(true)}>Change product</Button>}<Button variant="secondary" onClick={onClose}>Close</Button></div>
  </section>;
}