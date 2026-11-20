import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Status, useRefetch } from './reviewer-shared';
import { EvidenceSection } from './decision-shared';
import { maudeDate } from '@/lib/maude';
import { getDeviceSupplier, getVendorSupplier, supplierNumber as n, supplierActivities, supplierLocation, inspectionName, type DeviceSupplier, type SupplierSite, type VendorSupplier } from '@/lib/supplier';
import type { OwnershipMode } from '@/lib/vendor-data';

function SourceLink({ url, children }: { url: string | null | undefined; children: React.ReactNode }) {
  return url ? <a href={url} className="brief-link" target="_blank" rel="noopener noreferrer">{children}<ExternalLink size={12} /></a> : null;
}
function SitesTable({ rows, partner = false }: { rows: (SupplierSite & { owner?: string | null })[]; partner?: boolean }) {
  const [all, setAll] = useState(false);
  return <><div className="brief-table-scroll" tabIndex={0}><table className="brief-table"><thead><tr><th>Site</th>{partner && <th>Owner</th>}<th>Location</th><th>What the site does</th><th>510(k)s listed</th><th>Last inspection</th><th>Inspections (5 yrs)</th><th>Warning letters (5 yrs)</th></tr></thead><tbody>{(all ? rows : rows.slice(0, 10)).map((row, i) => <tr key={`${row.fei}-${i}`}><td>{row.name ?? 'NOT FOUND'}</td>{partner && <td>{row.owner ?? 'NOT FOUND'}</td>}<td>{supplierLocation(row)}</td><td>{supplierActivities(row.activities)}</td><td>{n(row.products)}</td><td>{row.last_inspection ? <>{maudeDate(row.last_inspection.date)} <span title={inspectionName(row.last_inspection.classification)}>{row.last_inspection.classification ?? 'NOT FOUND'}</span></> : "None in FDA's data"}</td><td>{n(row.inspections_last5)}</td><td>{n(row.warning_letters_last5)}</td></tr>)}</tbody></table></div>{rows.length > 10 && <Button variant="link" className="px-0" aria-expanded={all} onClick={() => setAll(!all)}>{all ? 'Show fewer' : `Show all ${rows.length}`}</Button>}</>;
}
export function ProductSupplierSection({ k, open, onToggle }: { id?: 'supplier'; k: string; open: boolean; onToggle: () => void }) {
  const [result, setResult] = useState<DeviceSupplier | null>(null);
  const [error, setError] = useState('');
  const reload = useRefetch();
  useEffect(() => {
    let active = true; setError('');
    getDeviceSupplier(k).then(data => { if (active) setResult(data); }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [k, reload]);
  const data = result?.knumber === k ? result : null;
  return <EvidenceSection id="supplier" title="Supplier record" summary={data ? `${n(data.sites)} sites · ${n(data.inspections_last5)} inspections in five years` : 'Loading…'} open={open} onToggle={onToggle}>
    {!data ? <Status busy={!error} error={error} /> : <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[
        ['Sites listing this 510(k)', n(data.sites)], ['Sites that make or sterilize it', n(data.making_sites)],
        ['Device inspections (last five years)', n(data.inspections_last5)], ['Warning letters (last five years)', n(data.warning_letters_last5)],
      ].map(([label, value]) => <div className="metric" key={label}><div className="metric-label">{label}</div><div className="metric-value">{value}</div></div>)}</div>
      {data.rows.length ? <div className="brief-table-scroll" tabIndex={0}><table className="brief-table"><thead><tr><th>Site</th><th>Relation</th><th>Location</th><th>Makes it</th><th>Activities</th><th>Last inspection</th><th>Inspections last five years</th><th>OAI</th><th>Warning letters</th></tr></thead><tbody>{data.rows.map(row => <tr key={row.fei}><td>{row.name}<div className="text-sm text-muted-foreground">{row.fei}</div></td><td>{row.relation === 'company' ? 'Company' : row.relation === 'partner' ? 'Partner' : 'Other company'}</td><td>{supplierLocation(row)}</td><td>{row.makes ? 'Yes' : 'No'}</td><td>{supplierActivities(row.activities)}</td><td>{row.last_inspection ? <>{maudeDate(row.last_inspection.date)} <span title={inspectionName(row.last_inspection.classification)}>{row.last_inspection.classification}</span></> : "None in FDA's data"}</td><td>{n(row.inspections_last5)}</td><td>{n(row.oai_last5)}</td><td>{n(row.warning_letters_last5)}</td></tr>)}</tbody></table></div> : <p className="section-caption">NOT FOUND: no current FDA establishment registration lists this 510(k).</p>}
      <h3>How to read this</h3><ul className="decision-notes">{data.notes.map((note, i) => <li key={i}>{note}</li>)}</ul>
      <p className="section-caption"><SourceLink url={data.sources.sites}>FDA establishment registration and listing</SourceLink>{' '}<SourceLink url={data.sources.inspections}>FDA inspections</SourceLink>{' '}<SourceLink url={data.sources.compliance}>FDA compliance actions</SourceLink></p>
      <p className="section-caption">Inspections through {data.inspections_through}.</p>
    </>}
  </EvidenceSection>;
}
export function VendorSupplierEvidence({ v, mode }: { v: string; mode: OwnershipMode }) {
  const [result, setResult] = useState<{ v: string; mode: OwnershipMode; data: VendorSupplier } | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setError('');
    getVendorSupplier(v, mode).then(data => { if (active) setResult({ v, mode, data }); }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [v, mode]);
  const d = result?.v === v && result.mode === mode ? result.data : null;
  if (!d) return <Status busy={!error} error={error} />;
  const recall = d.recalls?.figs?.find(fig => fig.label === 'recall events, last five years')?.value;
  const first = d.inspections_all?.first;
  const firstDate = first ? new Date(first) : null;
  const year = firstDate && !Number.isNaN(firstDate.getTime()) ? firstDate.getUTCFullYear() : null;
  const letters = d.warning_letters?.company_rows ?? [];
  const citations = d.top_citations ?? [];
  const companySites = d.company_sites ?? [];
  const partnerSites = d.partner_sites ?? [];
  return <>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{[
      ['Recall events, last five years', n(recall)], ['MAUDE reports, last five years', n(d.maude_last5?.reports)],
      ['Company sites', n(d.sites?.company_sites)], ['Device inspections, last five years', n(d.inspections_last5?.inspections)],
      ['Official action indicated (OAI), last five years', n(d.inspections_last5?.oai)], ['Warning letters, last five years', n(d.warning_letters?.company_last5)],
    ].map(([label, value]) => <div className="metric" key={label}><div className="metric-label">{label}</div><div className="metric-value">{value}</div>{label === 'Company sites' && <p className="section-caption">{n(d.sites?.company_making)} make devices · {n(d.sites?.company_countries)} countries</p>}</div>)}</div>
    <p className="section-caption">Last five years means since {maudeDate(d.since)}. FDA inspection data runs through {maudeDate(d.inspections_through)}. Since {n(year)}: {n(d.inspections_all?.inspections)} device inspections at company sites ({n(d.inspections_all?.nai)} NAI, {n(d.inspections_all?.vai)} VAI, {n(d.inspections_all?.oai)} OAI) and {n(d.warning_letters?.company_all)} warning letters.</p>
    <h3>Warning letters</h3>
    {letters.length ? <div className="brief-table-scroll" tabIndex={0}><table className="brief-table"><thead><tr><th>Date</th><th>Site</th><th>Location</th><th>FDA case number</th></tr></thead><tbody>{letters.map((row, i) => <tr key={i}><td>{maudeDate(row.date)}</td><td>{row.site ?? 'NOT FOUND'}</td><td>{supplierLocation(row)}</td><td>{row.case_id ?? 'NOT FOUND'}</td></tr>)}</tbody></table></div> : <p className="section-caption">No device warning letters to company sites in FDA's data since fiscal year 2009.</p>}
    <SourceLink url={d.sources?.warning_letters}>Read warning letters on fda.gov</SourceLink>
    <h3 className="mt-6">Most cited inspection observations (Form 483), last five years</h3>
    {citations.length ? <div className="brief-table-scroll" tabIndex={0}><table className="brief-table"><thead><tr><th>Regulation</th><th>Observation</th><th>Inspections</th></tr></thead><tbody>{citations.map((row, i) => <tr key={i}><td>{row.cfr ?? 'NOT FOUND'}</td><td>{row.short_description ?? 'NOT FOUND'}</td><td>{n(row.n)}</td></tr>)}</tbody></table></div> : <p className="section-caption">No Form 483 citations from company-site inspections in the last five years.</p>}
    <h3 className="mt-6">Company sites</h3>
    <SitesTable key={`${v}-${mode}-company`} rows={companySites} />
    <h3 className="mt-6">Partner sites</h3>
    <p className="section-caption">Other firms that list this company's products: contract manufacturers, sterilizers, importers and relabelers. Their results describe their own site.</p>
    {partnerSites.length ? <SitesTable key={`${v}-${mode}-partner`} rows={partnerSites} partner /> : <p className="section-caption">No partner sites list this company's 510(k)s.</p>}
    {!!d.other_company_sites?.length && <p className="section-caption">Sites of other device companies also list some of this company's 510(k)s, usually because a product line changed hands: {d.other_company_sites.map(row => `${row.company ?? 'NOT FOUND'} (${n(row.sites)} sites)`).join('; ')}.</p>}
    <h3 className="mt-6">How to read this</h3>
    <ul className="decision-notes">{(d.notes ?? []).map((note, i) => <li key={i}>{note}</li>)}</ul>
    <p className="section-caption">Sources: FDA establishment registration and listing (openFDA), FDA Data Dashboard inspections and compliance actions. <SourceLink url={d.sources?.sites}>FDA establishment registration and listing</SourceLink>{' '}<SourceLink url={d.sources?.inspections}>FDA inspections</SourceLink>{' '}<SourceLink url={d.sources?.compliance}>FDA compliance actions</SourceLink></p>
  </>;
}