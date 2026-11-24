import { Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { getCorrections, getReleaseNotes } from '@/lib/predicate-data';
import { newestFirst, siteDate } from '@/lib/site-log';

export const correctionsOptions = () => ({queryKey: ['corrections'], queryFn: getCorrections, staleTime: Infinity, retry: false});
export const releaseNotesOptions = () => ({queryKey: ['release-notes'], queryFn: getReleaseNotes, staleTime: Infinity, retry: false});

export function CorrectionsPage() {
  const {data} = useSuspenseQuery(correctionsOptions());
  return <section className="result-header"><h1 className="result-title">Corrections</h1>
    <p className="section-lead">When something on OrthoParity was wrong or misleading, it's fixed and listed here with the date. Wording polish and new features are in the <Link className="brief-link" to="/updates">release notes</Link>.</p>
    <p className="mb-6"><a className="brief-link" href="https://github.com/asherbreverman/orthoparity-data/issues/new" target="_blank" rel="noopener noreferrer">Report an error</a></p>
    <div className="site-log">{newestFirst(data, 'corrected_on').map(c => <article key={c.id} id={c.id} className="site-log-card">
      <p className="section-caption">{siteDate(c.corrected_on)}{c.area && <> · {c.area}</>}</p>
      <dl><dt>What was wrong</dt><dd>{c.what_was_wrong ?? 'NOT FOUND'}</dd><dt>What changed</dt><dd>{c.what_changed ?? 'NOT FOUND'}</dd><dt>Pages affected</dt><dd>{c.pages_affected ?? 'NOT FOUND'}</dd></dl>
    </article>)}</div></section>;
}

export function UpdatesPage() {
  const {data} = useSuspenseQuery(releaseNotesOptions());
  return <section className="result-header"><h1 className="result-title">Release notes</h1>
    <p className="mb-6"><a className="brief-link" href="/updates.xml">RSS feed</a> · <Link className="brief-link" to="/corrections">Corrections</Link></p>
    <div className="site-log">{newestFirst(data, 'released_on').map(r => <article key={r.id} id={r.id} className="site-log-card">
      <p className="section-caption">{siteDate(r.released_on)}</p><h2>{r.title}</h2><p>{r.summary}</p>
      {r.data_release && (r.url && /^https:\/\//.test(r.url) ? <a className="brief-link" href={r.url} target="_blank" rel="noopener noreferrer">Data release {r.data_release}</a> : <p className="section-caption">Data release {r.data_release}</p>)}
    </article>)}</div></section>;
}

const notDo = "It doesn't rank products, recommend purchases, set prices or replace your committee's judgment. It shows public records the same way for everyone.";
export function AudiencePage({title, lead, items}: {title: string; lead: string; items: ReactNode[]}) {
  return <section className="result-header"><h1 className="result-title">{title}</h1><p className="section-lead">{lead}</p>
    <h2 className="mt-6">What OrthoParity can answer</h2><ul className="list-disc pl-5 space-y-3 mt-3">{items.map((it, i) => <li key={i}>{it}</li>)}</ul>
    <h2 className="mt-8">What OrthoParity doesn't do</h2><p>{notDo}</p></section>;
}
