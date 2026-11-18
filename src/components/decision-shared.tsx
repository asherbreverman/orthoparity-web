import { isValidElement, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { StoryReveal, evidenceItems } from './story-shared';
import { ChevronDown, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toneClass, evidenceIsOpen, type DecisionCard, type View } from '@/lib/signals';
import type { Meta } from '@/lib/predicate-chain';

export function useEvidence(view: View) {
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
  return { isOpen, toggle, reveal, reset };
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
  return <Button variant="ghost" size="icon" className="copy-ask" aria-label="Copy question" title="Copy question" onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); } catch { /* clipboard unavailable */ } }}>{done ? <Check /> : <Copy />}</Button>;
}

export function DecisionCards({ cards, onEvidence, evidence }: { cards: DecisionCard[]; onEvidence: (id: string, keyboard?: boolean) => void; evidence?: ReactNode }) {
  const sections=evidenceItems(evidence);
  return <section className="decision-grid story-chapters" aria-label="Decision cards">{cards.map((c,index) => <article id={`chapter-${c.key}`} className="decision-card story-chapter" key={c.key}><StoryReveal>
    <div className="decision-top"><span className="decision-question">{c.question}</span><h2 className="chapter-headline">{c.badge.replace(/\.$/,'')}. {c.tone==='attention' && <span className={`decision-badge ${toneClass(c.tone)}`}>{c.badge}</span>}</h2></div>
    <p className="decision-finding">{c.finding}</p>
    <p className="decision-why"><span>Why it matters</span>{c.why}</p>
    <div className="decision-ask"><p><span>Ask</span>{c.ask}</p><CopyAsk text={c.ask} /></div>
    {c.evidence && <Button variant="link" size="sm" className="see-evidence no-print" onClick={event => onEvidence(c.evidence, event.detail === 0)}>See the evidence ›</Button>}
    </StoryReveal>
    {cards.findIndex(card=>card.evidence===c.evidence)===index && sections.find(node=>isValidElement<{id?:string}>(node)&&node.props.id===c.evidence)}
  </article>)}</section>;
}

export function EvidenceSection({ id, title, summary, open, onToggle, children }: { id: string; title: string; summary: ReactNode; open: boolean; onToggle: () => void; children: ReactNode }) {
  const [present,setPresent]=useState(open);
  const [height,setHeight]=useState<number | undefined>(open ? undefined : 0);
  const content=useRef<HTMLDivElement>(null);
  useEffect(()=>{const node=content.current;if(!node || !open)return;const observer=new ResizeObserver(()=>setHeight(current=>current===undefined?undefined:node.scrollHeight));observer.observe(node);return()=>observer.disconnect();},[open,present]);
  useEffect(()=>{
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){setPresent(open);setHeight(open?undefined:0);return;}
    if(open){setPresent(true);const frame=requestAnimationFrame(()=>setHeight(content.current?.scrollHeight ?? 0));const timer=setTimeout(()=>setHeight(undefined),400);return()=>{cancelAnimationFrame(frame);clearTimeout(timer);};}
    setHeight(content.current?.scrollHeight ?? 0);const frame=requestAnimationFrame(()=>setHeight(0));const timer=setTimeout(()=>setPresent(false),window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:400);return()=>{cancelAnimationFrame(frame);clearTimeout(timer);};
  },[open]);
  return <section id={`evidence-${id}`} className={`evidence-section ${open ? 'is-open' : ''}`}>
    <Button id={`evidence-trigger-${id}`} variant="ghost" className="evidence-toggle" aria-expanded={open} aria-controls={`evidence-body-${id}`} onClick={onToggle}>
      <ChevronDown className="evidence-chevron" aria-hidden="true" /><span className="evidence-title">{title}</span><span className="evidence-summary">{summary}</span>
    </Button>
    <div id={`evidence-body-${id}`} className="evidence-height" style={{height:height===undefined?'auto':height}} inert={!open} aria-hidden={!open} aria-labelledby={`evidence-trigger-${id}`}><div ref={content} className="evidence-body">{present ? children : null}</div></div>
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
    <footer><p>{url}</p><p>FDA data as of {meta.exported_utc ?? '—'} · Parser {meta.parser_version ?? '—'}</p><p>Generated by OrthoParity from public FDA and CMS data. Not regulatory or compliance advice.</p></footer>
  </div>;
}
