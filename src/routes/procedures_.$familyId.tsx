import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { TeamEvidence, TeamFigure, teamFamilyOptions } from '@/components/team-pages';
import { z } from 'zod';
import { zodValidator } from '@tanstack/zod-adapter';
import { procedureOptions, procedureHead } from '@/lib/procedure-queries';
import { pageTitle } from '@/lib/benchmark-brand';
import { ProcedurePending, ProcedureError, ProcedureNotFound, ProcedurePayments, ProcedureSupplyRange } from '@/components/procedure-shared';
import { ProcedureWorksheet } from '@/components/procedure-worksheet';
import { ProcedureEvidence } from '@/components/procedure-evidence';
import { PageHead } from '@/components/op-controls';
import { procedureNumber } from '@/lib/procedure-data';
import { useEvidence } from '@/components/decision-shared';

const evidenceIds = ['drgs', 'team', 'outpatient', 'devices', 'evidence', 'notes'];
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
  const {data: team} = useQuery(teamFamilyOptions(familyId));
  const ev = useEvidence('brief', {opened, onToggle: toggle});
  return <>
    <PageHead eyebrow="Explore · procedure" title={detail.family.name} lead={detail.family.description} crumb={<Link to="/procedures" className="op-crumb">All procedures</Link>}>
      <p className="op-meta"><span>MS-DRGs <span className="op-mono">{detail.family.drgs.join(', ')}</span></span><span>Original Medicare inpatient, {detail.family.data_year}</span><span>{procedureNumber(detail.family.hospitals)} hospitals · {procedureNumber(detail.family.discharges)} discharges</span></p>
    </PageHead>
    <div className="op-wrap op-section op-stack procedure-body">
      <ProcedurePayments detail={detail} extra={team?.is_team ? <TeamFigure team={team} /> : null} />
      <ProcedureSupplyRange detail={detail} />
      <ProcedureWorksheet key={familyId} detail={detail} />
      <ProcedureEvidence detail={detail} vendor={hl} isOpen={ev.isOpen} toggle={ev.toggle} team={<TeamEvidence team={team} open={ev.isOpen('team')} onToggle={() => ev.toggle('team')} />} />
    </div>
  </>;
}
