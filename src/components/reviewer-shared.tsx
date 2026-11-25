import { LOAD_FAILED } from '@/lib/predicate-data';
import { shortDeviceName } from '@/lib/format';
import { pageTitle } from '@/lib/benchmark-brand';
import { Link } from '@tanstack/react-router';
import { useEffect, useState, type ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { limitations, methodology } from '@/lib/predicate-chain';
import { getDataEnd, getMeta, searchDevices, searchParts, type PartMatch } from '@/lib/predicate-data';
import { dateLabel, type Meta, type SearchResult } from '@/lib/predicate-chain';
import type { VendorCoverage } from '@/lib/vendor-coverage';
import { paymentLimitations } from '@/lib/vendor-data';
import { decisionLimitations } from '@/lib/signals';
import { recallLimitation } from '@/lib/recalls';
import { ResearchSearch, type SearchLoad, type SearchOption } from './research-search';
import { Toaster } from './ui/sonner';
import { devicePathway, normalizeDeviceNumber } from '@/lib/fda-device';
import { SiteFooter, SiteHeader } from './site-chrome';

export function useRelease(initial?: Meta) {
  const [meta, setMeta] = useState<Meta>(initial ?? {});
  const [error, setError] = useState('');
  useEffect(() => { if (initial) return; getMeta().then(setMeta).catch(e => setError(e.message)); }, [initial]);
  return { meta: initial ?? meta, error };
}

export function useDataEnd(coverage: VendorCoverage | null) {
  const covered = coverage?.data_end ?? null;
  const [fallback, setFallback] = useState<string | null>(covered);
  useEffect(() => {
    let active = true;
    setFallback(covered);
    if (!covered) getDataEnd().then(value => { if (active) setFallback(value); }).catch(() => {});
    return () => { active = false; };
  }, [covered]);
  return covered ?? fallback;
}

export function ReviewerShell({ children }: { children: ReactNode }) {
  const [about, setAbout] = useState(false);
  const { meta, error } = useRelease();
  useEffect(() => {
    const open = () => { setAbout(true); requestAnimationFrame(() => document.getElementById('about-limitations')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })); };
    window.addEventListener('op-methodology', open);
    return () => window.removeEventListener('op-methodology', open);
  }, []);

  function toggleMethodology() {
    const next = !about;
    setAbout(next);
    if (next) requestAnimationFrame(() => document.getElementById('about-limitations')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }));
  }

  return <div className="app-shell reviewer-shell">
    <SiteHeader />
    <main>{children}</main>
    <Toaster position="bottom-center" />
    {about && <section id="about-limitations" className="brief-section about-content" aria-label="About and limitations"><h2>About</h2><p className="section-caption">{meta.exported_utc ? `Data as of ${meta.exported_utc}. Parser ${meta.parser_version ?? 'NOT FOUND'}.` : error ? 'Data release information unavailable.' : 'Loading data release information…'}</p><h3>Mission</h3><p className="section-caption">Put the full public record on orthopedic implants and the companies that make them in the hands of the ASCs and health systems that buy them, for free. Buyers pair it with their own pricing, which stays private, to benchmark every new product or vendor request.</p><h3>Five steps for every new product or vendor request</h3><ol><li>Start with the predicate: the device the manufacturer told FDA is substantially equivalent to its own.</li><li>Find the equivalents: other devices that cite the same predicate or share the same three-letter FDA product code.</li><li>Compare the risk: recalls, adverse event reports and FDA inspection findings, next to your current vendors.</li><li>Make them compete: every company making the same device, and whether the product is a line extension or a competitive entry.</li><li>Benchmark against your pricing: compare the new product with what you already pay for its equivalents, per item, construct or procedure. That step happens inside your building, and every brief ends in a worksheet of vendor questions to support it.</li></ol><h3>Your data stays yours</h3><p className="section-caption">OrthoParity never asks for your prices, contracts or any other data. There's no login and nothing to upload. You bring your pricing to the negotiation, not to the website.</p><h3>What it can't do</h3><ul><li>It holds no implant prices or contract terms, by design.</li><li>It can't replace pooled-volume contract pricing from a GPO.</li><li>Shared predicates and product codes signal substantial equivalence, not identical devices.</li><li>MAUDE adverse event reports are unverified and can't show that a device caused an event.</li><li>It gives no scores, rankings or recommendations. The buyer makes the decision.</li></ul><h3>Methodology</h3><p className="section-caption">Sources include FDA 510(k) summaries, FDA GUDID, FDA recalls, FDA MAUDE adverse event reports, FDA establishment registration and listing, FDA Data Dashboard inspections and compliance actions, CMS Open Payments, CMS Medicare Inpatient and Outpatient Hospitals by Provider and Service (2024), and CMS add-on payments (FY 2027 inpatient NTAP and CY 2027 outpatient pass-through).</p><ul>{methodology.map(text => <li key={text}>{text}</li>)}</ul><ul><li>Plain-English descriptions are drafted from FDA's product-code definitions and marked until an orthopedic industry reviewer confirms them.</li><li>FDA-cleared use is quoted from each 510(k) summary's Indications for Use, read by software; check the PDF for the exact text.</li><li>The Is it new? pattern rolls applicant names up to the company that owned them on the clearance date. Peers and category counts compare names as printed.</li></ul><h3>Decision cards, alternatives and catalog</h3><ul>{decisionLimitations.map(text => <li key={text}>{text}</li>)}</ul><h3>Limitations</h3><Status error={error} busy={!meta.exported_utc && !error} /><ol>{limitations(meta).map((text,i) => <li key={i}>{text}</li>)}</ol><p className="section-caption">{recallLimitation}</p><h3>Industry payments and vendor groupings</h3><ul>{paymentLimitations.map(text => <li key={text}>{text}</li>)}</ul></section>}
    <SiteFooter onMethodology={toggleMethodology} methodologyOpen={about} />
  </div>;
}

