import { Fragment, useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { addOnAmount, addOnStatus, getDeviceAddOn, getVendorAddOn, type AddOnItem, type DeviceAddOn, type VendorAddOn } from '@/lib/add-on';
import type { OwnershipMode } from '@/lib/vendor-data';
import { BriefLink, Status, useRefetch } from './reviewer-shared';
import { EvidenceSection } from './decision-shared';

const text = (value: string | number | null | undefined) => value ?? 'NOT FOUND';
const external = (url: string | null) => url && /^https?:\/\//.test(url) ? url : null;

export function AddOnTable({ items, showProducts = false }: { items: AddOnItem[]; showProducts?: boolean }) {
  return <div className="brief-table-scroll" tabIndex={0}><table className="brief-table">
    <thead><tr><th>Program</th><th>Technology</th><th>Status</th><th>Amount or code</th><th>FDA</th>{showProducts && <th>510(k)s here</th>}</tr></thead>
    <tbody>{items.map((item, i) => <Fragment key={item.tech_id ?? i}>
      <tr>
        <td>{item.program === 'NTAP' ? 'Inpatient NTAP' : item.program === 'TPT' ? 'Outpatient pass-through' : 'NOT FOUND'}</td>
        <td>{text(item.technology)}<div className="text-sm text-muted-foreground">{text(item.company)}</div>{item.example_knumber && <BriefLink k={item.example_knumber} />}</td>
        <td>{addOnStatus(item)}</td>
        <td>{item.program === 'NTAP' ? item.status === 'discontinued' ? `Was up to ${addOnAmount(item.max_payment)} in FY 2026` : `Up to ${addOnAmount(item.max_payment)} per case` : item.program === 'TPT' ? `HCPCS ${text(item.hcpcs)}` : 'NOT FOUND'}</td>
        <td>{external(item.fda_source) ? <a className="brief-link" href={item.fda_source ?? ''} target="_blank" rel="noopener noreferrer">{text(item.fda_numbers)}<ExternalLink size={12} /></a> : text(item.fda_numbers)}</td>
        {showProducts && <td>{text(item.products)}</td>}
      </tr>
      {item.note && <tr><td colSpan={showProducts ? 6 : 5} className="text-sm text-muted-foreground">{item.note}</td></tr>}
    </Fragment>)}</tbody>
  </table></div>;
}
function AddOnSources({ items }: { items: AddOnItem[] }) {
  const urls = [...new Set(items.map(item => external(item.cms_source)).filter((url): url is string => !!url))];
  return <p className="section-caption">Sources: CMS FY 2027 IPPS final rule (MAC Implementation File 8) and CY 2027 OPPS final rule (Addendum B).{' '}{urls.map(url => <Fragment key={url}><a className="brief-link" href={url} target="_blank" rel="noopener noreferrer">{items.find(item => item.cms_source === url)?.program === 'NTAP' ? 'CMS FY 2027 IPPS final rule' : 'CMS CY 2027 OPPS final rule'}<ExternalLink size={12} /></a>{' '}</Fragment>)}</p>;
}
function AddOnNotes({ notes, items }: { notes: string[]; items: AddOnItem[] }) {
  return <><h3>How to read this</h3><ul className="decision-notes">{notes.map((note, i) => <li key={i}>{note}</li>)}</ul><AddOnSources items={items} /></>;
}
function ProductAddOnContent({ data }: { data: DeviceAddOn }) {
  return <>
    {!!data.items.length && <><p className="section-caption">CMS pays hospitals extra for this product line under Original Medicare:</p><AddOnTable items={data.items} /></>}
    {!!data.category.length && <><h3>Others in product code {text(data.product_code)}</h3><p className="section-caption">These products in the same FDA product code have an add-on payment:</p><AddOnTable items={data.category} /></>}
    <AddOnNotes notes={data.notes} items={[...data.items, ...data.category]} />
  </>;
}
function useProductAddOn(k: string) {
  const [result, setResult] = useState<{ k: string; data: DeviceAddOn } | null>(null);
  const [error, setError] = useState('');
  const reload = useRefetch();
  useEffect(() => {
    let active = true; setError('');
    getDeviceAddOn(k).then(data => { if (active) setResult({ k, data }); }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [k, reload]);
  return { data: result?.k === k ? result.data : null, error };
}
export function ProductAddOnSection({ k, open, onToggle }: { id?: 'addon'; k: string; open: boolean; onToggle: () => void }) {
  const { data, error } = useProductAddOn(k);
  if (error) return <Status error={error} />;
  if (!data) return <EvidenceSection id="addon" title="Medicare add-on payments" summary="Loading…" open={open} onToggle={onToggle}><Status busy /></EvidenceSection>;
  if (!data.items.length && !data.category.length) return <EvidenceSection id="addon" title="Medicare add-on payments" summary="None" open={open} onToggle={onToggle}><p className="section-caption">No FY 2027 inpatient NTAP or CY 2027 outpatient pass-through code names this product line or its product code.</p><AddOnNotes notes={data.notes} items={[]} /></EvidenceSection>;
  const n = data.items.length;
  return <EvidenceSection id="addon" title="Medicare add-on payments" summary={data.has_add_on ? `${n} add-on payment${n === 1 ? '' : 's'} for this product line` : `None for this product · ${data.category.length} in product code ${text(data.product_code)}`} open={open} onToggle={onToggle}><ProductAddOnContent data={data} /></EvidenceSection>;
}
export function ProductAddOnPrint({ k }: { k: string }) {
  const { data } = useProductAddOn(k);
  if (!data || (!data.items.length && !data.category.length)) return null;
  return <><h2>Medicare add-on payments</h2><ProductAddOnContent data={data} /></>;
}
export function VendorAddOnContent({ data }: { data: VendorAddOn }) {
  return <>{data.items.length ? <><p className="section-caption">{data.ntap} inpatient NTAP and {data.pass_through} outpatient pass-through</p><AddOnTable items={data.items} showProducts /></> : <p className="section-caption">No current Medicare add-on payments for this company's technologies in the FY 2027 NTAP list or the CY 2027 pass-through codes.</p>}<AddOnNotes notes={data.notes} items={data.items} /></>;
}
export function VendorAddOnEvidence({ v, mode }: { v: string; mode: OwnershipMode }) {
  const [result, setResult] = useState<{ v: string; mode: OwnershipMode; data: VendorAddOn } | null>(null);
  const [error, setError] = useState('');
  const reload = useRefetch();
  useEffect(() => {
    let active = true; setError('');
    getVendorAddOn(v, mode).then(data => { if (active) setResult({ v, mode, data }); }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [v, mode, reload]);
  const data = result?.v === v && result.mode === mode ? result.data : null;
  if (!data) return <Status busy={!error} error={error} />;
  return <VendorAddOnContent data={data} />;
}
