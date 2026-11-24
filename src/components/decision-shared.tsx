import { Fragment, cloneElement, isValidElement, useCallback, useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { evidenceItems } from './story-shared';
import { ChevronDown, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { evidenceIsOpen, type DecisionCard, type View } from '@/lib/signals';
import type { Meta } from '@/lib/predicate-chain';
import { toast } from 'sonner';
import { BrandMark } from './brand-mark';
import { longDate } from '@/lib/signals';
import { briefFileName, printQuestionGroups, summaryQuestionSet } from '@/lib/brief-print';
import { benchmarkOrigin } from '@/lib/benchmark-brand';
import { normalizeDeviceNumber } from '@/lib/fda-device';
import { topVendorQuestions } from '@/lib/vac-summary';
import { Term } from './op-controls';

export function useEvidence(view: View, controlled?: {opened: Set<string>; onToggle: (id: string) => void}) {
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const isOpen = useCallback((id: string) => evidenceIsOpen(view, opened, id), [view, opened]);
  const toggle = useCallback((id: string) => setOpened(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; }), []);
  const reveal = useCallback((id: string, keyboard = false) => {
    setOpened(prev => new Set(prev).add(id));
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const section = document.querySelector<HTMLElement>(`[data-evidence="${id}"]`) ?? document.getElementById(`evidence-${id}`);
      if (!section) return;
      section.scrollIntoView({ behavior: keyboard || window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      if (keyboard) {
        const target = section.querySelector<HTMLElement>('button, h2') ?? section;
        if (target.tagName !== 'BUTTON') target.tabIndex = -1;
        target.focus({ preventScroll: true });
      }
    }));
  }, []);
  const reset = useCallback(() => setOpened(new Set()), []);
  return { isOpen: controlled ? (id: string) => evidenceIsOpen(view, controlled.opened, id) : isOpen, toggle: controlled?.onToggle ?? toggle, reveal, reset };
}

export function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return <div className="view-toggle no-print" role="group" aria-label="Detail level">
    <Button size="sm" variant={view === 'brief' ? 'secondary' : 'ghost'} aria-pressed={view === 'brief'} onClick={() => onChange('brief')}>Decision brief</Button>
    <Button size="sm" variant={view === 'analyst' ? 'secondary' : 'ghost'} aria-pressed={view === 'analyst'} onClick={() => onChange('analyst')}>Analyst detail</Button>
  </div>;
}

export function BottomLine({ text }: { text: string }) {
  return text ? <section className="bottom-line" aria-label="The bottom line"><div className="op-eyebrow">The bottom line</div><p className="op-bottom">{text}</p></section> : null;
}

function CopyAsk({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return <button type="button" className="op-copy" aria-label="Copy question" onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); toast.success('Question copied'); setTimeout(() => setDone(false), 2000); } catch { toast.error('Copy was unavailable.'); } }}>{done ? <Check size={14} /> : <Copy size={14} />}Copy question</button>;
}

export function cardHue(_card: DecisionCard, index: number) { return `q${index % 6 + 1}`; }
function AnswerBadge({ children }: { children: string }) {
  return <span className={`op-badge ${children.startsWith('NOT FOUND') ? 'nf' : ''}`}>{children}</span>;
}

export function GlanceTiles({ cards, onEvidence }: { cards: DecisionCard[]; onEvidence?: ((id: string) => void) | undefined }) {
  return <section className="result-glance" aria-label="Questions at a glance"><p className="glance-caption">{cards.length} questions, each with its evidence and a question for the vendor. Select one to go to it.</p><div className="op-glance">{cards.map((c, i) => <a href={`#chapter-${c.key}`} onClick={() => onEvidence?.(c.evidence)} className={`op-gt q${i % 6 + 1}`} key={c.key}><i>{String(i + 1).padStart(2, '0')}</i><small>{c.question}</small><b>{c.badge}</b></a>)}</div></section>;
}

export function TopVendorQuestions({ cards }: { cards: DecisionCard[] }) {
  const questions = topVendorQuestions(cards);
  const [copied, setCopied] = useState(false);
  if (!questions.length) return null;
  return <section className="op-card op-top-questions" aria-labelledby="top-vendor-questions"><div className="op-record-card-heading"><h2 id="top-vendor-questions" className="op-h3">Top {questions.length} questions for the vendor</h2><button type="button" className="op-btn-2" onClick={async () => { try { await navigator.clipboard.writeText(questions.map((question, index) => `${index + 1}. ${question}`).join('\n')); setCopied(true); toast.success('Questions copied'); setTimeout(() => setCopied(false), 2000); } catch { toast.error('Copy was unavailable.'); } }}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? 'Copied' : `Copy these ${questions.length}`}</button></div><ol className="op-qlist">{questions.map((question, index) => <li key={`${index}-${question}`}><span>{question}</span><CopyAsk text={question} /></li>)}</ol></section>;
}

