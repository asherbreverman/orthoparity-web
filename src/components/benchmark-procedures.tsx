import { Fragment, useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronDown } from 'lucide-react';
import { EvidenceSection } from './decision-shared';
import { Status, useRefetch } from './reviewer-shared';
import { Button } from './ui/button';
import { getDeviceProcedures, getVendorProcedures } from '@/lib/predicate-data';
import { procedureNumber, type DeviceProcedures, type VendorProcedures, type VendorProcedure } from '@/lib/procedure-data';
import type { OwnershipMode } from '@/lib/vendor-data';

export function ProductProceduresSection({id, k, code, open, onToggle}: {id: string; k: string; code: string; open: boolean; onToggle: () => void}) {
  const [data, setData] = useState<DeviceProcedures | null>(null);
  const [error, setError] = useState('');
  const reload = useRefetch();
  useEffect(() => {
    if (!open) return;
    let active = true;
    setError('');
    getDeviceProcedures(k).then(d => {if (active) setData(d);}).catch(e => {if (active) setError(e.message);});
    return () => {active = false;};
  }, [k, open, reload]);
  const productCode = data?.product_code ?? code;
  const count = data?.procedures.length;
  return <EvidenceSection id={id} title="Procedures" summary={count === undefined ? '' : count ? `Used in ${count} procedure${count === 1 ? '' : 's'}` : 'Not in a listed procedure'} open={open} onToggle={onToggle}>
    {!data ? <Status busy={!error} error={error} /> : <>{data.procedures.length ? <div tabIndex={0} className="brief-table-scroll"><table className="brief-table"><thead><tr><th>Procedure</th><th>Role in the case</th></tr></thead><tbody>{data.procedures.map((p, i) => <tr key={`${p.family_id}-${p.role}-${i}`}><td><Link to="/procedures/$familyId" params={{familyId: p.family_id}} className="brief-link">{p.name}</Link><Link to="/procedures/$familyId" params={{familyId: p.family_id}} hash="worksheet" className="brief-link op-worksheet-link">Work out your implant share</Link>{p.flagship && <span className="data-tag ml-2">Most common</span>}</td><td>{p.role}</td></tr>)}</tbody></table></div> : <><p className="section-note">NOT FOUND: this product code isn't mapped to a Medicare procedure family.</p><Link to="/procedures" className="brief-link">See all procedures</Link></>}<p className="section-caption">Links go by FDA product code {productCode}: this product's category appears in a typical case for each procedure. The procedure page shows Original Medicare inpatient payments for the whole hospital stay.</p><p className="section-caption">Inpatient hospital payments only. ASC and hospital outpatient payments are not shown yet.</p></>}
  </EvidenceSection>;
}
function VendorProcedureRow({procedure, vendor}: {procedure: VendorProcedure; vendor: string}) {
  const [expanded, setExpanded] = useState(false);
  return <Fragment><tr><td><div className="flex items-start gap-2"><Button variant="ghost" size="icon" className="shrink-0" aria-label={`Categories for ${procedure.name}`} aria-expanded={expanded} aria-controls={`procedure-categories-${procedure.family_id}`} onClick={() => setExpanded(!expanded)}><ChevronDown className={expanded ? 'rotate-180' : ''} /></Button><div><Link to="/procedures/$familyId" params={{familyId: procedure.family_id}} search={{hl: vendor}} className="brief-link">{procedure.name}</Link>{procedure.flagship && <div className="mt-2"><span className="data-tag">Most common</span></div>}</div></div></td><td>{procedure.categories_with_clearances} of {procedure.categories_total}</td><td>{procedureNumber(procedure.categories_recent)}</td><td>{procedureNumber(procedure.clearances_recent)}</td><td>{procedure.latest ?? 'NOT FOUND'}</td></tr>{expanded && <tr id={`procedure-categories-${procedure.family_id}`}><td colSpan={5}><div tabIndex={0} className="brief-table-scroll"><table className="brief-table"><thead><tr><th>Category</th><th>Role</th><th>510(k)s in the window</th><th>510(k)s all time</th><th>Latest clearance</th></tr></thead><tbody>{procedure.categories.map(c => <tr key={`${c.product_code}-${c.role}`}><td>{c.plain_name ?? c.product_code} <span className="font-mono text-muted-foreground">{c.product_code}</span></td><td>{c.role}</td><td>{procedureNumber(c.clearances_recent)}</td><td>{procedureNumber(c.clearances_all)}</td><td>{c.latest ?? 'NOT FOUND'}</td></tr>)}</tbody></table></div></td></tr>}</Fragment>;
}
export function VendorProceduresSection({id, v, mode, open, onToggle}: {id: string; v: string; mode: OwnershipMode; open: boolean; onToggle: () => void}) {
  const [data, setData] = useState<VendorProcedures | null>(null);
  const [error, setError] = useState('');
  const reload = useRefetch();
  useEffect(() => {
    if (!open) return;
    let active = true;
    setError('');
    getVendorProcedures(v, mode).then(d => {if (active) setData(d);}).catch(e => {if (active) setError(e.message);});
    return () => {active = false;};
  }, [v, mode, open, reload]);
  const current = data?.vendor_id === v && data.mode === mode ? data : null;
  return <EvidenceSection id={id} title="Procedures" summary={current ? `Clearances in ${current.procedures.length} of ${current.procedures_total} procedures` : ''} open={open} onToggle={onToggle}>
    {!current ? <Status busy={!error} error={error} /> : <>{current.procedures.length ? <div tabIndex={0} className="brief-table-scroll"><table className="brief-table"><thead><tr><th>Procedure</th><th>Categories with clearances</th><th>Active categories, last five years</th><th>510(k)s, last five years</th><th>Latest clearance</th></tr></thead><tbody>{current.procedures.map(p => <VendorProcedureRow key={`${p.family_id}-${v}-${mode}`} procedure={p} vendor={v} />)}</tbody></table></div> : <p className="section-note">NOT FOUND: this product code isn't mapped to a Medicare procedure family.</p>}<p className="section-caption">Counts 510(k) clearances in each procedure's device categories, {current.window.from} to {current.window.to} for the last five years. Clearances measure product activity, not sales.</p></>}
  </EvidenceSection>;
}