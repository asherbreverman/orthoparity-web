import { isValidElement, useCallback, useEffect, useState, type ReactNode } from 'react';
import { StoryReveal, evidenceItems } from './story-shared';
import { ChevronDown, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toneClass, evidenceIsOpen, type DecisionCard, type View } from '@/lib/signals';
import type { Meta } from '@/lib/predicate-chain';
import { toast } from 'sonner';

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

export function cardHue(card: DecisionCard, index: number) { return `question-hue-${card.key === 'recalls' ? 7 : index + 1}`; }
export function GlanceTiles({ cards }: { cards: DecisionCard[] }) {
  return <section className="result-glance" aria-label="Questions at a glance"><p className="glance-caption">{cards.length} questions, each with its evidence and a question for the vendor. Select one to go to it.</p><div className={`glance-tiles glance-count-${cards.length}`}>{cards.map((c, i) => <Button asChild variant="ghost" key={c.key} className={`glance-tile ${cardHue(c, i)}`}><a href={`#chapter-${c.key}`}><span className="glance-label">{c.tone === 'attention' && <i className="warning-dot" />}{c.short ?? c.question}</span><strong>{c.badge}</strong></a></Button>)}</div></section>;
}
export function DecisionCards({ cards, evidence }: { cards: DecisionCard[]; onEvidence: (id: string, keyboard?: boolean) => void; evidence?: ReactNode }) {
  const sections=evidenceItems(evidence);
  return <section className="decision-grid story-chapters" aria-label="Decision cards">{cards.map((c,index) => <article id={`chapter-${c.key}`} className={`decision-card story-chapter ${cardHue(c,index)}`} key={c.key}><StoryReveal className="chapter-grid">
    <div className="chapter-sidebar"><h2 className="chapter-headline">{c.question}</h2><span className={`decision-badge ${toneClass(c.tone)}`}>{c.badge}</span></div>
    <div className="chapter-content"><p className="decision-finding">{c.finding}</p>
      {!!c.figs?.length && <div className="chapter-stats">{c.figs.map((fig,i) => <div className="chapter-stat" key={i}><strong>{fig.value}</strong><span>{fig.label}</span></div>)}</div>}
      <div className="chapter-context"><div className="decision-why"><h3>Why it matters</h3><p>{c.why}</p></div><div className="decision-ask"><h3>Ask the vendor</h3><p>{c.ask}</p><CopyAsk text={c.ask} /></div></div>
    </div></StoryReveal>
    {cards.findIndex(card=>card.evidence===c.evidence)===index && sections.filter(node=>isValidElement<{id?:string}>(node)&&(node.props.id===c.evidence || (c.evidence==='recalls' && (node.props.id==='maude' || node.props.id==='supplier')) || (c.evidence==='alternatives' && node.props.id==='category')))}
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
export function PrintBrief({ title, subtitle, bottomLine, cards, table, questions, notes, meta }: { title: string; subtitle: string; bottomLine: string; cards: DecisionCard[]; table: { caption: string; head: string[]; rows: (string | number)[][] }; questions: string[]; notes: string[]; meta: Meta }) {
  const url = typeof window === 'undefined' ? '' : window.location.href;
  return <div className="print-brief" aria-hidden="true">
    <div className="print-brand"><strong>Ortho</strong>Parity</div>
    <h1>{title}</h1><p className="print-sub">{subtitle}</p>
    <div className="print-bottom"><strong>Bottom line</strong><p>{bottomLine}</p></div>
    {cards.map(c => <div className="print-card" key={c.key}><h3>{c.question} · {c.badge}</h3><p>{c.finding}</p><p><em>Why it matters:</em> {c.why}</p><p><em>Ask:</em> {c.ask}</p></div>)}
    {table.rows.length > 0 && <><h2>{table.caption}</h2><table><thead><tr>{table.head.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{table.rows.slice(0, 10).map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table></>}
    <h2>Questions for the vendor</h2><ol>{questions.map((q, i) => <li key={i}>{q}</li>)}</ol>
    {notes.length > 0 && <ul className="print-notes">{notes.map(n => <li key={n}>{n}</li>)}</ul>}
    <footer><p>{url}</p><p>FDA data as of {meta.exported_utc ?? 'NOT FOUND'} · Parser {meta.parser_version ?? 'NOT FOUND'}</p><p>Generated by OrthoParity from public FDA and CMS data. Not regulatory or compliance advice.</p></footer>
  </div>;
}
