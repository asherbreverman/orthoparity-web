import { ClientOnly } from '@tanstack/react-router';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Copy, Check, Download, FileSpreadsheet, ChevronDown, Info, ExternalLink } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { BriefLink, PdfLink, Status, useRefetch } from './reviewer-shared';
import { Metrics, Studies } from './payment-shared';
import { ProductRecallEvidence } from './recall-evidence';
import { BottomLine, GlanceTiles, DecisionCards, EvidenceSection, Notes, PrintBrief, useEvidence } from './decision-shared';
import { getBrief, getFamily, lookupChain, getProductPayments, getSignals } from '@/lib/predicate-data';
import { withPaymentQuestions, money, dollars, type ProductPayments } from '@/lib/vendor-data';
import { LocalBar, ExtraEvidence } from './story-shared';
import { toast } from 'sonner';
import { dateLabel, type Meta } from '@/lib/predicate-chain';
import { filterPeers, lineageSentence, patternExplanation, unreviewedLow, questionGroups, questionsText, type Brief, type QuestionGroup } from '@/lib/reviewer-data';
import { askLines, longDate, type Signals, type View } from '@/lib/signals';
const CategoryChart = lazy(() => import('./category-chart'));
const PaymentYears = lazy(() => import('./payment-charts').then(m => ({ default: m.PaymentYears })));
const Evidence = lazy(() => import('./predicate-evidence').then(m => ({ default: m.PredicateEvidence })));