type EvidenceNode = ReactElement<{ id?: string; title?: ReactNode; open: boolean; onToggle: () => void }>;
function CardEvidence({ node }: { node: EvidenceNode }) {
  const [open, setOpen] = useState(false);
  return <div className="op-ev-source">{cloneElement(node, { open, onToggle: () => setOpen(value => !value) })}</div>;
}
function PaymentPrivacyNote() {
  return <p className="op-payment-privacy">Recipient names are public on CMS Open Payments; OrthoParity doesn't show them. <a href="https://openpaymentsdata.cms.gov/" target="_blank" rel="noopener noreferrer">Search CMS Open Payments</a></p>;
}

export function DecisionCards({ cards, evidence, recordNote, isOpen, onToggle }: { cards: DecisionCard[]; isOpen: (id: string) => boolean; onToggle: (id: string) => void; evidence?: ReactNode; recordNote?: string }) {
  const sections = evidenceItems(evidence);
  return <section className="decision-grid story-chapters" aria-label="Decision cards">{cards.map((c, index) => {
    const open = isOpen(c.evidence);
    const matching = cards.findIndex(card => card.evidence === c.evidence) === index ? sections.filter((node): node is EvidenceNode => isValidElement<{id?:string}>(node) && (node.props.id === c.evidence || (c.evidence === 'alternatives' && node.props.id === 'category'))) : [];
    const asks = (c.asks?.length ? c.asks : [c.ask]).filter(Boolean);
    return <article id={`chapter-${c.key}`} data-evidence={c.evidence} className={`op-record-card ${cardHue(c, index)}`} key={c.key}>{open ? <div id={`card-body-${c.key}`} className="op-ev" aria-labelledby={`card-trigger-${c.key}`}>
      <div className="op-ev-head"><button id={`card-trigger-${c.key}`} type="button" className="op-ev-toggle" aria-expanded="true" aria-controls={`card-body-${c.key}`} onClick={() => onToggle(c.evidence)}><span className="op-h3">{c.question}</span></button><AnswerBadge>{c.badge}</AnswerBadge></div>
      <div className="op-ev-main"><p className="decision-finding">{c.finding}</p>{recordNote && c.key === 'novelty' && <p className="section-caption fda-record-note">{recordNote}</p>}
        {!!c.figs?.length && <div className="op-stats sm">{c.figs.map((fig, i) => <div className="op-stat" key={i}><b className={/^[^\d$]*[a-zA-Z].*\s/.test(String(fig.value)) ? 'stat-text' : undefined}>{fig.value}</b><span>{fig.label}</span></div>)}</div>}
        {c.evidence === 'payments' && <PaymentPrivacyNote />}
        <div className="op-why"><b>Why it matters</b><p>{c.why}</p></div>
      </div>
      <div className="op-ask"><b>Ask the vendor</b>{asks.map((ask, i) => <div className="op-ask-line" key={i}><p>{ask}</p><CopyAsk text={ask} /></div>)}</div>
      {matching.map(node => <CardEvidence key={node.props.id} node={node} />)}
    </div> : <button id={`card-trigger-${c.key}`} type="button" className="op-collapsed" aria-expanded="false" aria-controls={`card-body-${c.key}`} onClick={() => onToggle(c.evidence)}><span className="op-collapsed-copy"><span className="op-h3">{c.question}</span><span className="op-collapsed-summary">{c.finding}</span></span><AnswerBadge>{c.badge}</AnswerBadge></button>}</article>;
  })}</section>;
}

function titled(title: ReactNode) {
  if (title === 'Predicates and lineage') return <><Term term="Predicate">Predicates</Term> and lineage</>;
  if (title === 'Adverse event reports (MAUDE)') return <>Adverse event reports (<Term term="MAUDE">MAUDE</Term>)</>;
  return title;
}
export function EvidenceSection({ id, title, summary, open, onToggle, children }: { id: string; title: ReactNode; summary: ReactNode; open: boolean; onToggle: () => void; children: ReactNode }) {
  const [present, setPresent] = useState(open);
  useEffect(() => {
    if (open || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setPresent(open); return; }
    const timer = setTimeout(() => setPresent(false), 220); return () => clearTimeout(timer);
  }, [open]);
  return <section id={`evidence-${id}`} className={`evidence-section ${open ? 'is-open' : ''}`}>
    <Button id={`evidence-trigger-${id}`} variant="ghost" className="evidence-toggle" aria-expanded={open} aria-controls={`evidence-body-${id}`} onClick={onToggle}>
      <ChevronDown className="evidence-chevron" aria-hidden="true" /><span className="evidence-title">{titled(title)}</span><span className="evidence-summary">{summary}</span>
    </Button>
    <div id={`evidence-body-${id}`} className="evidence-height" inert={!open} aria-hidden={!open} aria-labelledby={`evidence-trigger-${id}`}><div className="evidence-body">{present ? children : null}</div></div>
  </section>;
}

