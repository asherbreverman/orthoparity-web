import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { zodValidator } from '@tanstack/zod-adapter';
import { procedureOptions, procedureHead } from '@/lib/procedure-queries';
import { pageTitle } from '@/lib/benchmark-brand';
import { ProcedurePending, ProcedureError, ProcedureNotFound, ProcedurePayments, ProcedureSupplyRange } from '@/components/procedure-shared';
import { ProcedureWorksheet } from '@/components/procedure-worksheet';
import { ProcedureEvidence } from '@/components/procedure-evidence';
import { useEvidence } from '@/components/decision-shared';

const evidenceIds = ['drgs', 'outpatient', 'devices', 'evidence', 'notes'];
export const Route = createFileRoute('/procedures_/$familyId')({
  staticData: {sitemap: true},
  validateSearch: zodValidator(z.object({hl: z.string().optional(), open: z.string().optional()})),
  loader: async ({context, params}) => {const detail = await context.queryClient.ensureQueryData(procedureOptions(params.familyId)); if (!detail.found) throw notFound(); return detail;},
  head: ({loaderData, params}) => procedureHead(loaderData ? pageTitle(`${loaderData.family.name}: Medicare payments and device categories`) : pageTitle('Procedure unavailable'), loaderData?.family.description ?? 'Original Medicare payments and orthopedic device categories from public CMS and FDA data.', `/procedures/${encodeURIComponent(params.familyId)}`),
  pendingMs: 0,
  pendingComponent: ProcedurePending,
  errorComponent: ProcedureError,
  notFoundComponent: ProcedureNotFound,
  component: ProcedurePage,
});
function ProcedurePage() {
  const {familyId} = Route.useParams();
  const {hl, open} = Route.useSearch();
  const navigate = Route.useNavigate();
  const {data: detail} = useSuspenseQuery(procedureOptions(familyId));
  const opened = new Set((open ?? '').split(',').filter(id => evidenceIds.includes(id)));
  // A highlighted vendor opens matching categories and their evidence section on a shared link.
  if (hl && open === undefined) opened.add('devices');
  const toggle = (id: string) => {if (opened.has(id)) opened.delete(id); else opened.add(id); void navigate({search: prev => ({...prev, open: [...opened].join(',')}), replace: true, resetScroll: false});};
  const ev = useEvidence('brief', {opened, onToggle: toggle});
  return <>
    <section className="result-header"><Link to="/procedures" className="brief-link mb-6">Medicare payments by procedure</Link><h1 className="result-title">{detail.family.name}</h1><p className="plain-description">{detail.family.description}</p><p className="result-meta">DRGs {detail.family.drgs.join(', ')} · Original Medicare, {detail.family.data_year}</p><div className="mt-8"><ProcedurePayments detail={detail} /></div></section>
    <ProcedureSupplyRange detail={detail} />
    <ProcedureWorksheet key={familyId} detail={detail} />
    <ProcedureEvidence detail={detail} vendor={hl} isOpen={ev.isOpen} toggle={ev.toggle} />
  </>;
}
