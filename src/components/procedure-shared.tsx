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
export function ProcedurePayments({detail, extra}: {detail: ProcedureDetail; extra?: React.ReactNode}) {
  const p = detail.payment;
  const card = (label: string, value: string, note: string) => <div className="op-card op-stat procedure-pay"><small>{label}</small><b>{value}</b><span>{note}</span></div>;
  return <div className="op-stack procedure-payments-block"><div className="procedure-pay-grid">
    {card('Medicare pays · inpatient', procedureDollars(p.medicare_pays), "Medicare's average inpatient payment per stay")}
    {card('Patient and other payers', procedureDollars(p.patient_other_pays), `Deductible, coinsurance and secondary insurance (${(p.patient_other_share * 100).toFixed(1)}% of the total)`)}
    {card('Total payment', procedureDollars(p.total_payment), 'Everything the hospital is owed per stay')}
    {extra}
  </div><div className="op-note">Averages across {procedureNumber(detail.family.hospitals)} hospitals and {procedureNumber(detail.family.discharges)} discharges, weighted by volume. Patient and other payers shows what the hospital bills. Collections can run lower. Inpatient payments here. CY 2027 ASC rates appear on product pages for 12 procedure codes; hospital outpatient payments are not shown yet.</div></div>;
}
export function ProcedureSource({url, children}: {url: string; children: React.ReactNode}) {
  return /^https:\/\//.test(url) ? <a className="brief-link" href={url} target="_blank" rel="noopener noreferrer">{children}</a> : <span>{children}</span>;
}
export function ProcedureSupplyRange({detail}: {detail: ProcedureDetail}) {
  const [totalBase, setTotalBase] = useState(false);
  const range = detail.supply_range;
  if (range.note) return <section className="op-nf" aria-label="Supply cost range"><span className="op-mono">NOT FOUND</span>Supply cost range. {range.note}</section>;
  return <section className="op-stack procedure-supply" aria-label="Supply cost range"><div className="op-table-wrap">
    <div className="op-tablebar"><b>Supply cost range</b><div className="op-seg no-print" role="group" aria-label="Supply range base"><button type="button" aria-pressed={!totalBase} onClick={() => setTotalBase(false)}>Base: Medicare payment</button><button type="button" aria-pressed={totalBase} onClick={() => setTotalBase(true)}>Base: Total payment</button></div></div>
    <table className="op-table"><thead><tr><th scope="col">Share of payment</th><th scope="col" className={`num${!totalBase ? ' procedure-base' : ''}`}>On Medicare's payment</th><th scope="col" className={`num${totalBase ? ' procedure-base' : ''}`}>On total payment</th></tr></thead><tbody>{range.shares.map((share, i) => <tr key={share}><td>{share * 100}%</td><td className={`num${!totalBase ? ' procedure-base' : ''}`}>{procedureDollars(range.on_medicare[i])}</td><td className={`num${totalBase ? ' procedure-base' : ''}`}>{procedureDollars(range.on_total[i])}</td></tr>)}</tbody></table>
  </div><p className="op-caption">A planning reference for comparing with your own supply cost per case, drawn from published studies of implant cost as a share of payment (see Evidence). It is not a standard or a target.</p></section>;
}
