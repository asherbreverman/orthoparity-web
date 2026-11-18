import { ClientOnly } from '@tanstack/react-router';
import { lazy, Suspense, useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDeviceRecalls, getVendorRecalls } from '@/lib/predicate-data';
import { recallCaption, recallDate, recallKnumbers, recentRecallEvents, type RecallEvent, type DeviceRecalls, type VendorRecalls } from '@/lib/recalls';
import type { OwnershipMode } from '@/lib/vendor-data';
import { BriefLink, Status } from './reviewer-shared';
const RecallChart = lazy(() => import('./recall-chart'));
function Reason({text}: {text: string | null}) {
  const [expanded,setExpanded] = useState(false);
  return text ? <div><p className={`recall-reason ${expanded ? '' : 'clamped'}`}>{text}</p><Button variant="link" size="sm" className="recall-expand" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>{expanded ? 'Show less' : 'Show more'}</Button></div> : <>—</>;
}
function RecallTable({events, named = false, vendor = false}: {events: RecallEvent[]; named?: boolean; vendor?: boolean}) {
  return <div className="brief-table-scroll"><table className="brief-table recall-table"><thead><tr><th>Initiated</th><th>Class</th><th>Status</th>{vendor && <th>Product</th>}<th>Reason</th><th>Root cause</th>{!vendor && <th>Products in the event</th>}{named && <th>510(k)s named</th>}<th>FDA link</th></tr></thead><tbody>{recentRecallEvents(events).map(e=><tr key={`${e.event_id}-${e.recall_number}`}><td>{recallDate(e.initiated)}</td><td><span className={e.recall_class === 'Class I' ? 'recall-class class-i' : e.recall_class === 'Class II' ? 'recall-class class-ii' : e.recall_class === 'Class III' ? 'recall-class class-iii' : 'text-muted-foreground'}>{e.recall_class}</span></td><td><span className={e.status === 'Open' ? 'recall-open' : 'text-muted-foreground'}>{e.status}</span></td>{vendor && <td><p className="recall-product" title={e.product ?? undefined}>{e.product ?? '—'}</p></td>}<td><Reason text={e.reason}/></td><td>{e.root_cause ?? '—'}</td>{!vendor && <td>{e.products}</td>}{named && <td><div className="recall-knumbers">{recallKnumbers(e.knumbers).map(k=><BriefLink key={k} k={k}/>)}{!recallKnumbers(e.knumbers).length && '—'}</div></td>}<td><a className="brief-link" href={`https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfres/res.cfm?event=${encodeURIComponent(e.event_id)}`} target="_blank" rel="noopener noreferrer">FDA record<ExternalLink size={12}/></a></td></tr>)}</tbody></table></div>;
}
export function ProductRecallEvidence({k}: {k: string}) {
  const [data,setData] = useState<DeviceRecalls | null>(null); const [error,setError] = useState('');
  useEffect(()=>{let active=true; setData(null);setError('');getDeviceRecalls(k).then(d=>{if(active)setData(d);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[k]);
  if (!data) return <Status busy={!error} error={error}/>;
  return <><h3>Recalls naming this 510(k)</h3>{data.device.length ? <RecallTable events={data.device}/> : <p className="section-note">No FDA recall names this 510(k).</p>}<h3 className="mt-6">Recalls naming its direct predicates</h3>{data.predicates.length ? <RecallTable events={data.predicates} named/> : <p className="section-note">No FDA recall names its direct predicates.</p>}{data.category && <p className="section-caption">Across product code {data.category.product_code}: {data.category.events_last5} recall events in the last five years, involving {data.category.companies_last5} companies ({data.category.class1_last5} Class I).</p>}<p className="section-caption">{data.source}. {recallCaption}</p></>;
}
export function VendorRecallEvidence({v,mode}: {v: string;mode: OwnershipMode}) {
  const [data,setData] = useState<VendorRecalls | null>(null);const [error,setError] = useState('');const [all,setAll] = useState(false);
  useEffect(()=>{let active=true;setData(null);setError('');setAll(false);getVendorRecalls(v,mode).then(d=>{if(active)setData(d);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[v,mode]);
  if (!data) return <Status busy={!error} error={error}/>;
  const events=recentRecallEvents(data.events);
  return <><ClientOnly><Suspense fallback={<div className="recall-chart skeleton"/>}><RecallChart rows={data.by_year}/></Suspense></ClientOnly><RecallTable events={all ? events : events.slice(0,10)} named vendor/>{events.length>10 && <Button variant="link" className="px-0" aria-expanded={all} onClick={()=>setAll(!all)}>{all ? 'Show fewer' : 'Show all'}</Button>}<p className="section-caption">{data.source}. {recallCaption}</p></>;
}