import { useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Status } from './reviewer-shared';
import { LOAD_FAILED } from '@/lib/predicate-data';
import { procedureDollars, procedureNumber, type ProcedureDetail, type ProcedureNotes } from '@/lib/procedure-data';

export function ProcedurePending() { return <section className="brief-section"><Status busy /></section>; }
export function ProcedureNotFound() { return <section className="brief-section"><div className="notice">Procedure not found.</div></section>; }
export function ProcedureError() {
  const router = useRouter();
  const boundary = useQueryErrorResetBoundary();
  return <section className="brief-section"><div className="notice" role="alert">{LOAD_FAILED}<Button variant="secondary" size="sm" onClick={() => {boundary.reset(); void router.invalidate();}}>Try again</Button></div></section>;
}
export function ProcedureNotesBlock({notes}: {notes: ProcedureNotes}) {
  return <><dl className="procedure-definitions">{notes.definitions.map(d => <div key={d.term}><dt className="font-semibold">{d.term}</dt><dd className="section-caption">{d.text}</dd></div>)}</dl><ul className="list-disc pl-5 space-y-3">{notes.limitations.map((text, i) => <li key={i}>{text}</li>)}</ul><p className="section-caption mt-6">Source: {notes.source}</p></>;
}
export function ProcedurePayments({detail}: {detail: ProcedureDetail}) {
  const p = detail.payment;
  return <><div className="category-metrics procedure-payments"><div className="metric"><h2 className="metric-label">Medicare pays</h2><div className="metric-value">{procedureDollars(p.medicare_pays)}</div><p className="section-caption mt-3">Medicare's average payment per stay</p></div><div className="metric"><h2 className="metric-label">Patient and other payers</h2><div className="metric-value">{procedureDollars(p.patient_other_pays)}</div><p className="section-caption mt-3">Deductible, coinsurance and secondary insurance ({(p.patient_other_share * 100).toFixed(1)}% of the total)</p></div><div className="metric"><h2 className="metric-label">Total payment</h2><div className="metric-value">{procedureDollars(p.total_payment)}</div><p className="section-caption mt-3">Everything the hospital is owed per stay</p></div></div><p className="section-caption mt-4">Averages across {procedureNumber(detail.family.hospitals)} hospitals and {procedureNumber(detail.family.discharges)} discharges, weighted by volume. Patient and other payers shows what the hospital bills. Collections can run lower.</p></>;
}
export function ProcedureSource({url, children}: {url: string; children: React.ReactNode}) {
  return /^https:\/\//.test(url) ? <a className="brief-link" href={url} target="_blank" rel="noopener noreferrer">{children}</a> : <span>{children}</span>;
}
export function ProcedureSupplyRange({detail}: {detail: ProcedureDetail}) {
  const [totalBase, setTotalBase] = useState(false);
  const range = detail.supply_range;
  return <section className="brief-section"><h2>Supply cost range</h2>{range.note ? <>NOT FOUND<p className="section-caption">{range.note}</p></> : <><div className="ownership-switch no-print" role="group" aria-label="Supply range base"><Button aria-pressed={!totalBase} variant="ghost" onClick={() => setTotalBase(false)}>Base: Medicare payment</Button><Button aria-pressed={totalBase} variant="ghost" onClick={() => setTotalBase(true)}>Base: Total payment</Button></div><div tabIndex={0} className="brief-table-scroll mt-6"><table className="brief-table"><thead><tr><th>Share of payment</th><th className={!totalBase ? 'procedure-base' : ''}>On Medicare's payment</th><th className={totalBase ? 'procedure-base' : ''}>On total payment</th></tr></thead><tbody>{range.shares.map((share, i) => <tr key={share}><td>{share * 100}%</td><td className={!totalBase ? 'procedure-base' : ''}>{procedureDollars(range.on_medicare[i])}</td><td className={totalBase ? 'procedure-base' : ''}>{procedureDollars(range.on_total[i])}</td></tr>)}</tbody></table></div><p className="section-caption">A planning reference for comparing with your own supply cost per case, drawn from published studies of implant cost as a share of payment (see Evidence). It is not a standard or a target.</p></>}</section>;
}
