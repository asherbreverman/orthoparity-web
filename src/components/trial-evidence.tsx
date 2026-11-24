import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Status } from './reviewer-shared';
import { Metrics } from './payment-shared';
import { getDeviceTrials, getVendorTrials } from '@/lib/predicate-data';
import { filterByStatus, type Trial } from '@/lib/trials';
import { teamDate } from '@/lib/team';

export function NctLink({t}: {t: Trial}) {
  const url = t.url && /^https:\/\//.test(t.url) ? t.url : `https://clinicaltrials.gov/study/${t.nct}`;
  return <a className="brief-link font-mono" href={url} target="_blank" rel="noopener noreferrer">{t.nct}<ExternalLink size={12} /></a>;
}
const yesNo = (v: boolean | null | undefined) => v === true ? 'Yes' : v === false ? 'No' : 'NOT FOUND';
function Notes({notes}: {notes: string[]}) { return notes.length ? <ul className="list-disc pl-5 space-y-2 mt-4 section-caption">{notes.map((n, i) => <li key={i}>{n}</li>)}</ul> : null; }

export function ProductTrials({k}: {k: string}) {
  const {data, isError} = useQuery({queryKey: ['device-trials', k], queryFn: () => getDeviceTrials(k), staleTime: Infinity, retry: false});
  return <><h3 className="mt-6">Registered trials (ClinicalTrials.gov)</h3>
    {!data ? <Status busy={!isError} error={isError ? 'Could not load registered trials.' : ''} /> : data.total > 0 ? <div tabIndex={0} className="brief-table-scroll"><table className="brief-table"><thead><tr>{['NCT number', 'Title', 'Sponsor', 'Status', 'Start', 'Primary outcome', 'Results posted', 'Linked because'].map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{data.trials.map(t => <tr key={t.nct}><td><NctLink t={t} /></td><td>{t.title ?? 'NOT FOUND'}</td><td>{t.sponsor ?? 'NOT FOUND'}</td><td>{t.status ?? 'NOT FOUND'}</td><td>{teamDate(t.start_date)}</td><td>{t.primary_outcome ?? 'NOT FOUND'}{t.primary_timeframe && <p className="section-caption">{t.primary_timeframe}</p>}</td><td>{yesNo(t.has_results)}</td><td title={t.context ?? undefined}>{t.basis ?? 'NOT FOUND'}</td></tr>)}</tbody></table></div> : <p>No ClinicalTrials.gov record names this FDA number.</p>}
    {data && <Notes notes={data.notes} />}</>;
}

export function VendorTrialsBlock({v}: {v: string}) {
  const {data, isError} = useQuery({queryKey: ['vendor-trials', v], queryFn: () => getVendorTrials(v, 1000), staleTime: Infinity, retry: false});
  const [status, setStatus] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  const rows = data ? filterByStatus(data.trials, status) : [];
  return <><h3 className="mt-6">Registered musculoskeletal device trials it leads</h3>
    {!data ? <Status busy={!isError} error={isError ? 'Could not load registered trials.' : ''} /> : <>
      <Metrics items={[['registered trials', data.total.toLocaleString('en-US')], ['recruiting or active', data.active.toLocaleString('en-US')], ['completed with results posted', data.completed_with_results.toLocaleString('en-US')], ['terminated, withdrawn or suspended', data.stopped.toLocaleString('en-US')]]} />
      {data.by_status.length > 0 && <div className="directory-chips mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter trials by status"><Button size="sm" variant={status === null ? 'secondary' : 'outline'} aria-pressed={status === null} onClick={() => setStatus(null)}>All {data.total}</Button>{data.by_status.map(s => <Button key={s.status} size="sm" variant={status === s.status ? 'secondary' : 'outline'} aria-pressed={status === s.status} onClick={() => { setStatus(status === s.status ? null : s.status); setAll(false); }}>{s.status} {s.n}</Button>)}</div>}
      {rows.length > 0 ? <div tabIndex={0} className="brief-table-scroll mt-4"><table className="brief-table"><thead><tr>{['NCT', 'Title', 'Sponsor', 'Status', 'Start', 'Results posted'].map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{(all ? rows : rows.slice(0, 10)).map(t => <tr key={t.nct}><td><NctLink t={t} /></td><td>{t.title ?? 'NOT FOUND'}</td><td>{t.sponsor ?? 'NOT FOUND'}{t.sponsor_vendor && t.sponsor_vendor !== v && <p className="section-caption">acquired company</p>}</td><td>{t.status ?? 'NOT FOUND'}</td><td>{teamDate(t.start_date)}</td><td>{yesNo(t.has_results)}</td></tr>)}</tbody></table></div> : <p className="mt-4">No registered musculoskeletal device trials led by this company.</p>}
      {rows.length > 10 && <Button variant="link" className="px-0" onClick={() => setAll(!all)}>{all ? 'Show fewer' : `Show all ${rows.length}`}</Button>}
      <Notes notes={data.notes} /></>}</>;
}
