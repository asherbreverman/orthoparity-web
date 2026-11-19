import { useState } from 'react';
import { Plus, Printer, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { ProcedurePayments } from './procedure-shared';
import { procedureDollars, sharePosition, worksheetTotals, type ProcedureDetail, type WorksheetRow } from '@/lib/procedure-data';

const emptyRow = (): WorksheetRow => ({item: '', units: '', price: ''});
function WorksheetQuestions({detail}: {detail: ProcedureDetail}) {
  return <ol className="vendor-questions">{detail.worksheet.map(q => <li key={q.step} value={q.step}>{q.question}<p className="section-caption">{q.hint}</p></li>)}</ol>;
}
export function ProcedureWorksheet({detail}: {detail: ProcedureDetail}) {
  const [rows, setRows] = useState<WorksheetRow[]>(() => [emptyRow(), emptyRow(), emptyRow()]);
  const [other, setOther] = useState('');
  const totals = worksheetTotals(rows, other, detail.payment.medicare_pays, detail.payment.total_payment);
  const update = (index: number, field: keyof WorksheetRow, value: string) => setRows(prev => prev.map((row, i) => i === index ? {...row, [field]: value} : row));
  const results = [['Construct cost', procedureDollars(totals.construct)], ['Total supply cost per case', procedureDollars(totals.supplies)], ["Share of Medicare's payment", totals.medicareShare === null ? 'NOT FOUND' : `${(totals.medicareShare * 100).toFixed(1)}% (${sharePosition(totals.medicareShare)})`], ['Share of total payment', totals.totalShare === null ? 'NOT FOUND' : `${(totals.totalShare * 100).toFixed(1)}% (${sharePosition(totals.totalShare)})`]];
  const resultList = <dl className="procedure-definitions mt-6" aria-live="polite">{results.map(([label, value]) => <div key={label}><dt>{label}</dt><dd className="font-semibold">{value}</dd></div>)}</dl>;
  return <>
    <section className="brief-section question-section"><h2>Questions for your team</h2><WorksheetQuestions detail={detail} />
      <div className="brief-table-scroll"><table className="brief-table procedure-calculator"><thead><tr><th>Item</th><th>Units</th><th>Unit price ($)</th><th><span className="sr-only">Remove row</span></th></tr></thead><tbody>{rows.map((row, i) => <tr key={i}><td><input className="batch-input" aria-label={`Item ${i + 1}`} value={row.item} onChange={e => update(i, 'item', e.target.value)} /></td><td><input className="batch-input" aria-label={`Units ${i + 1}`} type="number" min="0" step="any" value={row.units} onChange={e => update(i, 'units', e.target.value)} /></td><td><input className="batch-input" aria-label={`Unit price ${i + 1}`} type="number" min="0" step="0.01" value={row.price} onChange={e => update(i, 'price', e.target.value)} /></td><td><Button variant="ghost" size="icon" aria-label={`Remove row ${i + 1}`} title="Remove row" onClick={() => setRows(prev => prev.filter((_, index) => index !== i))}><Trash2 /></Button></td></tr>)}</tbody></table></div>
      <div className="brief-actions"><Button variant="secondary" onClick={() => setRows(prev => [...prev, emptyRow()])}><Plus />Add row</Button></div>
      <label className="block max-w-sm">Other supplies per case ($)<input className="batch-input mt-2" type="number" min="0" step="0.01" value={other} onChange={e => setOther(e.target.value)} /></label>
      {resultList}<p className="section-caption">Your numbers stay in this browser tab. Nothing is saved or sent.</p><div className="brief-actions"><Button onClick={() => window.print()}><Printer />Print worksheet</Button></div>
    </section>
    <div className="print-brief" aria-hidden="true"><div className="print-brand"><strong>Ortho</strong>Parity</div><h1>{detail.family.name}</h1><p className="print-sub">Original Medicare, {detail.family.data_year} · DRGs {detail.family.drgs.join(', ')}</p><ProcedurePayments detail={detail} /><h2>Questions for your team</h2><WorksheetQuestions detail={detail} /><table><thead><tr><th>Item</th><th>Units</th><th>Unit price ($)</th></tr></thead><tbody>{rows.map((row, i) => <tr key={i}><td>{row.item}</td><td>{row.units}</td><td>{row.price === '' ? '' : procedureDollars(Number(row.price))}</td></tr>)}</tbody></table><p>Other supplies per case: {procedureDollars(Number(other))}</p>{resultList}<p>Your numbers stay in this browser tab. Nothing is saved or sent.</p></div>
  </>;
}