export function ProductResult({ k, view, meta, onView }: { k: string; view: View; meta: Meta; onView: (v: View) => void }) {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [signals, setSignals] = useState<Signals | null>(null);
  const [payments, setPayments] = useState<ProductPayments | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [workspace, setWorkspace] = useState(false);
  const [other, setOther] = useState(false);
  const [sameCode, setSameCode] = useState(false);
  const [allAlternatives, setAllAlternatives] = useState(false);
  const [checklist, setChecklist] = useState(false);
  const [copied, setCopied] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const ev = useEvidence(view);
  const reload = useRefetch();
  const top = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true;
    setBrief(null); setSignals(null); setPayments(null); setError(''); setPaymentError(''); setExpanded(false); setWorkspace(false); setOther(false); setSameCode(false); setAllAlternatives(false); setChecklist(false); setCopied(''); setSelected(new Set()); ev.reset();
    setBusy(true);
    Promise.all([getBrief(k), getSignals(k)]).then(([b, s]) => { if (active) { setBrief(b); setSignals(s); } }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setBusy(false); });
    getProductPayments(k).then(p => { if (active) setPayments(p); }).catch(e => { if (active) setPaymentError(e.message); });
    return () => { active = false; };
  }, [k, reload]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (brief?.found) top.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }); }, [brief]);

  useEffect(() => { const title = signals?.header?.device_name ?? brief?.device?.device_name; if (title) window.dispatchEvent(new CustomEvent('benchmark-name', { detail: title })); }, [brief, signals]);

  if (!brief) return <Status error={error} busy={busy} />;
  const device = brief.device;
  if (!brief.found || !device) return <div className="notice">{k}: Not in this database (orthopedic clearances only)</div>;
  const s = signals?.found ? signals : null;
  const h = s?.header;
  const cards = s?.cards ?? [];
  const asks = askLines(cards);
  const enriched = withPaymentQuestions(brief, payments);
  const checklistGroups = questionGroups(enriched);
  const offset = asks.length;
  const groups: QuestionGroup[] = [{ topic: 'Questions for the vendor', items: asks.map((question, id) => ({ id, question })) }, ...checklistGroups.map(g => ({ topic: g.topic, items: g.items.map(i => ({ id: i.id + offset, question: i.question })) }))];
  const checklistCount = checklistGroups.reduce((n, g) => n + g.items.length, 0);
  const peers = filterPeers(brief.peers?.peers ?? [], other, sameCode);
  const altRows = s?.alternatives.rows ?? [];
  const card = (key: string) => cards.find(c => c.key === key);
  const p = payments;
  const name = h?.device_name ?? device.device_name ?? device.knumber;
  const plain = h?.plain_name ?? brief.product_code?.plain_name ?? h?.fda_name ?? brief.product_code?.fda_name ?? 'Category unavailable';
  const code = h?.product_code ?? device.product_code ?? '—';
  async function copy(which: 'all' | 'selected' | 'asks') {
    try { await navigator.clipboard.writeText(which === 'asks' ? asks.map((q, i) => `${i + 1}. ${q}`).join('\n') : questionsText(groups, which === 'selected' ? selected : undefined)); setCopied(which); toast.success('Questions copied'); } catch { setError('Copy was unavailable. Select the questions to copy them.'); }
  }
  function tick(id: number, checked: boolean) { setSelected(prev => { const n = new Set(prev); if (checked) n.add(id); else n.delete(id); return n; }); setCopied(''); }
  async function workbook() {
    if (!device) return; setDownloading(true);
    try { const [chain, family] = await Promise.all([lookupChain([device.knumber], Number(meta.max_generations) || 10), getFamily(device.knumber)]); const { exportWorkbook } = await import('@/lib/predicate-export'); await exportWorkbook(chain, meta, device.device_name ?? device.knumber, family); }
    catch (e) { setError(e instanceof Error ? e.message : 'The download could not be created.'); } finally { setDownloading(false); }
  }
  const qList = (items: QuestionGroup['items']) => <ol className="vendor-questions" start={(items[0]?.id ?? 0) + 1}>{items.map(item => <li className={`question-hue-${cards[item.id]?.key === 'recalls' ? 7 : item.id % 7 + 1}`} key={item.id}><label><Checkbox checked={selected.has(item.id)} onCheckedChange={c => tick(item.id, c === true)} aria-label={`Select question ${item.id + 1}`} /><span>{item.question}</span></label></li>)}</ol>;
  const category = brief.category;
  const evidenceSections = (
<div className="evidence-list">
      <EvidenceSection id="recalls" title="Recalls" summary={card('recalls')?.badge ?? ''} open={ev.isOpen('recalls')} onToggle={() => ev.toggle('recalls')}>
        <ProductRecallEvidence k={k} />
      </EvidenceSection>
      <EvidenceSection id="predicates" title="Predicates and lineage" summary={`${brief.direct_predicates?.length ?? 0} direct predicates · ${lineageSentence(brief.lineage)}`} open={ev.isOpen('predicates')} onToggle={() => ev.toggle('predicates')}>
        <h3>Cleared as equivalent to</h3>
        <div className="brief-table-scroll"><table className="brief-table"><thead><tr><th>510(k)</th><th>Product</th><th>Company</th><th>Year</th><th>Role</th><th>Notes</th></tr></thead><tbody>{(brief.direct_predicates ?? []).map(pr => <tr key={pr.predicate}><td><BriefLink k={pr.predicate} /></td><td>{pr.device_name ?? '—'}</td><td>{pr.applicant ?? '—'}</td><td>{pr.decision_year ?? '—'}</td><td>{pr.role === 'primary' || pr.role === 'primary predicate' ? 'Primary' : 'Additional'}</td><td><div className="cell-tags">{pr.same_company && <span className="data-tag">Same company</span>}{pr.same_code && <span className="data-tag">Same product code</span>}{unreviewedLow(pr) && <span className="data-tag">Low confidence</span>}{pr.number_as_printed && <span>Corrected from {pr.number_as_printed}</span>}</div></td></tr>)}</tbody></table></div>
        {!brief.direct_predicates?.length && <p className="section-note">No numbered predicates on file.</p>}
        <p className="section-caption">FDA found this device substantially equivalent to these predicates, as listed in the 510(k) summary.</p>
        <div className="pattern-line"><span className="pattern-badge">{brief.pattern}</span><p>{patternExplanation(brief.pattern, device.stop_reason)}</p><span tabIndex={0} className="info-tip" aria-label="Company matching information"><Info size={15} /><span role="tooltip">Company matching uses applicant names as printed at clearance. A company and its acquisitions can appear as different companies.</span></span></div>
        <h3 className="mt-6">Technology line</h3><p className="section-lead">{lineageSentence(brief.lineage)}</p>
        <ol className="lineage-list">{[{ generation: 0, knumber: device.knumber, device_name: device.device_name, applicant: device.applicant, decision_year: device.decision_year }, ...[...(brief.lineage?.path ?? [])].sort((a, b) => a.generation - b.generation)].map((step, i) => <li key={`${step.knumber}-${i}`}><span className="step-generation">{i === 0 ? 'Selected' : `Gen ${step.generation}`}</span><BriefLink k={step.knumber} /><strong>{step.device_name ?? '—'}</strong><span>{step.applicant ?? '—'}</span><time>{step.decision_year ?? '—'}</time></li>)}</ol>
        {brief.lineage?.stopped_by_limit ? <p className="stop-label">Generation limit reached</p> : brief.lineage?.ends_at?.stop && <p className="stop-label">Record stops here: {brief.lineage.ends_at.stop}</p>}
        <p className="section-caption">Where the record stops is where the paper trail ends, not proof of the original design.</p>
        <h3 className="mt-6">FDA-cleared use</h3>
        {brief.ifu?.found && brief.ifu.ifu_text ? <><blockquote className={`ifu-quote ${expanded ? '' : 'clamped'}`}>{brief.ifu.ifu_text}</blockquote><div className="section-note">From the 510(k) Indications for Use, page {brief.ifu.page ?? '—'}<Button variant="link" size="sm" onClick={() => setExpanded(!expanded)}>{expanded ? 'Show less' : 'Show more'}<ChevronDown className={expanded ? 'rotate-180' : ''} /></Button></div></> : <p className="text-sm text-muted-foreground">Indications for Use not found in the summary. See the FDA PDF.</p>}
      </EvidenceSection>
      <EvidenceSection id="alternatives" title="Alternatives in this category" summary={s ? `${s.alternatives.companies.toLocaleString('en-US')} other companies · ${brief.peers.total.toLocaleString('en-US')} peers on the same predicates` : 'Loading…'} open={ev.isOpen('alternatives')} onToggle={() => ev.toggle('alternatives')}>
        {s && <><p className="section-caption">{s.alternatives.window}</p><div className="brief-table-scroll"><table className="brief-table"><thead><tr><th>Company</th><th>Clearances · last five years</th><th>Latest device</th><th>Latest 510(k)</th><th>Latest date</th></tr></thead><tbody>{(allAlternatives ? altRows : altRows.slice(0, 10)).map(r => <tr key={r.vendor_id}><td>{r.company}</td><td>{r.clearances.toLocaleString('en-US')}</td><td>{r.latest_device ?? '—'}</td><td>{r.latest_knumber ? <BriefLink k={r.latest_knumber} /> : '—'}</td><td>{longDate(r.latest_date)}</td></tr>)}</tbody></table></div>{altRows.length > 10 && <Button variant="link" className="px-0" onClick={() => setAllAlternatives(!allAlternatives)}>{allAlternatives ? 'Show fewer' : `Show all ${altRows.length}`}</Button>}{!altRows.length && <p className="section-note">No other companies cleared this category in the window.</p>}</>}
        <h3 className="mt-6">Peers cleared against the same predicates</h3><p className="section-caption">Cleared against the same predicate devices.</p>
        <p className="section-lead">{brief.peers.total} other orthopedic clearances from {brief.peers.other_companies} other companies were cleared against at least one of the same predicates.</p>
        <div className="peer-filters"><Button variant={other ? 'secondary' : 'outline'} size="sm" aria-pressed={other} onClick={() => setOther(!other)}>{other && <Check />}Other companies only</Button><Button variant={sameCode ? 'secondary' : 'outline'} size="sm" aria-pressed={sameCode} onClick={() => setSameCode(!sameCode)}>{sameCode && <Check />}Same product code only</Button><span className="section-note">{peers.length} records</span></div>
        <div className="brief-table-scroll peer-table"><table className="brief-table"><thead><tr><th>510(k)</th><th>Product</th><th>Company</th><th>Year</th><th>Product code</th><th>Shared predicates</th></tr></thead><tbody>{peers.map(pe => <tr key={pe.knumber}><td><BriefLink k={pe.knumber} /></td><td>{pe.device_name ?? '—'}</td><td>{pe.applicant ?? '—'}</td><td>{pe.decision_year ?? '—'}</td><td>{pe.product_code ?? '—'}</td><td className="font-mono">{pe.shared?.join(', ')}</td></tr>)}</tbody></table></div>
        {!peers.length && <p className="section-note">No peers match these filters.</p>}
        <p className="section-caption">Peers share a predicate. That suggests a similar design basis, not that FDA compared them with each other.</p>
      </EvidenceSection>
      <EvidenceSection id="payments" title="Industry payments" summary={card('payments')?.badge ?? (p ? (p.exact.total + p.brand_match.total > 0 ? `${money(p.exact.total + p.brand_match.total)} named this product` : 'No payments name this product') : 'Loading…')} open={ev.isOpen('payments')} onToggle={() => ev.toggle('payments')}>
        <Status error={paymentError} busy={!p && !paymentError} />
        {card('payments') && <p className="section-lead">{card('payments')?.finding}</p>}
        {p && <>{p.exact.total === 0 && p.brand_match.total === 0 ? <p className="section-caption">No Open Payments records name this 510(k) or its brand. Payments may still exist under the vendor without a product named.</p> : <><p className="section-caption" title={dollars(p.exact.total)}>{money(p.exact.total)} name this 510(k)'s devices by device ID (2021 to 2025){p.brand_match.total > 0 && <> · {money(p.brand_match.total)} more name its brand ({p.brand}) without a device ID</>}</p><ClientOnly><Suspense fallback={<div className="payment-chart skeleton" />}><PaymentYears rows={p.exact.rows} brandRows={p.brand_match.rows} /></Suspense></ClientOnly></>}
          <Metrics items={([['Royalties', p.royalty], ['Consulting', p.consulting]] as [string, number][]).filter(([, v]) => v > 0).map(([l, v]) => [l, money(v)] as [string, string | number]).concat(([['Most royalty recipients in a year', p.royalty_recipients_max_year], ['Most consultants in a year', p.consulting_recipients_max_year]] as [string, number][]).filter(([, v]) => v > 0))} />
          {p.code_context && <p className="section-caption">Among {p.code_context.products_with_payments} products in product code {p.code_context.product_code} with device-ID payments, the median is {money(p.code_context.median_amount)}; royalties are {p.code_context.royalty_pct}% of those payments.</p>}
          <p className="section-caption">{p.exact.label}<br />{p.brand_match.label}<br />{p.note}</p>
          <a className="brief-link" href="https://openpaymentsdata.cms.gov" target="_blank" rel="noopener noreferrer">Look up individual payments at openpaymentsdata.cms.gov<ExternalLink size={12} /></a></>}
      </EvidenceSection>
      <EvidenceSection id="research" title="Research" summary={p ? (p.research?.length ? `${p.research.length} linked studies` : 'No linked studies') : 'Loading…'} open={ev.isOpen('research')} onToggle={() => ev.toggle('research')}>
        {p ? <Studies rows={p.research ?? []} /> : <Status busy={!paymentError} error={paymentError} />}
      </EvidenceSection>
      <EvidenceSection id="catalog" title="Catalog" summary={card('catalog')?.badge ?? 'Catalog items'} open={ev.isOpen('catalog')} onToggle={() => ev.toggle('catalog')}>
        {card('catalog') ? <p className="section-lead">{card('catalog')?.finding}</p> : <p className="section-note">Catalog data unavailable.</p>}
        {s?.notes[2] && <p className="section-caption">{s.notes[2]}</p>}
      </EvidenceSection>
      {category && <EvidenceSection id="category" title="Category context" summary={`${category.total.toLocaleString('en-US')} clearances in ${code} · ${category.last5_companies} companies in the last five years`} open={ev.isOpen('category')} onToggle={() => ev.toggle('category')}>
        <div className="category-metrics">{([['Total clearances', category.total], ['Clearances · last five years', category.last5_clearances], ['Companies · last five years', category.last5_companies]] as [string, number][]).map(([label, value]) => <div className="metric" key={label}><div className="metric-label">{label}</div><div className="metric-value">{value.toLocaleString('en-US')}</div></div>)}</div>
        <dl className="device-facts">{[['Product code / regulation', `${device.product_code ?? '—'} / ${device.regulation_number ?? '—'}`], ['Anatomy', brief.product_code?.anatomy], ['Cleared', dateLabel(device.decision_date)]].map(([label, value]) => <div key={String(label)}><dt>{label}</dt><dd>{value ?? '—'}</dd></div>)}</dl>
        <h3>Top companies, last five years</h3><div className="brief-table-scroll"><table className="brief-table"><thead><tr><th>Company</th><th>Clearances</th></tr></thead><tbody>{(category.top_companies_last5 ?? []).slice(0, 5).map(r => <tr key={r.applicant}><td>{r.applicant}</td><td>{r.clearances}</td></tr>)}</tbody></table></div>
        {view === 'analyst' && <><h3 className="mt-6">Clearances by year</h3><ClientOnly fallback={<div className="category-chart skeleton" />}><Suspense fallback={<div className="category-chart skeleton" />}><CategoryChart rows={category.by_year ?? []} /></Suspense></ClientOnly><h3>Top companies, all time</h3><div className="brief-table-scroll"><table className="brief-table"><thead><tr><th>Company</th><th>Clearances</th></tr></thead><tbody>{(category.top_companies ?? []).map(r => <tr key={r.applicant}><td>{r.applicant}</td><td>{r.clearances}</td></tr>)}</tbody></table></div></>}
        <p className="section-caption">Counts cover orthopedic 510(k) clearances in this product code through {category.latest_year}.</p>
      </EvidenceSection>}
    </div>
  );
  return <>
    <Status error={error} />
    <PrintBrief meta={meta} title={name} subtitle={`${h?.company ?? device.applicant ?? '—'} · ${plain} (${code}) · ${device.knumber} · cleared ${longDate(h?.cleared ?? device.decision_date)}`} bottomLine={s?.bottom_line ?? ''} cards={cards} table={{ caption: `Alternatives in this category · ${s?.alternatives.window ?? ''}`, head: ['Company', 'Clearances', 'Latest device', 'Latest 510(k)', 'Latest date'], rows: altRows.map(r => [r.company, r.clearances, r.latest_device ?? '—', r.latest_knumber ?? '—', longDate(r.latest_date)]) }} questions={asks} notes={s?.notes ?? []} />
    <section ref={top} className="result-header" aria-label="Device">
      <div className="result-heading">
        <div><h2 className="result-title">{name}</h2>
          {brief.product_code?.plain_description && <p className="plain-description">{brief.product_code.plain_description}</p>}
          <p className="result-meta">{device.knumber} · {h?.company ?? device.applicant ?? '—'} · {plain} ({code}) · Cleared {longDate(h?.cleared ?? device.decision_date)} · Class {h?.device_class ?? device.device_class ?? '—'}</p>
          {(h?.procedures ?? brief.product_code?.procedures) && <p className="result-meta">Procedures: {h?.procedures ?? brief.product_code?.procedures}</p>}
          {brief.product_code?.reviewed === false && <span className="review-tag">Plain-English description drafted from FDA's definition, pending expert review</span>}
        </div>
        <div className="result-actions"><div className="no-print result-buttons"><Button onClick={() => window.print()}>Download brief</Button><PdfLink url={h?.summary_url ?? device.summary_url} /><Button variant="link" disabled={!asks.length} onClick={() => void copy('asks')}>Copy questions ›</Button></div></div>
      </div>
      {s && <BottomLine text={s.bottom_line} />}
      {s && <GlanceTiles cards={cards} />}
    </section>
    <LocalBar name={name} cards={cards} view={view} onView={onView} />
    {!s && <Status busy={!signals && !error} error={signals && !signals.found ? 'Decision signals are unavailable for this clearance.' : undefined} />}
    {s && <DecisionCards cards={cards} onEvidence={ev.reveal} evidence={evidenceSections} />}
    <section id="all-questions" className="brief-section question-section"><div className="section-heading"><h2>Questions for the vendor</h2><div className="question-actions no-print"><Button size="sm" onClick={() => void copy('all')}>{copied === 'all' ? <Check /> : <Copy />}Copy all</Button>{selected.size > 0 && <Button variant="outline" size="sm" onClick={() => void copy('selected')}>{copied === 'selected' ? <Check /> : <Copy />}Copy selected</Button>}<Button onClick={() => window.print()}>Download brief</Button></div></div>
      {groups[0] && qList(groups[0].items)}
      <EvidenceSection id="checklist" title="Full value analysis checklist" summary={`${checklistCount} questions`} open={checklist} onToggle={() => setChecklist(!checklist)}>{groups.slice(1).map((g, i) => <div className="question-group" key={i}><h3>{g.topic}</h3>{qList(g.items)}</div>)}</EvidenceSection>
      <p className="section-caption">Questions come from fixed rules on the public data. The checklist is a starting point for value analysis; adapt it to your committee.</p>
    </section>

    <ExtraEvidence sections={evidenceSections} cards={cards} />
    {s && <Notes notes={s.notes} />}
    <section id="ancestry" className="ancestry-section"><EvidenceSection id="ancestry" title="Ancestry" summary={device.knumber} open={workspace} onToggle={() => setWorkspace(!workspace)}><div className="brief-actions no-print"><Button variant="outline" disabled={downloading} onClick={() => void workbook()}><FileSpreadsheet />Analyst workbook (Excel)</Button></div><ClientOnly><Suspense fallback={<Status busy />}><Evidence key={device.knumber} meta={meta} selected={{ knumber: device.knumber, device_name: device.device_name ?? '', applicant: device.applicant ?? '', decision_date: device.decision_date }} /></Suspense></ClientOnly></EvidenceSection></section>
  </>;
}
