import { Link, useRouterState } from '@tanstack/react-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Search, X, ArrowRight, LoaderCircle, Moon, Sun, GitBranch, ShieldCheck, CalendarDays, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMeta, searchDevices } from '@/lib/predicate-data';
import { dateLabel, type Meta, type SearchResult } from '@/lib/predicate-chain';

export function useRelease() {
  const [meta, setMeta] = useState<Meta>({});
  const [error, setError] = useState('');
  useEffect(() => { getMeta().then(setMeta).catch(e => setError(e.message)); }, []);
  return { meta, error };
}
export function ReviewerShell({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);
  const path = useRouterState({ select: s => s.location.pathname });
  const { meta, error } = useRelease();
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); }, [dark]);
  return <div className="app-shell reviewer-shell">
    <header className="topbar">
      <Link to="/" className="brandmark"><GitBranch className="text-primary" />Predicate Chain</Link>
      <nav aria-label="Main navigation" className="reviewer-nav">
        {([{ to: '/', label: 'Device Brief' }, { to: '/compare', label: 'Compare' }, { to: '/batch', label: 'Batch' }, { to: '/about', label: 'About' }] as const).map(item =>
          <Button key={item.to} asChild variant="ghost"><Link to={item.to} aria-current={path === item.to ? 'page' : undefined}>{item.label}</Link></Button>)}
      </nav>
      <Button size="icon" variant="ghost" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => setDark(!dark)}>{dark ? <Sun /> : <Moon />}</Button>
    </header>
    <div className="release-bar"><span><ShieldCheck size={13} />Public data · Independent research</span><span><CalendarDays size={13} />{meta.exported_utc ? `Data as of ${meta.exported_utc}. Parser ${meta.parser_version ?? '—'}.` : error ? 'Data release information unavailable.' : 'Loading data release information…'}</span></div>
    <main>{children}</main>
    <footer className="footer"><p>Independent research tool built from public FDA data, provided as is, not regulatory advice, and the author's personal work and views. Open source under the MIT License, Copyright (c) 2026 Asher Breverman.</p><span><ShieldCheck size={13} />Public · Read-only · No account needed</span></footer>
  </div>;
}
export function DeviceSearch({ label = 'Find a device', onSelect }: { label?: string; onSelect: (row: SearchResult) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setResults([]); setDone(false); setBusy(false); setError('');
    if (!query.trim()) return;
    const abort = new AbortController();
    const timer = setTimeout(() => {
      setBusy(true);
      searchDevices(query.trim(), abort.signal).then(rows => { if (!abort.signal.aborted) { setResults(rows); setDone(true); } })
        .catch(e => { if (!abort.signal.aborted) setError(e.message); })
        .finally(() => { if (!abort.signal.aborted) setBusy(false); });
    }, 300);
    return () => { clearTimeout(timer); abort.abort(); };
  }, [query]);
  function choose(row: SearchResult) { setOpen(false); setQuery(''); onSelect(row); }
  return <section className="search-area">
    <label className="search-label"><span>{label}</span><div className="search-box"><Search size={20} className="text-muted-foreground" />
      <input ref={ref} aria-label={label} placeholder="K110694, Concorde, Globus" value={query} autoComplete="off" onChange={e => { setQuery(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={e => { if (e.key === 'Escape') setOpen(false); if (e.key === 'Enter') { e.preventDefault(); if (results.length === 1 && results[0]) choose(results[0]); else setOpen(true); } }} />
      {query && <Button size="icon" variant="ghost" aria-label={`Clear ${label.toLowerCase()}`} onClick={() => { setQuery(''); ref.current?.focus(); }}><X /></Button>}
      <Button type="button" className="search-submit" aria-label={`Search ${label.toLowerCase()}`} onClick={() => { setOpen(true); ref.current?.focus(); }}>{busy ? <LoaderCircle className="animate-spin" /> : <><span>Search</span><ArrowRight /></>}</Button>
    </div></label>
    {open && query && (busy || done || error) && <div className="search-results" aria-live="polite">
      {error ? <p role="alert" className="p-5 text-sm">{error}</p> : busy ? <p className="p-5 text-sm text-muted-foreground">Searching clearances…</p> : results.length ? results.map(row => <Button variant="ghost" className="search-result" key={row.knumber} onClick={() => choose(row)}><span className="font-mono text-primary">{row.knumber}</span><span className="result-name"><span>{row.device_name ?? '—'}{row.match === 'close spelling' && <small className="ml-2">close spelling</small>}</span><small>{row.applicant ?? '—'}</small></span><time>{dateLabel(row.decision_date)}</time></Button>) : <p className="p-5 text-sm text-muted-foreground">No matching devices. Try fewer words or a K-number.</p>}
    </div>}
  </section>;
}
export function BriefLink({ k }: { k: string }) { return <Link to="/" search={{ k }} className="brief-link font-mono">{k}</Link>; }
export function PdfLink({ url }: { url?: string | null }) { return url && /^https:\/\//.test(url) ? <a href={url} target="_blank" rel="noopener noreferrer" className="brief-link">FDA summary (PDF)<ExternalLink size={12} /></a> : <span className="text-muted-foreground">PDF unavailable</span>; }
export function Status({ error, busy }: { error?: string; busy?: boolean }) { return error ? <div className="notice" role="alert">{error}</div> : busy ? <div className="notice" role="status"><LoaderCircle size={16} className="animate-spin" />Loading research…</div> : null; }
export function PageTitle({ name }: { name: string }) { return <div className="page-title"><div className="eyebrow">FDA 510(k) · Orthopedic devices</div><h1>{name}</h1></div>; }
export function pageHead(name: string, description: string) { const title = `${name} — Predicate Chain`; return { meta: [{ title }, { name: 'description', content: description }, { property: 'og:title', content: title }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }; }