export function Notes({ notes }: { notes: string[] }) {
  return notes.length ? <ul className="decision-notes">{notes.map(n => <li key={n}>{n}</li>)}</ul> : null;
}

/** Print-only brief; screen CSS hides it and print CSS hides everything else. */
export function PrintBrief({ title, subtitle, description, kindLabel, details, scope, knumber, fullDeviceName, tableEvidence, bottomLine, newClearanceNote, recordNote, cards, table, questions, notes, meta, evidence, approvalEvidence, printEyebrow }: {
  evidence?: ReactNode; approvalEvidence?: ReactNode; title: string; subtitle: string; description?: string; kindLabel?: string; details?: string; scope?: string; knumber?: string; fullDeviceName?: string; printEyebrow?: string;
  tableEvidence: 'alternatives' | 'competition'; bottomLine: string; newClearanceNote?: string; recordNote?: string; cards: DecisionCard[];
  table: { caption: string; head: string[]; rows: (string | number)[][] }; questions: string[]; notes: string[]; meta: Meta;
}) {
  const [url, setUrl] = useState('');
  const [generated, setGenerated] = useState('');
  useEffect(() => {
    setUrl(`${benchmarkOrigin}${window.location.pathname}${window.location.search}`);
    const stamp = () => setGenerated(longDate(new Date().toISOString()));
    stamp();
    let previousTitle: string | null = null;
    const before = () => { if (previousTitle === null) previousTitle = document.title; document.title = briefFileName(title, knumber); stamp(); };
    const after = () => { if (previousTitle !== null) document.title = previousTitle; previousTitle = null; delete document.documentElement.dataset['briefMode']; };
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => { window.removeEventListener('beforeprint', before); window.removeEventListener('afterprint', after); after(); };
  }, [title, knumber]);
  const questionGroups = printQuestionGroups(cards, questions);
  const summary = summaryQuestionSet(cards, questions);
  const releaseDate = meta.exported_utc ? longDate(meta.exported_utc.slice(0, 10)) : 'NOT FOUND';
  return <><div className="print-brief decision-print" aria-hidden="true">
    <section className="print-summary">
      <div className="print-brand-bar"><div className="print-brand-lockup"><BrandMark /><span className="print-wordmark"><strong>Ortho</strong><span>Parity</span></span><span className="print-tagline">Orthopedic device and vendor benchmarks</span></div><p className="print-generated">Brief generated {generated} · FDA data as of {meta.exported_utc ?? 'NOT FOUND'}</p></div>
      <h1>{title}</h1><p className="print-sub">{subtitle}</p>
      {description && <p className="print-description">{description}</p>}
      {kindLabel && <p className="section-caption">{kindLabel}</p>}
      {details && <p className="print-details">{details}</p>}
      {scope && <p className="print-details">{scope}</p>}
      <div className="print-bottom"><strong>Bottom line</strong><p>{bottomLine}</p></div>
      {recordNote && <p className="section-caption fda-record-note">{recordNote}</p>}
      {newClearanceNote && <p className="section-caption new-clearance-note">{newClearanceNote}</p>}
      <div className="print-glance">{cards.map((c, index) => <div className={`print-glance-tile q${index % 6 + 1}`} key={c.key}><span>{c.question}</span><strong>{c.badge}</strong></div>)}</div>
    </section>
    <section className="print-chapters">{cards.map((c, index) => <Fragment key={c.key}>
      <article className={`print-card q${index % 6 + 1}`}>
        <div className="print-card-heading"><h2>{c.question}</h2><span className="print-badge">{c.badge}</span></div>
        <p className="print-finding">{c.finding}</p>
        {!!c.figs?.length && <div className="print-stats">{c.figs.map((fig, i) => <div className="print-stat" key={i}><strong className={/[a-zA-Z]/.test(String(fig.value)) && !normalizeDeviceNumber(String(fig.value)) && !/^\$[\d.,]+[KMB]?$/.test(String(fig.value)) ? 'stat-text' : undefined}>{fig.value}</strong><span>{fig.label}</span></div>)}</div>}
        <div className="print-context"><div className="print-why"><h3>Why it matters</h3><p>{c.why}</p></div><div className="print-ask"><h3>Ask the vendor</h3><ol>{(c.asks?.length ? c.asks : [c.ask]).map((ask, i) => <li key={i}>{ask}</li>)}</ol></div></div>
      </article>
      {c.evidence === tableEvidence && table.rows.length > 0 && <div className={`print-card-table q${index % 6 + 1}`}><h3>{table.caption}</h3><div className="print-table-frame"><table><thead><tr>{table.head.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{table.rows.slice(0, 10).map((r, i) => <tr key={i}>{r.map((value, j) => <td key={j}>{value}</td>)}</tr>)}</tbody></table></div></div>}
      {c.evidence === 'addon' && evidence && <div className={`print-card-evidence q${index % 6 + 1}`}>{evidence}</div>}
      {c.evidence === 'predicates' && approvalEvidence && <div className={`print-card-evidence q${index % 6 + 1}`}>{approvalEvidence}</div>}
    </Fragment>)}</section>
    <section className="print-worksheet"><h2>Questions for the vendor</h2><p className="print-worksheet-caption">{title} · {questions.length} questions generated by fixed rules from public FDA and CMS data.</p>
      {questionGroups.map(group => <div className={`print-question-group q${group.index % 6 + 1}`} key={group.index}><h3>{group.label}</h3><ol start={group.start}>{group.questions.map((q, i) => <li key={i}><div className="print-question-line"><span className="print-checkbox" /><span>{group.start + i}. {q}</span></div><div className="print-answer-lines"><span /><span /></div></li>)}</ol></div>)}
      {notes.length > 0 && <ul className="print-notes">{notes.map(n => <li key={n}>{n}</li>)}</ul>}
      <footer>{fullDeviceName && <p className="break-words"><strong>Full FDA device name:</strong> {fullDeviceName}</p>}<p>{url}</p><p>FDA data as of {meta.exported_utc ?? 'NOT FOUND'} · Parser {meta.parser_version ?? 'NOT FOUND'}</p><p>Generated by OrthoParity from public FDA and CMS data. Not regulatory or compliance advice.</p><p>Terms and privacy: orthoparity.com/terms · orthoparity.com/privacy</p></footer>
    </section>
  </div>
  {knumber && <div className="print-brief decision-print one-page-summary" aria-hidden="true">
    <div className="print-brand-bar"><div className="print-brand-lockup"><BrandMark /><span className="print-wordmark"><strong>Ortho</strong><span>Parity</span></span></div><p className="print-generated">Product brief · printed {generated} · Data current through {releaseDate}</p></div>
    <p className="op-eyebrow print-eyebrow">{printEyebrow ?? `Product · FDA · ${knumber}`}</p>
    <h1>{title}</h1><p className="print-sub">{subtitle}{details ? ` · ${details}` : ''}</p>
    <div className="print-bottom"><strong>The bottom line</strong><p>{bottomLine}</p></div>
    <h2>{cards.length} questions at a glance</h2>
    <div className="print-glance">{cards.map((c, index) => <div className={`print-glance-tile q${index % 6 + 1}`} key={c.key}><span>{c.question}</span><strong>{c.badge}</strong></div>)}</div>
    <h2>Questions for the vendor</h2><ol className="summary-questions">{summary.selected.map((question, index) => <li key={`${index}-${question}`}>{question}</li>)}</ol>
    <p className="summary-more">{summary.remaining} more questions on {url}</p>
    <h2>Committee notes</h2><div className="summary-committee">{Array.from({ length: 6 }, (_, index) => <span key={index} />)}</div>
    <h2>Limitations</h2><p className="summary-limitations">{knumber.toUpperCase().startsWith('K') ? "A clearance is FDA's finding of substantial equivalence, not a finding that the device is better than others." : 'FDA authorization is not a finding that the device is better than others.'} Adverse event counts are not rates. Payments are reported facts, not judgments. Medicare figures pay for the whole stay, not this product alone.</p>
    <footer><p>Sources: FDA records, GUDID, recalls, MAUDE, registrations and inspections; CMS Open Payments 2019 to 2025, MedPAR 2024, ASC CY 2027, TEAM.</p><p>Independent research tool, not affiliated with FDA or CMS. MIT License.</p></footer>
  </div>}
  </>;
}
