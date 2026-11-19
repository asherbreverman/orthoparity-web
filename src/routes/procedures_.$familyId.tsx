import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { zodValidator } from '@tanstack/zod-adapter';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { procedureOptions, procedureHead } from '@/lib/procedure-queries';
import { procedureDollars } from '@/lib/procedure-data';
import { ProcedurePending, ProcedureError, ProcedureNotFound, ProcedurePayments } from '@/components/procedure-shared';
import { ProcedureWorksheet } from '@/components/procedure-worksheet';
import { ProcedureEvidence } from '@/components/procedure-evidence';
import { useEvidence } from '@/components/decision-shared';

const evidenceIds = ['drgs', 'outpatient', 'devices', 'evidence', 'notes'];
export const Route = createFileRoute('/procedures_/$familyId')({
  staticData: {sitemap: false},
  validateSearch: zodValidator(z.object({v: z.string().optional(), open: z.string().optional()})),
  loader: async ({context, params}) => {const detail = await context.queryClient.ensureQueryData(procedureOptions(params.familyId)); if (!detail.found) throw notFound(); return detail;},
  head: ({loaderData, params}) => procedureHead(loaderData ? `${loaderData.family.name}: Medicare payments and device categories | OrthoParity` : 'Procedure unavailable | OrthoParity', loaderData?.family.description ?? 'Original Medicare payments and orthopedic device categories from public CMS and FDA data.', `/procedures/${encodeURIComponent(params.familyId)}`),
  pendingMs: 0,
  pendingComponent: ProcedurePending,
  errorComponent: ProcedureError,
  notFoundComponent: ProcedureNotFound,
  component: ProcedurePage,
});
function ProcedurePage() {
  const {familyId} = Route.useParams();
  const {v, open} = Route.useSearch();
  const navigate = Route.useNavigate();
  const {data: detail} = useSuspenseQuery(procedureOptions(familyId));
  const [totalBase, setTotalBase] = useState(false);
  const opened = new Set((open ?? '').split(',').filter(id => evidenceIds.includes(id)));
  // A highlighted vendor opens matching categories and their evidence section on a shared link.
  if (v && open === undefined) opened.add('devices');
  const toggle = (id: string) => {if (opened.has(id)) opened.delete(id); else opened.add(id); void navigate({search: prev => ({...prev, open: [...opened].join(',')}), replace: true, resetScroll: false});};
  const ev = useEvidence('brief', {opened, onToggle: toggle});
  return <>
    <section className="result-header"><Link to="/procedures" className="brief-link mb-6">Medicare payments by procedure</Link><h1 className="result-title">{detail.family.name}</h1><p className="plain-description">{detail.family.description}</p><p className="result-meta">DRGs {detail.family.drgs.join(', ')} · Original Medicare, {detail.family.data_year}</p><div className="mt-8"><ProcedurePayments detail={detail} /></div></section>
    <section className="brief-section"><h2>Supply cost range</h2><div className="ownership-switch no-print" role="group" aria-label="Supply range base"><Button aria-pressed={!totalBase} variant="ghost" onClick={() => setTotalBase(false)}>Base: Medicare payment</Button><Button aria-pressed={totalBase} variant="ghost" onClick={() => setTotalBase(true)}>Base: Total payment</Button></div><div className="brief-table-scroll mt-6"><table className="brief-table"><thead><tr><th>Share of payment</th><th className={!totalBase ? 'procedure-base' : ''}>On Medicare's payment</th><th className={totalBase ? 'procedure-base' : ''}>On total payment</th></tr></thead><tbody>{detail.supply_range.shares.map((share, i) => <tr key={share}><td>{share * 100}%</td><td className={!totalBase ? 'procedure-base' : ''}>{procedureDollars(detail.supply_range.on_medicare[i])}</td><td className={totalBase ? 'procedure-base' : ''}>{procedureDollars(detail.supply_range.on_total[i])}</td></tr>)}</tbody></table></div><p className="section-caption">A planning reference for comparing with your own supply cost per case, drawn from published studies of implant cost as a share of payment (see Evidence). It is not a standard or a target.</p></section>
    <ProcedureWorksheet key={familyId} detail={detail} />
    <ProcedureEvidence detail={detail} vendor={v} isOpen={ev.isOpen} toggle={ev.toggle} />
  </>;
}