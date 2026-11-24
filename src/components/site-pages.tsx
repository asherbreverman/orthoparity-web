import { Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { PageHead } from './op-controls';
import { getCorrections, getReleaseNotes } from '@/lib/predicate-data';
import { newestFirst, siteDate } from '@/lib/site-log';

export const correctionsOptions = () => ({queryKey: ['corrections'], queryFn: getCorrections, staleTime: Infinity, retry: false});
export const releaseNotesOptions = () => ({queryKey: ['release-notes'], queryFn: getReleaseNotes, staleTime: Infinity, retry: false});

export function CorrectionsPage() {
  const {data} = useSuspenseQuery(correctionsOptions());
  const all = newestFirst(data, 'corrected_on');
  const areas = [...new Set(all.map(c => c.area).filter((a): a is string => !!a))];
  const [area, setArea] = useState('');
  const [more, setMore] = useState(false);
  const shown = area ? all.filter(c => c.area === area) : all;
  const visible = more ? shown : shown.slice(0, 10);
  return <>
    <PageHead eyebrow="Trust" title="Corrections" lead={<>Every correction to published data, newest first. {all.length} {all.length === 1 ? 'correction' : 'corrections'} since launch. Wording polish and new features are in the <Link to="/updates">release notes</Link>.</>}>
      <div className="op-row site-head-actions"><a className="op-btn-2" href="https://github.com/asherbreverman/orthoparity-data/issues/new" target="_blank" rel="noopener noreferrer">Report an error on GitHub</a></div>
    </PageHead>
    <div className="op-wrap op-section op-stack">
      <div className="op-row" role="group" aria-label="Filter by area">
        <button type="button" className="op-chip site-filter" aria-pressed={!area} onClick={() => setArea('')}>All {all.length}</button>
        {areas.map(a => <button key={a} type="button" className="op-chip site-filter" aria-pressed={area === a} onClick={() => setArea(a)}>{a}</button>)}
      </div>
      {visible.map(c => <article key={c.id} id={c.id} className="op-card site-log-card">
        <header className="site-log-head"><h2 className="op-h3">{c.area ?? 'Correction'}</h2><time className="op-mono nw" dateTime={c.corrected_on}>{siteDate(c.corrected_on)}</time></header>
        <div className="op-grid-2 site-log-cols"><div><b>What was wrong</b><p>{c.what_was_wrong ?? 'NOT FOUND'}</p></div><div><b>What changed</b><p>{c.what_changed ?? 'NOT FOUND'}</p></div></div>
        <p className="op-meta"><span>Pages affected: {c.pages_affected ?? 'NOT FOUND'}</span>{c.source && <span>Source: {c.source}</span>}</p>
      </article>)}
      {!shown.length && <div className="op-nf"><span className="op-mono">0 MATCHES</span>No corrections in this area.</div>}
      {!more && shown.length > 10 && <button type="button" className="op-copy" onClick={() => setMore(true)}>Show {shown.length - 10} older corrections</button>}
    </div>
  </>;
}

export function UpdatesPage() {
  const {data} = useSuspenseQuery(releaseNotesOptions());
  return <>
    <PageHead eyebrow="Trust" title="Release notes" lead="What changed on OrthoParity, newest first.">
      <div className="op-row site-head-actions"><a className="op-btn-2" href="/updates.xml">RSS feed</a><Link className="op-btn-2" to="/corrections">Corrections</Link></div>
    </PageHead>
    <div className="op-wrap op-section op-stack">{newestFirst(data, 'released_on').map(r => <article key={r.id} id={r.id} className="op-card site-log-card">
      <header className="site-log-head"><h2 className="op-h3">{r.title}</h2><time className="op-mono nw" dateTime={r.released_on}>{siteDate(r.released_on)}</time></header>
      <p>{r.summary}</p>
      {r.data_release && (r.url && /^https:\/\//.test(r.url) ? <a className="op-link" href={r.url} target="_blank" rel="noopener noreferrer">Data release {r.data_release} ›</a> : <p className="op-caption">Data release {r.data_release}</p>)}
    </article>)}</div>
  </>;
}

const notDo = "It doesn't rank products, recommend purchases, set prices or replace your committee's judgment. It shows public records the same way for everyone. Same tools whether you work at a health system, an ASC or a GPO.";
const audienceTabs = [
  {to: '/for/value-analysis', label: 'Value analysis'},
  {to: '/for/supply-chain', label: 'Supply chain and sourcing'},
  {to: '/for/materials-management', label: 'Materials management'},
] as const;
export interface AudienceCard { tag: string; title: string; text: ReactNode; link: ReactNode }
export function AudiencePage({title, lead, current, cards}: {title: string; lead: string; current: typeof audienceTabs[number]['to']; cards: AudienceCard[]}) {
  return <>
    <PageHead eyebrow="Who it's for" title={title} lead={lead}>
      <nav className="op-tabs audience-tabs" aria-label="Who it's for">{audienceTabs.map(t => <Link key={t.to} to={t.to} className="op-tab" aria-selected={t.to === current} aria-current={t.to === current ? 'page' : undefined}>{t.label}</Link>)}</nav>
    </PageHead>
    <div className="op-wrap op-section op-stack">
      <h2 className="op-h2">What OrthoParity can answer</h2>
      <div className="audience-cards">{cards.map(c => <article key={c.title} className="op-card audience-card"><span className="op-tag" aria-hidden="true">{c.tag}</span><h3>{c.title}</h3><p>{c.text}</p><span className="op-link">{c.link}</span></article>)}</div>
      <h2 className="op-h2 audience-not">What OrthoParity doesn't do</h2>
      <div className="op-note">{notDo}</div>
    </div>
  </>;
}
