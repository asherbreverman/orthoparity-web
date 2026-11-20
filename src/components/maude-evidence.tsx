import { ClientOnly } from '@tanstack/react-router';
import { lazy, Suspense, useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { getDeviceMaude, getVendorMaude } from '@/lib/predicate-data';
import { maudeDate, maudeNumber, type DeviceMaude, type VendorMaude } from '@/lib/maude';
import type { OwnershipMode } from '@/lib/vendor-data';
import { BriefLink, Status } from './reviewer-shared';
import { EvidenceSection } from './decision-shared';

const MaudeChart = lazy(() => import('./maude-chart'));

export function VendorMaudeEvidence({ v, mode }: { v: string; mode: OwnershipMode }) {
  const [result, setResult] = useState<{ v: string; mode: OwnershipMode; data: VendorMaude } | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setError('');
    getVendorMaude(v, mode).then(data => { if (active) setResult({ v, mode, data }); })
      .catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [v, mode]);
  const data = result?.v === v && result.mode === mode ? result.data : null;
  if (!data) return <Status busy={!error} error={error} />;
  const n = maudeNumber;
  return <>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[
      ['Reports, last five years', n(data.last5.reports)], ['Deaths', n(data.last5.deaths)],
      ['Injuries', n(data.last5.injuries)], ['Malfunctions', n(data.last5.malfunctions)],
    ].map(([label, value]) => <div className="metric" key={label}><div className="metric-label">{label}</div><div className="metric-value">{value}</div></div>)}</div>
    <p className="section-caption">{n(data.products_with_reports)} of {n(data.products)} 510(k)s have reports naming them; {n(data.reports)} reports since FDA's records begin.</p>
    <ClientOnly><Suspense fallback={<div className="recall-chart skeleton" />}><MaudeChart rows={data.by_year} /></Suspense></ClientOnly>
    {data.top_products.length ? <><h3>Products with the most reports in the last five years</h3><div className="brief-table-scroll" tabIndex={0}><table className="brief-table"><thead><tr><th>510(k)</th><th>Product</th><th>Product code</th><th>Last five years</th><th>Deaths</th><th>Injuries</th><th>Malfunctions</th><th>All years</th></tr></thead><tbody>{data.top_products.map(row => <tr key={row.knumber}><td><BriefLink k={row.knumber} /></td><td>{row.device_name ?? 'NOT FOUND'}</td><td>{row.product_code ?? 'NOT FOUND'}</td><td>{n(row.reports_last5)}</td><td>{n(row.deaths_last5)}</td><td>{n(row.injuries_last5)}</td><td>{n(row.malfunctions_last5)}</td><td>{n(row.reports)}</td></tr>)}</tbody></table></div></> : <p className="section-caption">No reports name this company's 510(k)s.</p>}
    <h3>How to read these counts</h3>
    <ul className="decision-notes">{data.notes.map((note, i) => <li key={i}>{note}</li>)}</ul>
    <p className="section-caption">{data.source}. Data through {maudeDate(data.data_through)}. <a className="brief-link" href={data.maude_url} target="_blank" rel="noopener noreferrer">FDA MAUDE search<ExternalLink size={12} /></a></p>
  </>;
}

export function ProductMaudeSection({ k, open, onToggle }: { id?: 'maude'; k: string; open: boolean; onToggle: () => void }) {
  const [result, setResult] = useState<{ k: string; data: DeviceMaude } | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setError('');
    getDeviceMaude(k).then(data => { if (active) setResult({ k, data }); })
      .catch(error => { console.error('MAUDE reports unavailable.', error); if (active) setError(error.message); });
    return () => { active = false; };
  }, [k]);
  const data = result?.k === k ? result.data : null;
  if (!data) return <EvidenceSection id="maude" title="Adverse event reports (MAUDE)" summary="Loading…" open={open} onToggle={onToggle}><Status busy={!error} error={error} /></EvidenceSection>;
  if (!data.has_reports) return <EvidenceSection id="maude" title="Adverse event reports (MAUDE)" summary="No reports" open={open} onToggle={onToggle}><p className="section-caption">No FDA adverse event report (MAUDE) names this 510(k) number.</p><ul className="decision-notes">{data.notes.map((note, i) => <li key={i}>{note}</li>)}</ul></EvidenceSection>;
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