const devices = new Map<string, SearchResult>();
const parts = new Map<string, PartMatch>();
const loadDevices = async (q: string, signal: AbortSignal): Promise<SearchLoad> => {
  const partRead = searchParts(q).catch(() => null);
  const rows = (await searchDevices(normalizeDeviceNumber(q) ?? q, signal)).map((row): SearchOption => { devices.set(row.knumber, row); return { id: row.knumber, name: shortDeviceName(row.device_name ?? row.knumber), detail: `${row.knumber} · ${row.applicant ?? 'NOT FOUND'}`, date: dateLabel(row.decision_date), extra: row.match === 'close spelling' ? 'close spelling' : undefined }; });
  const partResult = await partRead;
  const partRows = (partResult?.results ?? []).filter(p => p.on_site !== false && !!p.number).map((p): SearchOption => { const id = `part:${p.number}|${p.part_number}`; parts.set(id, p); return { id, group: 'Part numbers', name: `${p.part_number}${p.brand ? ` · ${p.brand}` : ''}`, detail: `${p.number} · ${shortDeviceName(p.device_name ?? 'NOT FOUND')} · ${p.company ?? 'NOT FOUND'}`, tag: p.in_distribution === false ? 'Not in commercial distribution' : undefined }; });
  return { rows: [...rows.map(r => partRows.length ? { ...r, group: 'Products' } : r), ...partRows], note: partResult?.note ?? null };
};

export function DeviceSearch({ label = 'Identify an orthopedic device to benchmark', resetKey = '', initialValue, onSelect, placeholder = 'e.g. an FDA number, product name, company or part number', variant = 'legacy', submitLabel, autoSearch = false, onSubmitValue, inputId }: { label?: string; resetKey?: string; initialValue?: string; onSelect: (row: SearchResult, part?: string) => void; placeholder?: string; variant?: 'legacy' | 'op'; submitLabel?: string; autoSearch?: boolean; onSubmitValue?: (value: string) => void; inputId?: string }) {
  const [name, setName] = useState(initialValue ?? resetKey);
  useEffect(() => { setName(initialValue ?? resetKey); const update = (event: Event) => { if (event instanceof CustomEvent && typeof event.detail === 'string') setName(event.detail); }; window.addEventListener('benchmark-name', update); return () => window.removeEventListener('benchmark-name', update); }, [initialValue, resetKey]);
  return <ResearchSearch label={label} placeholder={placeholder} initialValue={name} load={loadDevices} onSelect={id => { const part = parts.get(id); if (part) { onSelect({ knumber: part.number ?? '' } as SearchResult, part.part_number); return; } const row = devices.get(id); if (row) onSelect(row); }} variant={variant} submitLabel={submitLabel} autoSearch={autoSearch} onSubmitValue={onSubmitValue} inputId={inputId} />;
}

export function BriefLink({ k }: { k: string }) { return <Link to="/" search={{ k: normalizeDeviceNumber(k) ?? k }} className="brief-link font-mono">{k}</Link>; }
export function PathwayTag({ number }: { number: string }) { return <span className="data-tag">{devicePathway(number)}</span>; }
export function PdfLink({ url }: { url?: string | null }) { return url && /^https:\/\//.test(url) ? <a href={url} target="_blank" rel="noopener noreferrer" className="brief-link">FDA summary ›</a> : <span className="text-muted-foreground">PDF unavailable</span>; }

export function Status({ error, busy }: { error?: string | undefined; busy?: boolean | undefined }) {
  const [retrying, setRetrying] = useState(false);
  useEffect(() => { if (!busy) { setRetrying(false); return; } const on = () => setRetrying(true); window.addEventListener('pc-retrying', on); return () => window.removeEventListener('pc-retrying', on); }, [busy]);
  if (error === LOAD_FAILED) return <div className="notice" role="alert">{error}<Button size="sm" variant="secondary" onClick={() => window.dispatchEvent(new Event('pc-refetch'))}>Try again</Button></div>;
  return error ? <div className="notice" role="alert">{error}</div> : busy ? <div className="notice" role="status"><LoaderCircle size={16} className="animate-spin" />{retrying ? 'Still loading this brief…' : 'Loading research…'}</div> : null;
}

export function PublicRecordLoading({ error }: { error?: string | undefined }) {
  return error ? <Status error={error} /> : <div className="public-record-loading section-caption no-print" role="status"><LoaderCircle size={18} className="animate-spin shrink-0" aria-hidden="true" />Loading the public record…</div>;
}

export function useRefetch() { const [n, setN] = useState(0); useEffect(() => { const on = () => setN(x => x + 1); window.addEventListener('pc-refetch', on); return () => window.removeEventListener('pc-refetch', on); }, []); return n; }
export function PageTitle({ name }: { name: string }) { return <div className="page-title"><div className="eyebrow">FDA 510(k) · Orthopedic devices</div><h1>{name}</h1></div>; }
export function pageHead(name: string, description: string) { const title = pageTitle(name); return { meta: [{ title }, { name: 'description', content: description }, { property: 'og:title', content: title }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }; }
