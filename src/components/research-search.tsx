import { Fragment, useEffect, useId, useRef, useState } from 'react';
import { ArrowRight, LoaderCircle, Search, X } from 'lucide-react';
import { Button } from './ui/button';

export interface SearchOption { id: string; name: string; detail: string; date?: string; extra?: string | undefined; label?: string | undefined; group?: string | undefined; tag?: string | undefined }
export interface SearchLoad { rows: SearchOption[]; note?: string | null | undefined }
export function ResearchSearch({ label, placeholder, initialValue = '', load, onSelect }: { label: string; placeholder: string; initialValue?: string; load: (q: string, signal: AbortSignal) => Promise<SearchOption[] | SearchLoad>; onSelect: (id: string) => void }) {
  const [query, setQuery] = useState(initialValue);
  const [edited, setEdited] = useState(false);
  const [rows, setRows] = useState<SearchOption[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [active, setActive] = useState(-1);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => { setQuery(initialValue); setEdited(false); setOpen(false); }, [initialValue]);
  useEffect(() => {
    if (!edited || !query.trim()) { setRows([]); setDone(false); setNote(''); return; }
    const abort = new AbortController();
    setRows([]); setDone(false); setActive(-1); setError(''); setBusy(true);
    const timer = setTimeout(() => { load(query.trim(), abort.signal).then(data => { if (!abort.signal.aborted) { const result = Array.isArray(data) ? { rows: data } : data; setRows(result.rows); setNote(result.note ?? ''); setDone(true); } }).catch(e => { if (!abort.signal.aborted) setError(e.message); }).finally(() => { if (!abort.signal.aborted) setBusy(false); }); }, 300);
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
  </div>{open && edited && query && (busy || done || error) && <div className="search-results" id={`${id}-list`} role="listbox" aria-label="Search suggestions">{error ? <p role="alert">{error}</p> : busy ? <p role="status">Searching…</p> : rows.length ? rows.map((row, i) => <Fragment key={row.id}>{row.group && row.group !== rows[i - 1]?.group && <p className="search-group" role="presentation">{row.group}</p>}<Button id={`${id}-${i}`} role="option" aria-label={row.label} aria-selected={active === i} variant="ghost" className={`research-option ${active === i ? 'is-active' : ''}`} onPointerMove={() => setActive(i)} onClick={() => choose(row)}><span className="result-name"><strong>{row.name}</strong><small>{row.detail}</small>{row.extra && <small>{row.extra}</small>}{row.tag && <span className="data-tag">{row.tag}</span>}</span>{row.date && <time>{row.date}</time>}</Button></Fragment>) : <p>No matching results.</p>}</div>}{edited && query && note && <p className="search-note" role="status">{note}</p>}</div>;
}