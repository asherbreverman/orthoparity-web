import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { procedureListOptions, procedureHead } from '@/lib/procedure-queries';
import { flagshipFirst, procedureDollars, procedureNumber } from '@/lib/procedure-data';
import { ProcedurePending, ProcedureError, ProcedureNotFound, ProcedureNotesBlock } from '@/components/procedure-shared';

export const Route = createFileRoute('/procedures')({
  staticData: {sitemap: true},
  loader: ({context}) => context.queryClient.ensureQueryData(procedureListOptions()),
  head: () => procedureHead('Medicare payments by procedure | OrthoParity', 'Original Medicare payments, procedure volumes and orthopedic device categories from public CMS and FDA data.', '/procedures'),
  pendingMs: 0,
  pendingComponent: ProcedurePending,
  errorComponent: ProcedureError,
  notFoundComponent: ProcedureNotFound,
  component: ProcedureIndex,
});
function ProcedureIndex() {
  const {data} = useSuspenseQuery(procedureListOptions());
  return <><section className="result-header"><h1 className="result-title">Medicare payments by procedure</h1><p className="section-lead">The most common orthopedic inpatient procedures in Original Medicare, {data.procedures[0]?.data_year}. Pick one to see what Medicare pays, which device categories a case uses, and which companies are active in each.</p><div tabIndex={0} className="brief-table-scroll"><table className="brief-table"><thead><tr>{['Procedure', 'DRGs', 'Discharges', 'Hospitals', 'Medicare pays', 'Patient and other payers', 'Total payment', 'Device categories'].map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{flagshipFirst(data.procedures).map(p => <tr key={p.family_id}><td><Link className="brief-link" to="/procedures/$familyId" params={{familyId: p.family_id}}>{p.name}</Link>{p.flagship && <div className="mt-2"><span className="data-tag">Most common</span></div>}</td><td className="font-mono">{p.drgs.join(', ')}</td><td>{procedureNumber(p.discharges)}</td><td>{procedureNumber(p.hospitals)}</td><td>{procedureDollars(p.medicare_pays)}</td><td>{procedureDollars(p.patient_other_pays)}</td><td>{procedureDollars(p.total_payment)}</td><td>{procedureNumber(p.device_categories)}</td></tr>)}</tbody></table></div></section><section className="brief-section"><h2>Definitions and limitations</h2><ProcedureNotesBlock notes={data.notes} /></section></>;
}