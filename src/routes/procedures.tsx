import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { procedureListOptions, procedureHead } from '@/lib/procedure-queries';
import { pageTitle } from '@/lib/benchmark-brand';
import { flagshipFirst, procedureDollars, procedureNumber } from '@/lib/procedure-data';
import { PageHead } from '@/components/op-controls';
import { ProcedurePending, ProcedureError, ProcedureNotFound, ProcedureNotesBlock } from '@/components/procedure-shared';

export const Route = createFileRoute('/procedures')({
  staticData: {sitemap: true},
  loader: ({context}) => context.queryClient.ensureQueryData(procedureListOptions()),
  head: () => procedureHead(pageTitle('Medicare payments by procedure'), 'Original Medicare payments, procedure volumes and orthopedic device categories from public CMS and FDA data.', '/procedures'),
  pendingMs: 0,
  pendingComponent: ProcedurePending,
  errorComponent: ProcedureError,
  notFoundComponent: ProcedureNotFound,
  component: ProcedureIndex,
});
function ProcedureIndex() {
  const {data} = useSuspenseQuery(procedureListOptions());
  const year = data.procedures[0]?.data_year;
  return <>
    <PageHead eyebrow="Explore" title="Medicare payments by procedure" lead={<>The most common orthopedic inpatient procedures in Original Medicare inpatient, {year}. Pick one to see what Medicare pays for inpatient stays, which device categories a case uses, and which companies are active in each.</>} />
    <div className="op-wrap op-section op-stack">
      <div className="op-table-wrap">
        <div className="op-tablebar"><span className="op-small">{data.procedures.length} procedure families · Original Medicare inpatient, {year}</span></div>
        <table className="op-table"><thead><tr><th scope="col">Procedure</th><th scope="col">MS-DRGs</th>{['Discharges', 'Hospitals', 'Medicare pays · inpatient', 'Patient and other payers', 'Total payment', 'Device categories'].map(h => <th key={h} scope="col" className="num">{h}</th>)}</tr></thead>
          <tbody>{flagshipFirst(data.procedures).map(p => <tr key={p.family_id}><td><Link to="/procedures/$familyId" params={{familyId: p.family_id}}><b>{p.name}</b></Link>{p.flagship && <small>Most common</small>}</td><td className="op-mono">{p.drgs.join(', ')}</td><td className="num">{procedureNumber(p.discharges)}</td><td className="num">{procedureNumber(p.hospitals)}</td><td className="num">{procedureDollars(p.medicare_pays)}</td><td className="num">{procedureDollars(p.patient_other_pays)}</td><td className="num">{procedureDollars(p.total_payment)}</td><td className="num">{p.device_categories === 0 ? 'None linked' : procedureNumber(p.device_categories)}</td></tr>)}</tbody></table>
      </div>
      <div className="op-note">Inpatient payments here. CY 2027 ASC rates appear on product pages for 12 procedure codes; hospital outpatient payments are not shown yet. Inpatient figures are averages weighted by volume across hospitals.</div>
      <section className="op-card procedure-notes"><h2 className="op-h3">Definitions and limitations</h2><ProcedureNotesBlock notes={data.notes} /></section>
    </div>
  </>;
}
