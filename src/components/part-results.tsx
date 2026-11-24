import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { searchParts, type PartSearch } from '@/lib/predicate-data';
import { displayName, shortDeviceName } from '@/lib/format';
import { BriefLink, Status } from './reviewer-shared';

export const gudidFootnote = 'GUDID is company-reported, and products no longer sold often have no GUDID record, so a part number missing here may still be sold.';

export function PartNote({ part, k }: { part: string; k: string }) {
  const kind = /^[PHN]/i.test(k) ? 'FDA approval' : '510(k)';
  return <p className="part-note no-print">Part number <strong className="font-mono">{part}</strong> is listed under this {kind} in FDA's GUDID.<Link to="/" search={{ part }} className="brief-link">See every product that lists {part}</Link></p>;
}

export function PartResults({ part }: { part: string }) {
  const [data, setData] = useState<PartSearch | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { let active = true; setData(null); setError(''); searchParts(part, 100).then(d => { if (active) setData(d); }).catch(e => { if (active) setError(e.message); }); return () => { active = false; }; }, [part]);
  return <section className="brief-section" aria-label="Part number matches">
    <h1>Part number {part}</h1>
    <Status error={error} busy={!data && !error} />
    {data?.note && <p className="section-caption">{data.note}</p>}
    {data && !data.note && <p className="section-caption">{data.results.length === 1 ? '1 match' : `${data.results.length.toLocaleString('en-US')} matches`} in FDA's GUDID.</p>}
    {data && data.results.length > 0 && <div className="part-table-wrap"><table className="part-table"><thead><tr><th>Part number</th><th>Match</th><th>FDA number</th><th>Product</th><th>Company</th><th>Brand</th><th>In distribution</th></tr></thead><tbody>
      {data.results.map(r => <tr key={`${r.number}|${r.part_number}`}><td className="font-mono">{r.part_number}</td><td>{r.match}</td><td><BriefLink k={r.number} /></td><td title={r.device_name ?? undefined}>{r.device_name ? displayName(shortDeviceName(r.device_name, 80)) : 'NOT FOUND'}</td><td>{r.company ?? 'NOT FOUND'}</td><td>{r.brand ?? 'NOT FOUND'}</td><td>{r.in_distribution === false ? 'No' : r.in_distribution ? 'Yes' : 'NOT FOUND'}</td></tr>)}
    </tbody></table></div>}
    {data && <p className="section-caption">{data.source ? `${data.source} ` : ''}{gudidFootnote}</p>}
  </section>;
}
