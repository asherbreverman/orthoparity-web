import { useEffect, useId, useRef, useState } from 'react';
import { ArrowRight, LoaderCircle, Search, X } from 'lucide-react';
import { Button } from './ui/button';

export interface SearchOption { id: string; name: string; detail: string; date?: string; extra?: string | undefined }
export function ResearchSearch({ label, placeholder, initialValue = '', load, onSelect }: { label: string; placeholder: string; initialValue?: string; load: (q: string, signal: AbortSignal) => Promise<SearchOption[]>; onSelect: (id: string) => void }) {
  const [query, setQuery] = useState(initialValue);
  const [edited, setEdited] = useState(false);
  const [rows, setRows] = useState<SearchOption[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [active, setActive] = useState(-1);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => { setQuery(initialValue); setEdited(false); setOpen(false); }, [initialValue]);
  useEffect(() => {
    if (!edited || !query.trim()) { setRows([]); setDone(false); return; }
    const abort = new AbortController();
    setRows([]); setDone(false); setActive(-1); setError(''); setBusy(true);
    const timer = setTimeout(() => { load(query.trim(), abort.signal).then(data => { if (!abort.signal.aborted) { setRows(data); setDone(true); } }).catch(e => { if (!abort.signal.aborted) setError(e.message); }).finally(() => { if (!abort.signal.aborted) setBusy(false); }); }, 300);
    return () => { clearTimeout(timer); abort.abort(); };
  }, [query, edited, load]);
  useEffect(() => { const close = (e: PointerEvent) => { if (e.target instanceof Node && !area.current?.contains(e.target)) setOpen(false); }; document.addEventListener('pointerdown', close); return () => document.removeEventListener('pointerdown', close); }, []);
  useEffect(() => { if (active >= 0) document.getElementById(`${id}-${active}`)?.scrollIntoView({ block: 'nearest' }); }, [active, id]);
  function choose(row: SearchOption) { setQuery(row.name); setEdited(false); setOpen(false); onSelect(row.id); }
  function submit() { const row = rows[active] ?? (rows.length === 1 ? rows[0] : undefined); if (row) choose(row); else { setEdited(true); setOpen(true); input.current?.focus(); } }
  return <div ref={area} className="search-area"><div className="search-box"><Search size={18} aria-hidden="true" />
    <input ref={input} role="combobox" aria-label={label} aria-expanded={open && edited && !!query} aria-controls={`${id}-list`} aria-autocomplete="list" aria-activedescendant={active >= 0 ? `${id}-${active}` : undefined} placeholder={placeholder} value={query} autoComplete="off" onFocus={() => { if (edited) setOpen(true); }} onChange={e => { setQuery(e.target.value); setEdited(true); setOpen(true); }} onKeyDown={e => { if (e.key === 'Escape') setOpen(false); if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setOpen(true); setActive(a => rows.length ? (a + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length : -1); } if (e.key === 'Enter') { e.preventDefault(); submit(); } }} />
    {query && <Button variant="ghost" size="icon" className="search-clear" aria-label="Clear search" onClick={() => { setQuery(''); setEdited(true); setOpen(false); input.current?.focus(); }}><X /></Button>}
    <Button className="search-submit" aria-label={label.startsWith('Identify a vendor') ? 'Search vendors' : 'Search devices'} onClick={submit}>{busy && edited ? <LoaderCircle className="animate-spin" /> : <><span>Search</span><ArrowRight /></>}</Button>
  </div>{open && edited && query && (busy || done || error) && <div className="search-results" id={`${id}-list`} role="listbox" aria-label="Search suggestions">{error ? <p role="alert">{error}</p> : busy ? <p role="status">Searching…</p> : rows.length ? rows.map((row, i) => <Button id={`${id}-${i}`} role="option" aria-selected={active === i} variant="ghost" className={`research-option ${active === i ? 'is-active' : ''}`} key={row.id} onPointerMove={() => setActive(i)} onClick={() => choose(row)}><span className="result-name"><strong>{row.name}</strong><small>{row.detail}</small>{row.extra && <small>{row.extra}</small>}</span>{row.date && <time>{row.date}</time>}</Button>) : <p>No matching results.</p>}</div>}</div>;
}