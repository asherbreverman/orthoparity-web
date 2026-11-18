import { ClientOnly, createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { fallback, zodValidator } from '@tanstack/zod-adapter';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Copy, Check, Download, FileSpreadsheet, ChevronDown, Info, GitBranch, ArrowRight } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { benchmarkTitle, benchmarkDescription, benchmarkOrigin } from '@/lib/benchmark-brand';
import shareImage from '@/assets/orthoparity-share.png.asset.json';
import { Button } from '@/components/ui/button';
import { DeviceSearch, BriefLink, PdfLink, Status, PageTitle, pageHead, useRelease } from '@/components/reviewer-shared';
import { getBrief, getFamily, lookupChain, getProductPayments, getVendorCoverage } from '@/lib/predicate-data';
import { VendorSearch } from '@/components/vendor-search';
import { ProductPaymentSection } from '@/components/payment-shared';
import { withPaymentQuestions, type ProductPayments } from '@/lib/vendor-data';
import { fallbackVendorCoverage } from '@/lib/vendor-coverage';
import { dateLabel } from '@/lib/predicate-chain';
import { filterPeers, lineageSentence, patternExplanation, unreviewedLow, questionGroups, questionsText, type Brief } from '@/lib/reviewer-data';
const CategoryChart = lazy(() => import('@/components/category-chart'));
const Evidence = lazy(() => import('@/components/predicate-evidence').then(m => ({ default: m.PredicateEvidence })));
const VendorWorkspace = lazy(() => import('@/components/vendor-workspace').then(m => ({default: m.VendorWorkspace})));
export const Route = createFileRoute('/')({
  validateSearch: zodValidator(z.object({k: fallback(z.string(), '').optional(), v: fallback(z.string(), '').optional(), compare: fallback(z.string(), '').optional(), own: fallback(z.string(), '').optional(), mode: fallback(z.string(), '').optional()})),
  head: () => ({ meta: [{ title: benchmarkTitle }, { name: 'description', content: benchmarkDescription }, { property: 'og:title', content: benchmarkTitle }, { property: 'og:description', content: benchmarkDescription }, { property: 'og:type', content: 'website' }, { property: 'og:url', content: benchmarkOrigin + '/' }, { property: 'og:image', content: new URL(shareImage.url, benchmarkOrigin).href }, { name: 'twitter:image', content: new URL(shareImage.url, benchmarkOrigin).href }, { name: 'twitter:card', content: 'summary_large_image' }], links: [{ rel: 'canonical', href: benchmarkOrigin + '/' }] }),
  component: DeviceBrief,
});
function DeviceBrief() {
  const { k, v, compare, own, mode } = Route.useSearch();
  const vendorMode = !!v || mode === 'vendor';
  const navigate = useNavigate();
  const { meta } = useRelease();
  const [coverage, setCoverage] = useState(fallbackVendorCoverage);
  useEffect(() => { let active = true; getVendorCoverage().then(data => { if (active) setCoverage(data); }).catch(() => {}); return () => { active = false; }; }, []);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [payments, setPayments] = useState<ProductPayments | null>(null);
  const [paymentError, setPaymentError] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [evidence, setEvidence] = useState(false);
  const [other, setOther] = useState(false);
  const [sameCode, setSameCode] = useState(false);
  const [copied, setCopied] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());
  const benchmarkRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const request = useRef(0);
  useEffect(() => {
    const id = ++request.current;
    setBrief(null); setError(''); setExpanded(false); setEvidence(false); setOther(false); setSameCode(false); setCopied(''); setSelectedQuestions(new Set());
    if (!k) { setBusy(false); return; }
    setBusy(true);
    getBrief(k).then(data => { if (id === request.current) setBrief(data); }).catch(e => { if (id === request.current) setError(e.message); }).finally(() => { if (id === request.current) setBusy(false); });
    return () => { request.current++; };
  }, [k]);
  useEffect(() => { let active = true; setPayments(null); setPaymentError(''); if (!k || vendorMode) return; getProductPayments(k).then(p => { if (active) setPayments(p); }).catch(e => { if (active) setPaymentError(e.message); }); return () => { active = false; }; }, [k, vendorMode]);
  useEffect(() => { if (brief?.found) benchmarkRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }); }, [brief]);
  const device = brief?.device;
  const enrichedBrief = brief ? withPaymentQuestions(brief, payments) : null;
  const groups = enrichedBrief ? questionGroups(enrichedBrief) : [];
  async function download(type: 'pdf' | 'xlsx') {
    if (!brief || !device) return;
    setDownloading(true); setError('');
    try {
      if (type === 'pdf') { const { exportBriefPdf } = await import('@/lib/reviewer-export'); await exportBriefPdf(enrichedBrief ?? brief, meta); }
      else { const [chain, family] = await Promise.all([lookupChain([device.knumber], Number(meta.max_generations) || 10), getFamily(device.knumber)]); const { exportWorkbook } = await import('@/lib/predicate-export'); await exportWorkbook(chain, meta, device.device_name ?? device.knumber, family); }
    } catch (e) { setError(e instanceof Error ? e.message : 'The download could not be created.'); } finally { setDownloading(false); }
  }
  async function copy(selected: boolean) { try { await navigator.clipboard.writeText(questionsText(groups, selected ? selectedQuestions : undefined)); setCopied(selected ? 'selected' : 'all'); } catch { setError('Copy was unavailable. Select the questions to copy them.'); } }
  function tick(id: number, checked: boolean) { setSelectedQuestions(previous => { const next = new Set(previous); if (checked) next.add(id); else next.delete(id); return next; }); setCopied(''); }
  const peers = brief ? filterPeers(brief.peers?.peers ?? [], other, sameCode) : [];
  return <>
    <section className="identify-step"><div className="mode-tabs" role="tablist" aria-label="Benchmark mode"><Button role="tab" aria-selected={!vendorMode} variant="ghost" onClick={() => void navigate({to:'/',search:{}})}>Benchmark a product</Button><Button role="tab" aria-selected={vendorMode} variant="ghost" onClick={() => void navigate({to:'/',search:{mode:'vendor'}})}>Benchmark a vendor</Button></div><h1>{vendorMode ? 'Identify an orthopedic vendor to benchmark' : 'Identify an orthopedic device to benchmark'}</h1>{vendorMode ? <><p>Search by orthopedic vendor company name. Covers {coverage.count.toLocaleString('en-US')} orthopedic vendors with 510(k) clearances from {coverage.first} to {coverage.last}.</p><VendorSearch key={v ?? 'vendor'} onSelect={row => void navigate({to:'/',search:{v:row.vendor_id}})} /></> : <><p>Search by 510(k) number, product name or company. Covers {meta.starting_set_clearances ? Number(meta.starting_set_clearances).toLocaleString('en-US') : '—'} orthopedic 510(k) clearances from 1976 to 2026.</p><DeviceSearch resetKey={k ?? ''} onSelect={row => void navigate({ to: '/', search: { k: row.knumber } })} /></>}</section>
    {vendorMode ? <ClientOnly><Suspense fallback={<Status busy />}><VendorWorkspace v={v} compare={compare} mode={own === 'current' ? 'current' : 'pit'} meta={meta} onOwnership={m => void navigate({to:'/',search: prev => ({...prev,own:m === 'current' ? 'current' : undefined})})} onCompare={value => void navigate({to:'/',search:prev => ({...prev,compare:value})})} /></Suspense></ClientOnly> : <>
    <Status error={error} busy={busy} />
    {!k && <div className="brief-empty"><GitBranch size={42} className="text-primary" /><h2>No clearance selected</h2></div>}
    {brief && (!brief.found || !device) && <div className="notice">{k}: Not in this database (orthopedic clearances only)</div>}
    {brief?.found && device && <>
      <div ref={benchmarkRef} className="benchmark-step eyebrow">Step 2: Review the benchmark</div>
      <section className="at-glance" aria-label="At a glance">
        <div className="glance-heading"><div><div className="eyebrow">At a glance · <span className="font-mono">{device.knumber}</span>{!brief.product_code?.plain_name && <span>FDA category</span>}</div><h2>{brief.product_code?.plain_name ?? brief.product_code?.fda_name ?? device.product_code ?? 'Category unavailable'}</h2></div><PdfLink url={device.summary_url} /></div>
        {brief.product_code?.plain_description && <p className="plain-description">{brief.product_code.plain_description}</p>}
        {brief.product_code?.reviewed === false && <span className="review-tag">Plain-English description drafted from FDA's definition, pending expert review</span>}
        <dl className="device-facts">
          {[['Device', device.device_name], ['Company', device.applicant], ['Cleared', dateLabel(device.decision_date)], ['Device class', device.device_class], ['Product code / regulation', `${device.product_code ?? '—'} / ${device.regulation_number ?? '—'}`], ['Anatomy', brief.product_code?.anatomy], ['Typical procedures', brief.product_code?.procedures]].map(([label, value]) => <div key={String(label)}><dt>{label}</dt><dd>{value ?? '—'}</dd></div>)}
        </dl>
        <div className="pattern-line"><span className="pattern-badge">{brief.pattern}</span><p>{patternExplanation(brief.pattern, device.stop_reason)}</p><span tabIndex={0} className="info-tip" aria-label="Company matching information"><Info size={15} /><span role="tooltip">Company matching uses applicant names as printed at clearance. A company and its acquisitions can appear as different companies.</span></span></div>
      </section>
      <section className="brief-section"><h2>FDA-cleared use</h2>
        {brief.ifu?.found && brief.ifu.ifu_text ? <><blockquote className={`ifu-quote ${expanded ? '' : 'clamped'}`}>{brief.ifu.ifu_text}</blockquote><div className="section-note">From the 510(k) Indications for Use, page {brief.ifu.page ?? '—'}<Button variant="link" size="sm" onClick={() => setExpanded(!expanded)}>{expanded ? 'Show less' : 'Show more'}<ChevronDown className={expanded ? 'rotate-180' : ''} /></Button></div></> : <p className="text-sm text-muted-foreground">Indications for Use not found in the summary. See the FDA PDF.</p>}
      </section>
      <section className="brief-section"><h2>Cleared as equivalent to</h2><div className="brief-table-scroll"><table className="brief-table"><thead><tr><th>510(k)</th><th>Product</th><th>Company</th><th>Year</th><th>Role</th><th>Notes</th></tr></thead><tbody>{(brief.direct_predicates ?? []).map(p => <tr key={p.predicate}><td><BriefLink k={p.predicate} /></td><td>{p.device_name ?? '—'}</td><td>{p.applicant ?? '—'}</td><td>{p.decision_year ?? '—'}</td><td>{p.role === 'primary' || p.role === 'primary predicate' ? 'Primary' : 'Additional'}</td><td><div className="cell-tags">{p.same_company && <span className="data-tag">Same company</span>}{p.same_code && <span className="data-tag">Same product code</span>}{unreviewedLow(p) && <span className="data-tag text-destructive">Low confidence</span>}{p.number_as_printed && <span>Corrected from {p.number_as_printed}</span>}</div></td></tr>)}</tbody></table></div>{!brief.direct_predicates?.length && <p className="section-note">No numbered predicates on file.</p>}<p className="section-caption">FDA found this device substantially equivalent to these predicates, as listed in the 510(k) summary.</p></section>
      <section className="brief-section"><h2>Technology line</h2><p className="section-lead">{lineageSentence(brief.lineage)}</p><ol className="technology-line">{[{ generation: 0, knumber: device.knumber, device_name: device.device_name, applicant: device.applicant, decision_year: device.decision_year, stop: null }, ...[...(brief.lineage?.path ?? [])].sort((a,b) => a.generation-b.generation)].map((step, i) => <li key={`${step.knumber}-${i}`}><span className="step-generation">{i === 0 ? 'Selected clearance' : `Generation ${step.generation}`}</span><BriefLink k={step.knumber} /><strong title={step.device_name ?? ''}>{step.device_name ?? '—'}</strong><span>{step.applicant ?? '—'}</span><time>{step.decision_year ?? 'Year unavailable'}</time><ArrowRight className="step-arrow" size={16} /></li>)}</ol>
        {brief.lineage?.stopped_by_limit ? <p className="stop-label">Generation limit reached</p> : brief.lineage?.ends_at?.stop && <p className="stop-label">Record stops here: {brief.lineage.ends_at.stop}</p>}<p className="section-caption">Where the record stops is where the paper trail ends, not proof of the original design.</p>
      </section>
      <section className="brief-section"><h2>Peers cleared against the same predicates</h2><p className="section-lead">{brief.peers.total} other orthopedic clearances from {brief.peers.other_companies} other companies were cleared against at least one of the same predicates.</p><div className="peer-filters"><Button variant={other ? 'secondary' : 'outline'} size="sm" aria-pressed={other} onClick={() => setOther(!other)}>{other && <Check />}Other companies only</Button><Button variant={sameCode ? 'secondary' : 'outline'} size="sm" aria-pressed={sameCode} onClick={() => setSameCode(!sameCode)}>{sameCode && <Check />}Same product code only</Button><span className="section-note">{peers.length} records</span></div><div className="brief-table-scroll peer-table"><table className="brief-table"><thead><tr><th>510(k)</th><th>Product</th><th>Company</th><th>Year</th><th>Product code</th><th>Shared predicates</th></tr></thead><tbody>{peers.map(p => <tr key={p.knumber}><td><BriefLink k={p.knumber} /></td><td>{p.device_name ?? '—'}</td><td>{p.applicant ?? '—'}</td><td>{p.decision_year ?? '—'}</td><td>{p.product_code ?? '—'}</td><td className="font-mono">{p.shared?.join(', ')}</td></tr>)}</tbody></table></div>{!peers.length && <p className="section-note">No peers match these filters.</p>}<p className="section-caption">Peers share a predicate. That suggests a similar design basis, not that FDA compared them with each other.</p></section>
      <Status error={paymentError} busy={!payments && !paymentError} />
      {payments && <ProductPaymentSection payments={payments} />}
      {brief.category && <section className="brief-section"><h2>Category context <span className="text-muted-foreground font-mono">{device.product_code}</span></h2><div className="category-metrics">{[['Total clearances', brief.category.total], ['Clearances · last five years', brief.category.last5_clearances], ['Companies · last five years', brief.category.last5_companies]].map(([label,value]) => <div className="metric" key={label}><div className="metric-label">{label}</div><div className="metric-value">{value}</div></div>)}</div><ClientOnly fallback={<div className="category-chart skeleton" />}><Suspense fallback={<div className="category-chart skeleton" />}><CategoryChart rows={brief.category.by_year ?? []} /></Suspense></ClientOnly><div className="two-columns">{[{ title: 'Top companies · all time', rows: brief.category.top_companies ?? [] }, { title: 'Top companies · last five years', rows: brief.category.top_companies_last5 ?? [] }].map(group => <div key={group.title}><h3>{group.title}</h3><div className="brief-table-scroll"><table className="brief-table"><thead><tr><th>Company</th><th>Clearances</th></tr></thead><tbody>{group.rows.map(row => <tr key={row.applicant}><td>{row.applicant}</td><td>{row.clearances}</td></tr>)}</tbody></table></div></div>)}</div><p className="section-caption">Counts cover orthopedic 510(k) clearances in this product code through {brief.category.latest_year}.</p></section>}
      <section className="brief-section question-section"><div className="section-heading"><h2>Questions to ask the vendor</h2><div className="question-actions"><Button variant="outline" size="sm" onClick={() => void copy(false)}>{copied === 'all' ? <Check /> : <Copy />}{copied === 'all' ? 'Copied all questions' : 'Copy all questions'}</Button><Button variant="outline" size="sm" disabled={!selectedQuestions.size} onClick={() => void copy(true)}>{copied === 'selected' ? <Check /> : <Copy />}{copied === 'selected' ? 'Copied selected' : 'Copy selected'}</Button></div></div>
        {groups.map((group, index) => <div className="question-group" key={index}>{index === 1 && <h3 className="standard-heading">Standard VAC questions</h3>}<h3>{group.topic}</h3><ol className="vendor-questions" start={(group.items[0]?.id ?? 0) + 1}>{group.items.map(item => <li key={item.id}><label><Checkbox checked={selectedQuestions.has(item.id)} onCheckedChange={checked => tick(item.id, checked === true)} aria-label={`Select question ${item.id + 1}`} /><span>{item.question}</span></label></li>)}</ol></div>)}
        <p className="section-caption">Device-specific questions come from fixed rules on the FDA data above. Standard questions are a starting checklist for value analysis; adapt them to your committee.</p>
      </section>
      <section className="brief-actions"><Button disabled={downloading} onClick={() => void download('pdf')}><Download />Download brief (PDF)</Button><Button variant="outline" disabled={downloading} onClick={() => void download('xlsx')}><FileSpreadsheet />Analyst workbook (Excel)</Button><Button variant="ghost" aria-expanded={evidence} onClick={() => setEvidence(!evidence)}><ChevronDown className={evidence ? 'rotate-180' : ''} />{evidence ? 'Hide evidence' : 'Show evidence'}</Button></section>
      {evidence && <ClientOnly><Suspense fallback={<Status busy />}><Evidence key={device.knumber} meta={meta} selected={{ knumber: device.knumber, device_name: device.device_name ?? '', applicant: device.applicant ?? '', decision_date: device.decision_date }} /></Suspense></ClientOnly>}
    </>}
    </>}
  </>;
}
