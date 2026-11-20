import { ClientOnly } from '@tanstack/react-router';
import { lazy, Suspense, useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { getDeviceMaude } from '@/lib/predicate-data';
import { maudeDate, maudeNumber, type DeviceMaude } from '@/lib/maude';
import { EvidenceSection } from './decision-shared';

const MaudeChart = lazy(() => import('./maude-chart'));

export function ProductMaudeSection({ k, open, onToggle }: { id?: 'maude'; k: string; open: boolean; onToggle: () => void }) {
  const [result, setResult] = useState<{ k: string; data: DeviceMaude } | null>(null);
  useEffect(() => {
    let active = true;
    getDeviceMaude(k).then(data => { if (active) setResult({ k, data }); })
      .catch(error => console.error('MAUDE reports unavailable.', error));
    return () => { active = false; };
  }, [k]);
  const data = result?.k === k ? result.data : null;
  if (!data?.has_reports) return null;
  const n = maudeNumber;
  const c = data.category;
  return <EvidenceSection id="maude" title="Adverse event reports (MAUDE)" summary={`${n(data.reports)} reports · ${n(data.last5.reports)} in the last five years`} open={open} onToggle={onToggle}>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[
      ['Reports naming this 510(k)', n(data.reports)], ['Deaths', n(data.deaths)],
      ['Injuries', n(data.injuries)], ['Malfunctions', n(data.malfunctions)],
    ].map(([label, value]) => <div className="metric" key={label}><div className="metric-label">{label}</div><div className="metric-value">{value}</div></div>)}</div>
    <p className="section-caption">Last five years (since {maudeDate(data.last5.since, true)}): {n(data.last5.reports)} reports, {n(data.last5.deaths)} deaths, {n(data.last5.injuries)} injuries, {n(data.last5.malfunctions)} malfunctions.</p>
    <ClientOnly><Suspense fallback={<div className="recall-chart skeleton" />}><MaudeChart rows={data.by_year} /></Suspense></ClientOnly>
    {c && <p className="section-caption">Product code {c.product_code ?? 'NOT FOUND'}: {n(c.with_reports)} of {n(c.clearances)} clearances have reports naming them; {n(c.reports_last5)} reports in the last five years.</p>}
    <h3>How to read these counts</h3>
    <ul className="decision-notes">{data.notes.map((note, i) => <li key={i}>{note}</li>)}</ul>
    <p className="section-caption">{data.source}. Data through {maudeDate(data.data_through)}. <a className="brief-link" href={data.maude_url} target="_blank" rel="noopener noreferrer">FDA MAUDE search<ExternalLink size={12} /></a>{data.tplc_url && <> <a className="brief-link" href={data.tplc_url} target="_blank" rel="noopener noreferrer">FDA product code history<ExternalLink size={12} /></a></>}</p>
  </EvidenceSection>;
}