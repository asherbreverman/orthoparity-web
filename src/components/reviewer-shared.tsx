import { LOAD_FAILED } from '@/lib/predicate-data';
import { shortDeviceName } from '@/lib/format';
import { pageTitle } from '@/lib/benchmark-brand';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useState, type ReactNode } from 'react';
import { LoaderCircle, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandMark } from './brand-mark';
import { limitations, methodology } from '@/lib/predicate-chain';
import { getMeta, searchDevices } from '@/lib/predicate-data';
import { dateLabel, type Meta, type SearchResult } from '@/lib/predicate-chain';
import { paymentLimitations } from '@/lib/vendor-data';
import { decisionLimitations } from '@/lib/signals';
import { recallLimitation } from '@/lib/recalls';
import { ResearchSearch } from './research-search';
import { ModeTabs } from './benchmark-navigation';
import { Toaster } from './ui/sonner';

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
  const search = useSearch({ strict: false }) as { k?: string; v?: string; mode?: string };
  const navigate = useNavigate();
  const selected = !!search.k || !!search.v;
  const [scrolled, setScrolled] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => { const preference = window.matchMedia('(prefers-color-scheme: dark)'); let saved: string | null = null; try { saved = localStorage.getItem('orthoparity-theme'); } catch {} setDark(saved ? saved === 'dark' : preference.matches); setReady(true); const update = () => { try { if (!localStorage.getItem('orthoparity-theme')) setDark(preference.matches); } catch { setDark(preference.matches); } }; preference.addEventListener('change', update); return () => preference.removeEventListener('change', update); }, []);
  useEffect(() => { if (ready) document.documentElement.classList.toggle('dark', dark); }, [dark, ready]);
  useEffect(() => { const update = () => setScrolled(window.scrollY > 8); update(); window.addEventListener('scroll', update, { passive: true }); return () => window.removeEventListener('scroll', update); }, []);
  function theme() { setDark(!dark); try { localStorage.setItem('orthoparity-theme', dark ? 'light' : 'dark'); } catch {} }
  return <div className="app-shell reviewer-shell">
    <header className={`topbar no-print ${selected || scrolled ? 'is-docked' : ''}`}><div className="topbar-inner">
      <Button asChild variant="ghost" className="benchmark-home"><Link to="/" search={{}} onClick={() => { window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }} aria-label="OrthoParity home"><BrandMark /><span className="benchmark-wordmark"><strong>Ortho</strong><span>Parity</span></span>{!selected && <span className="brand-tagline">Orthopedic device and vendor benchmarks</span>}</Link></Button>
      <div id="docked-search" className="docked-search" />
      <div className="header-tools">{selected && <ModeTabs compact vendor={!!search.v || search.mode === 'vendor'} onChange={vendor => void navigate({ to: '/', search: vendor ? {mode: 'vendor'} : {} })} />}<Button size="icon" variant="ghost" className="theme-toggle" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={theme}>{dark ? <Sun /> : <Moon />}</Button></div></div>
    </header>
    <main>{children}</main><Toaster position="bottom-center" />
    <footer className="footer benchmark-footer no-print"><div><p>OrthoParity · <a href="https://github.com/asherbreverman/orthoparity-data" target="_blank" rel="noopener noreferrer">Free and open source</a> · Built from public FDA and CMS data, including CMS Medicare Inpatient and Outpatient Hospitals by Provider and Service (2024) · Not affiliated with FDA or CMS · Not regulatory or compliance advice · <Button variant="link" onClick={() => setAbout(!about)} aria-expanded={about} aria-controls="about-limitations">About and limitations</Button></p><p>Independent research tool built from public FDA and CMS data, provided as is, not regulatory or compliance advice, and the author's personal work and views. Open source under the MIT License, Copyright (c) 2026 Asher Breverman.</p></div></footer>
    {about && <section id="about-limitations" className="brief-section about-content" aria-label="About and limitations"><h2>About</h2><p className="section-caption">{meta.exported_utc ? `Data as of ${meta.exported_utc}. Parser ${meta.parser_version ?? 'NOT FOUND'}.` : error ? 'Data release information unavailable.' : 'Loading data release information…'}</p><h3>Methodology</h3><p className="section-caption">Sources include FDA 510(k) summaries, FDA GUDID, FDA recalls, FDA MAUDE adverse event reports, FDA establishment registration and listing, FDA Data Dashboard inspections and compliance actions, CMS Open Payments, CMS Medicare Inpatient and Outpatient Hospitals by Provider and Service (2024), and CMS add-on payments (FY 2027 inpatient NTAP and CY 2027 outpatient pass-through).</p><ul>{methodology.map(text => <li key={text}>{text}</li>)}</ul><ul><li>Plain-English descriptions are drafted from FDA's product-code definitions and marked until an orthopedic industry reviewer confirms them.</li><li>FDA-cleared use is quoted from each 510(k) summary's Indications for Use, read by software; check the PDF for the exact text.</li><li>The Is it new? pattern rolls applicant names up to the company that owned them on the clearance date. Peers and category counts compare names as printed.</li></ul><h3>Decision cards, alternatives and catalog</h3><ul>{decisionLimitations.map(text => <li key={text}>{text}</li>)}</ul><h3>Limitations</h3><Status error={error} busy={!meta.exported_utc && !error} /><ol>{limitations(meta).map((text,i) => <li key={i}>{text}</li>)}</ol><p className="section-caption">{recallLimitation}</p><h3>Industry payments and vendor groupings</h3><ul>{paymentLimitations.map(text => <li key={text}>{text}</li>)}</ul></section>}

  </div>;
}
const devices = new Map<string, SearchResult>();
const loadDevices = async (q: string, signal: AbortSignal) => (await searchDevices(q, signal)).map(row => { devices.set(row.knumber, row); return { id: row.knumber, name: shortDeviceName(row.device_name ?? row.knumber), detail: `${row.knumber} · ${row.applicant ?? 'NOT FOUND'}`, date: dateLabel(row.decision_date), extra: row.match === 'close spelling' ? 'close spelling' : undefined }; });
export function DeviceSearch({ label = 'Identify an orthopedic device to benchmark', resetKey = '', initialValue, onSelect }: { label?: string; resetKey?: string; initialValue?: string; onSelect: (row: SearchResult) => void }) {
  const [name, setName] = useState(initialValue ?? resetKey);
  useEffect(() => { setName(initialValue ?? resetKey); const update = (event: Event) => { if (event instanceof CustomEvent && typeof event.detail === 'string') setName(event.detail); }; window.addEventListener('benchmark-name', update); return () => window.removeEventListener('benchmark-name', update); }, [initialValue, resetKey]);
  return <ResearchSearch label={label} placeholder="e.g. a 510(k) number, product name, or company" initialValue={name} load={loadDevices} onSelect={id => { const row = devices.get(id); if (row) onSelect(row); }} />;
}
export function BriefLink({ k }: { k: string }) { return <Link to="/" search={{ k }} className="brief-link font-mono">{k}</Link>; }
export function PdfLink({ url }: { url?: string | null }) { return url && /^https:\/\//.test(url) ? <a href={url} target="_blank" rel="noopener noreferrer" className="brief-link">FDA summary ›</a> : <span className="text-muted-foreground">PDF unavailable</span>; }
export function Status({ error, busy }: { error?: string | undefined; busy?: boolean | undefined }) {
  const [retrying, setRetrying] = useState(false);
  useEffect(() => { if (!busy) { setRetrying(false); return; } const on = () => setRetrying(true); window.addEventListener('pc-retrying', on); return () => window.removeEventListener('pc-retrying', on); }, [busy]);
  if (error === LOAD_FAILED) return <div className="notice" role="alert">{error}<Button size="sm" variant="secondary" onClick={() => window.dispatchEvent(new Event('pc-refetch'))}>Try again</Button></div>;
  return error ? <div className="notice" role="alert">{error}</div> : busy ? <div className="notice" role="status"><LoaderCircle size={16} className="animate-spin" />{retrying ? 'Still loading this brief…' : 'Loading research…'}</div> : null;
}
export function useRefetch() { const [n, setN] = useState(0); useEffect(() => { const on = () => setN(x => x + 1); window.addEventListener('pc-refetch', on); return () => window.removeEventListener('pc-refetch', on); }, []); return n; }
export function PageTitle({ name }: { name: string }) { return <div className="page-title"><div className="eyebrow">FDA 510(k) · Orthopedic devices</div><h1>{name}</h1></div>; }
export function pageHead(name: string, description: string) { const title = pageTitle(name); return { meta: [{ title }, { name: 'description', content: description }, { property: 'og:title', content: title }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }; }
