import { Fragment, isValidElement, useCallback, useEffect, useState, type ReactNode } from 'react';
import { StoryReveal, evidenceItems } from './story-shared';
import { ChevronDown, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { evidenceIsOpen, questionHue, type DecisionCard, type View } from '@/lib/signals';
import type { Meta } from '@/lib/predicate-chain';
import { toast } from 'sonner';
import { BrandMark } from './brand-mark';
import { longDate } from '@/lib/signals';
import { briefFileName, printQuestionGroups } from '@/lib/brief-print';
import { benchmarkOrigin } from '@/lib/benchmark-brand';

export function useEvidence(view: View, controlled?: {opened: Set<string>; onToggle: (id: string) => void}) {
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const isOpen = useCallback((id: string) => evidenceIsOpen(view, opened, id), [view, opened]);
  const toggle = useCallback((id: string) => setOpened(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; }), []);
  const reveal = useCallback((id: string, keyboard = false) => {
    setOpened(prev => new Set(prev).add(id));
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const section = document.getElementById(`evidence-${id}`);
      if (!section) return;
      section.scrollIntoView({ behavior: keyboard || window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      if (keyboard) {
        const target = section.querySelector<HTMLElement>('.evidence-toggle, h2') ?? section;
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
  return text ? <section className="bottom-line" aria-label="Bottom line"><div className="bottom-line-label">Bottom line</div><p>{text}</p></section> : null;
}

function CopyAsk({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return <Button variant="ghost" size="sm" className="copy-ask" aria-label="Copy question" onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); toast.success('Question copied'); setTimeout(() => setDone(false), 2000); } catch { toast.error('Copy was unavailable.'); } }}>{done ? <Check /> : <Copy />}Copy question</Button>;
}

export function cardHue(_card: DecisionCard, index: number) { return questionHue(index); }
export function GlanceTiles({ cards }: { cards: DecisionCard[] }) {
  return <section className="result-glance" aria-label="Questions at a glance"><p className="glance-caption">{cards.length} questions, each with its evidence and a question for the vendor. Select one to go to it.</p><div className={`glance-tiles glance-count-${cards.length}`}>{cards.map((c, i) => <Button asChild variant="ghost" key={c.key} className={`glance-tile ${cardHue(c, i)}`}><a href={`#chapter-${c.key}`}><span className="glance-label">{c.question}</span><strong>{c.badge}</strong></a></Button>)}</div></section>;
}
export function DecisionCards({ cards, evidence }: { cards: DecisionCard[]; onEvidence: (id: string, keyboard?: boolean) => void; evidence?: ReactNode }) {
  const sections=evidenceItems(evidence);
  return <section className="decision-grid story-chapters" aria-label="Decision cards">{cards.map((c,index) => <article id={`chapter-${c.key}`} className={`decision-card story-chapter ${cardHue(c,index)}`} key={c.key}><StoryReveal className="chapter-grid">
    <div className="chapter-sidebar"><h2 className="chapter-headline">{c.question}</h2><span className="decision-badge tone-info">{c.badge}</span></div>
    <div className="chapter-content"><p className="decision-finding">{c.finding}</p>
      {!!c.figs?.length && <div className="chapter-stats">{c.figs.map((fig,i) => <div className="chapter-stat" key={i}><strong className={/^[^\d$]*[a-zA-Z].*\s/.test(String(fig.value)) ? 'stat-text' : undefined}>{fig.value}</strong><span>{fig.label}</span></div>)}</div>}
      <div className="chapter-context"><div className="decision-why"><h3>Why it matters</h3><p>{c.why}</p></div><div className="decision-ask"><h3>Ask the vendor</h3>{(c.asks?.length ? c.asks : [c.ask]).length === 1 ? <><p>{(c.asks?.length ? c.asks : [c.ask])[0]}</p><CopyAsk text={(c.asks?.length ? c.asks : [c.ask])[0] ?? c.ask} /></> : <ul className="card-questions">{(c.asks?.length ? c.asks : [c.ask]).map((ask, i) => <li key={i}><p>{ask}</p><CopyAsk text={ask} /></li>)}</ul>}</div></div>
    </div></StoryReveal>
    {cards.findIndex(card=>card.evidence===c.evidence)===index && sections.filter(node=>isValidElement<{id?:string}>(node)&&(node.props.id===c.evidence || (c.evidence==='alternatives' && node.props.id==='category')))}
  </article>)}</section>;
}

export function EvidenceSection({ id, title, summary, open, onToggle, children }: { id: string; title: string; summary: ReactNode; open: boolean; onToggle: () => void; children: ReactNode }) {
  const [present,setPresent]=useState(open);
  useEffect(()=>{
    if(open || window.matchMedia('(prefers-reduced-motion: reduce)').matches){setPresent(open);return;}
    const timer=setTimeout(()=>setPresent(false),220);return()=>clearTimeout(timer);
  },[open]);
  return <section id={`evidence-${id}`} className={`evidence-section ${open ? 'is-open' : ''}`}>
    <Button id={`evidence-trigger-${id}`} variant="ghost" className="evidence-toggle" aria-expanded={open} aria-controls={`evidence-body-${id}`} onClick={onToggle}>
      <ChevronDown className="evidence-chevron" aria-hidden="true" /><span className="evidence-title">{title}</span><span className="evidence-summary">{summary}</span>
    </Button>
    <div id={`evidence-body-${id}`} className="evidence-height" inert={!open} aria-hidden={!open} aria-labelledby={`evidence-trigger-${id}`}><div className="evidence-body">{present ? children : null}</div></div>
  </section>;
}

export function Notes({ notes }: { notes: string[] }) {
  return notes.length ? <ul className="decision-notes">{notes.map(n => <li key={n}>{n}</li>)}</ul> : null;
}

/** Print-only brief; screen CSS hides it and print CSS hides everything else. */
export function PrintBrief({ title, subtitle, description, details, scope, knumber, tableEvidence, bottomLine, cards, table, questions, notes, meta, evidence }: {
  evidence?: ReactNode; title: string; subtitle: string; description?: string; details?: string; scope?: string; knumber?: string;
  tableEvidence: 'alternatives' | 'competition'; bottomLine: string; cards: DecisionCard[];
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
    const after = () => { if (previousTitle !== null) document.title = previousTitle; previousTitle = null; };
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => { window.removeEventListener('beforeprint', before); window.removeEventListener('afterprint', after); after(); };
  }, [title, knumber]);
  const questionGroups = printQuestionGroups(cards, questions);
  return <div className="print-brief decision-print" aria-hidden="true">
    <section className="print-summary">
      <div className="print-brand-bar"><div className="print-brand-lockup"><BrandMark /><span className="print-wordmark"><strong>Ortho</strong><span>Parity</span></span><span className="print-tagline">Orthopedic device and vendor benchmarks</span></div><p className="print-generated">Brief generated {generated} · FDA data as of {meta.exported_utc ?? 'NOT FOUND'}</p></div>
      <h1>{title}</h1><p className="print-sub">{subtitle}</p>
      {description && <p className="print-description">{description}</p>}
      {details && <p className="print-details">{details}</p>}
      {scope && <p className="print-details">{scope}</p>}
      <div className="print-bottom"><strong>Bottom line</strong><p>{bottomLine}</p></div>
      <div className="print-glance">{cards.map((c, index) => <div className={`print-glance-tile ${questionHue(index)}`} key={c.key}><span>{c.question}</span><strong>{c.badge}</strong></div>)}</div>
    </section>
    <section className="print-chapters">{cards.map((c, index) => <Fragment key={c.key}>
      <article className={`print-card ${questionHue(index)}`}>
        <div className="print-card-heading"><h2>{c.question}</h2><span className="print-badge">{c.badge}</span></div>
        <p className="print-finding">{c.finding}</p>
        {!!c.figs?.length && <div className="print-stats">{c.figs.map((fig, i) => <div className="print-stat" key={i}><strong className={/[a-zA-Z]/.test(String(fig.value)) && !/^K\d+$/.test(String(fig.value)) && !/^\$[\d.,]+[KMB]?$/.test(String(fig.value)) ? 'stat-text' : undefined}>{fig.value}</strong><span>{fig.label}</span></div>)}</div>}
        <div className="print-context"><div className="print-why"><h3>Why it matters</h3><p>{c.why}</p></div><div className="print-ask"><h3>Ask the vendor</h3><ol>{(c.asks?.length ? c.asks : [c.ask]).map((ask, i) => <li key={i}>{ask}</li>)}</ol></div></div>
      </article>
      {c.evidence === tableEvidence && table.rows.length > 0 && <div className={`print-card-table ${questionHue(index)}`}><h3>{table.caption}</h3><div className="print-table-frame"><table><thead><tr>{table.head.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{table.rows.slice(0, 10).map((r, i) => <tr key={i}>{r.map((value, j) => <td key={j}>{value}</td>)}</tr>)}</tbody></table></div></div>}
      {c.evidence === 'addon' && evidence && <div className={`print-card-evidence ${questionHue(index)}`}>{evidence}</div>}
    </Fragment>)}</section>
    <section className="print-worksheet"><h2>Questions for the vendor</h2><p className="print-worksheet-caption">{title} · {questions.length} questions generated by fixed rules from public FDA and CMS data.</p>
      {questionGroups.map(group => <div className={`print-question-group ${questionHue(group.index)}`} key={group.index}><h3>{group.label}</h3><ol start={group.start}>{group.questions.map((q, i) => <li key={i}><div className="print-question-line"><span className="print-checkbox" /><span>{group.start + i}. {q}</span></div><div className="print-answer-lines"><span /><span /></div></li>)}</ol></div>)}
      {notes.length > 0 && <ul className="print-notes">{notes.map(n => <li key={n}>{n}</li>)}</ul>}
      <footer><p>{url}</p><p>FDA data as of {meta.exported_utc ?? 'NOT FOUND'} · Parser {meta.parser_version ?? 'NOT FOUND'}</p><p>Generated by OrthoParity from public FDA and CMS data. Not regulatory or compliance advice.</p><p>Terms and privacy: orthoparity.com/terms · orthoparity.com/privacy</p></footer>
    </section>
  </div>;
}
