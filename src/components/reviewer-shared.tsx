import { Link } from '@tanstack/react-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Search, X, ArrowRight, LoaderCircle, Moon, Sun, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandMark } from './brand-mark';
import { limitations, methodology } from '@/lib/predicate-chain';
import { getMeta, searchDevices } from '@/lib/predicate-data';
import { dateLabel, type Meta, type SearchResult } from '@/lib/predicate-chain';
import { paymentLimitations } from '@/lib/vendor-data';
import { decisionLimitations } from '@/lib/signals';
import { recallLimitation } from '@/lib/recalls';

export function useRelease() {
  const [meta, setMeta] = useState<Meta>({});
  const [error, setError] = useState('');
  useEffect(() => { getMeta().then(setMeta).catch(e => setError(e.message)); }, []);
  return { meta, error };
}
export function ReviewerShell({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);
  const [about, setAbout] = useState(false);
  const { meta, error } = useRelease();
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); }, [dark]);
  return <div className="app-shell reviewer-shell">
    <header className="topbar no-print">
      <Button asChild variant="ghost" className="benchmark-home"><Link to="/" search={{}} onClick={() => { window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }} aria-label="OrthoParity — return home"><BrandMark /><span className="benchmark-wordmark"><strong>Ortho</strong><span>Parity</span></span></Link></Button>
      <Button size="icon" variant="ghost" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => setDark(!dark)}>{dark ? <Sun /> : <Moon />}</Button>
    </header>
    <main>{children}</main>
    <footer className="footer benchmark-footer no-print"><div><p>OrthoParity · Free and open source · Built from public FDA and CMS data · Not affiliated with FDA or CMS · Not regulatory or compliance advice · <Button variant="link" onClick={() => setAbout(!about)} aria-expanded={about} aria-controls="about-limitations">About and limitations</Button></p><p>Independent research tool built from public FDA and CMS data, provided as is, not regulatory or compliance advice, and the author's personal work and views. Open source under the MIT License, Copyright (c) 2026 Asher Breverman.</p></div></footer>
    {about && <section id="about-limitations" className="brief-section about-content" aria-label="About and limitations"><h2>About</h2><p className="section-caption">{meta.exported_utc ? `Data as of ${meta.exported_utc}. Parser ${meta.parser_version ?? '—'}.` : error ? 'Data release information unavailable.' : 'Loading data release information…'}</p><h3>Methodology</h3><ul>{methodology.map(text => <li key={text}>{text}</li>)}</ul><ul><li>Plain-English descriptions are drafted from FDA's product-code definitions and marked until an orthopedic industry reviewer confirms them.</li><li>FDA-cleared use is quoted from each 510(k) summary's Indications for Use, read by software; check the PDF for the exact text.</li><li>Pattern, peers and category counts compare applicant names as printed, with no parent-company roll-up.</li></ul><h3>Decision cards, alternatives and catalog</h3><ul>{decisionLimitations.map(text => <li key={text}>{text}</li>)}</ul><h3>Limitations</h3><Status error={error} busy={!meta.exported_utc && !error} /><ol>{limitations(meta).map((text,i) => <li key={i}>{text}</li>)}</ol><p className="section-caption">{recallLimitation}</p><h3>Industry payments and vendor groupings</h3><ul>{paymentLimitations.map(text => <li key={text}>{text}</li>)}</ul></section>}

  </div>;
}
export function DeviceSearch({ label = 'Identify an orthopedic device to benchmark', resetKey = '', onSelect }: { label?: string; resetKey?: string; onSelect: (row: SearchResult) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { setQuery(''); setOpen(false); if (!resetKey) ref.current?.focus(); }, [resetKey]);
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
    <div className="search-box"><Search size={20} className="text-muted-foreground" />
      <input ref={ref} aria-label={label} autoFocus placeholder="e.g. a 510(k) number, product name, or company" value={query} autoComplete="off" onChange={e => { setQuery(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={e => { if (e.key === 'Escape') setOpen(false); if (e.key === 'Enter') { e.preventDefault(); if (results.length === 1 && results[0]) choose(results[0]); else setOpen(true); } }} />
      {query && <Button size="icon" variant="ghost" aria-label={`Clear ${label.toLowerCase()}`} onClick={() => { setQuery(''); ref.current?.focus(); }}><X /></Button>}
      <Button type="button" className="search-submit" aria-label={`Search ${label.toLowerCase()}`} onClick={() => { setOpen(true); ref.current?.focus(); }}>{busy ? <LoaderCircle className="animate-spin" /> : <><span>Search</span><ArrowRight /></>}</Button>
    </div>
    {open && query && (busy || done || error) && <div className="search-results" aria-live="polite">
      {error ? <p role="alert" className="p-5 text-sm">{error}</p> : busy ? <p className="p-5 text-sm text-muted-foreground">Searching clearances…</p> : results.length ? results.map(row => <Button variant="ghost" className="search-result" key={row.knumber} onClick={() => choose(row)}><span className="font-mono text-primary">{row.knumber}</span><span className="result-name"><span>{row.device_name ?? '—'}{row.match === 'close spelling' && <small className="ml-2">close spelling</small>}</span><small>{row.applicant ?? '—'}</small></span><time>{dateLabel(row.decision_date)}</time></Button>) : <p className="p-5 text-sm text-muted-foreground">No matching devices. Try fewer words or a K-number.</p>}
    </div>}
  </section>;
}
export function BriefLink({ k }: { k: string }) { return <Link to="/" search={{ k }} className="brief-link font-mono">{k}</Link>; }
export function PdfLink({ url }: { url?: string | null }) { return url && /^https:\/\//.test(url) ? <a href={url} target="_blank" rel="noopener noreferrer" className="brief-link">FDA summary (PDF)<ExternalLink size={12} /></a> : <span className="text-muted-foreground">PDF unavailable</span>; }
export function Status({ error, busy }: { error?: string | undefined; busy?: boolean | undefined }) { return error ? <div className="notice" role="alert">{error}</div> : busy ? <div className="notice" role="status"><LoaderCircle size={16} className="animate-spin" />Loading research…</div> : null; }
export function PageTitle({ name }: { name: string }) { return <div className="page-title"><div className="eyebrow">FDA 510(k) · Orthopedic devices</div><h1>{name}</h1></div>; }
export function pageHead(name: string, description: string) { const title = `${name} — OrthoParity`; return { meta: [{ title }, { name: 'description', content: description }, { property: 'og:title', content: title }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }; }
