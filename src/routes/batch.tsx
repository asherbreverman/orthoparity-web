import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Download, FileSpreadsheet, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageTitle, pageHead, BriefLink, PdfLink, Status } from '@/components/reviewer-shared';
import { parseBatch, batchAllowed, type BatchRow } from '@/lib/reviewer-data';
import { batchDevices } from '@/lib/predicate-data';
export const Route = createFileRoute('/batch')({ head: () => pageHead('Batch', 'Review up to 50 orthopedic clearance numbers at once and download a public-data CSV or Excel research table.'), component: Batch });
function Batch() {
  const [text,setText]=useState(''); const [rows,setRows]=useState<BatchRow[]>([]); const [busy,setBusy]=useState(false); const [error,setError]=useState(''); const [done,setDone]=useState(false);
  const numbers=parseBatch(text);
  async function run() { if(!batchAllowed(numbers)) return; setBusy(true); setError(''); setDone(false); setRows([]); try { setRows(await batchDevices(numbers)); setDone(true); } catch(e) {setError(e instanceof Error ? e.message : 'The batch could not be loaded.');} finally {setBusy(false);} }
  async function download(type:'csv'|'xlsx') { try {const {exportBatch}=await import('@/lib/reviewer-export'); await exportBatch(rows,type);} catch(e){setError(e instanceof Error ? e.message : 'The download could not be created.');} }
  return <><PageTitle name="Batch" /><label className="search-label" htmlFor="batch-numbers">Paste up to 50 510(k) numbers (any separator)</label><textarea id="batch-numbers" className="batch-input" rows={6} placeholder="K110694, K241487" value={text} onChange={e=>setText(e.target.value)} /><div className="batch-toolbar"><span className={numbers.length>50?'text-destructive':'text-muted-foreground'}>{numbers.length} unique clearance{numbers.length===1?'':'s'}{numbers.length>50?' — limit 50':''}</span><Button disabled={busy||!numbers.length||numbers.length>50} onClick={()=>void run()}>Review batch<ArrowRight /></Button></div><Status error={error} busy={busy} />
    {done && <section className="brief-section"><div className="section-heading"><h2>{rows.length} clearance results</h2><div className="download-actions"><Button size="sm" variant="outline" disabled={!rows.length} onClick={()=>void download('csv')}><Download />Download CSV</Button><Button size="sm" variant="outline" disabled={!rows.length} onClick={()=>void download('xlsx')}><FileSpreadsheet />Download Excel</Button></div></div><div className="brief-table-scroll"><table className="brief-table"><thead><tr><th>510(k)</th><th>Plain name</th><th>Device name</th><th>Company</th><th>Year</th><th>Product code</th><th>Pattern</th><th>Number of predicates</th><th>Primary predicate</th><th>Brief</th><th>FDA PDF</th></tr></thead><tbody>{rows.map(row=><tr key={row.knumber}><td className="font-mono">{row.knumber}</td>{row.found?<><td>{row.plain_name??'—'}</td><td>{row.device_name??'—'}</td><td>{row.applicant??'—'}</td><td>{row.decision_year??'—'}</td><td>{row.product_code??'—'}</td><td>{row.pattern}</td><td>{row.direct_predicates}</td><td>{row.primary_predicate??'—'}</td><td><BriefLink k={row.knumber}/></td><td><PdfLink url={row.summary_url}/></td></>:<td colSpan={10}>Not in this database (orthopedic clearances only)</td>}</tr>)}</tbody></table></div></section>}
  </>;
}
