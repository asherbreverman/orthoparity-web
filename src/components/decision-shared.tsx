import { useCallback, useState, type ReactNode } from 'react';
import { ChevronDown, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toneClass, evidenceIsOpen, type DecisionCard, type View } from '@/lib/signals';
import type { Meta } from '@/lib/predicate-chain';

export function useEvidence(view: View) {
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const isOpen = useCallback((id: string) => evidenceIsOpen(view, opened, id), [view, opened]);
  const toggle = useCallback((id: string) => setOpened(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; }), []);
  const reveal = useCallback((id: string) => {
    setOpened(prev => new Set(prev).add(id));
    requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById(`evidence-${id}`)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })));
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

export function DecisionCards({ cards, onEvidence }: { cards: DecisionCard[]; onEvidence: (id: string) => void }) {
  return <section className="decision-grid" aria-label="Decision cards">{cards.map(c => <article className="decision-card" key={c.key}>
    <div className="decision-top"><span className="decision-question">{c.question}</span><span className={`decision-badge ${toneClass(c.tone)}`}>{c.badge}</span></div>
    <p className="decision-finding">{c.finding}</p>
    <p className="decision-why"><span>Why it matters</span>{c.why}</p>
    <div className="decision-ask"><p><span>Ask</span>{c.ask}</p><CopyAsk text={c.ask} /></div>
    {c.evidence && <Button variant="link" size="sm" className="see-evidence no-print" onClick={() => onEvidence(c.evidence)}>See evidence</Button>}
  </article>)}</section>;
}

export function EvidenceSection({ id, title, summary, open, onToggle, children }: { id: string; title: string; summary: ReactNode; open: boolean; onToggle: () => void; children: ReactNode }) {
  return <section id={`evidence-${id}`} className={`evidence-section ${open ? 'is-open' : ''}`}>
    <Button variant="ghost" className="evidence-toggle" aria-expanded={open} aria-controls={`evidence-body-${id}`} onClick={onToggle}>
      <ChevronDown className={open ? 'rotate-180' : ''} /><span className="evidence-title">{title}</span><span className="evidence-summary">{summary}</span>
    </Button>
    {open && <div id={`evidence-body-${id}`} className="evidence-body">{children}</div>}
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
