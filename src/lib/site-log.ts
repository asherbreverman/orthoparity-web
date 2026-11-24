/** Corrections log and release notes: browser-safe types and pure helpers. */
export interface Correction { id: string; corrected_on: string; area: string | null; what_was_wrong: string | null; what_changed: string | null; pages_affected: string | null; source: string | null }
export interface ReleaseNote { id: string; released_on: string; title: string | null; summary: string | null; data_release: string | null; url: string | null }
export const newestFirst = <T>(rows: T[], key: keyof T) => [...rows].sort((a, b) => String(b[key]).localeCompare(String(a[key])));
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'}[c] ?? c));
export function rfc822(date: string) { return new Date(`${date.slice(0, 10)}T00:00:00Z`).toUTCString(); }
export function releaseRss(origin: string, rows: ReleaseNote[]): string {
  const items = newestFirst(rows, 'released_on').map(r => `<item><title>${esc(r.title ?? r.id)}</title><link>${esc(`${origin}/updates#${r.id}`)}</link><guid isPermaLink="true">${esc(`${origin}/updates#${r.id}`)}</guid><pubDate>${rfc822(r.released_on)}</pubDate><description>${esc(r.summary ?? '')}</description></item>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>OrthoParity release notes</title><link>${origin}/updates</link><atom:link href="${origin}/updates.xml" rel="self" type="application/rss+xml"/><description>Release notes for OrthoParity, orthopedic device and vendor benchmarks from public FDA and CMS data.</description><language>en-us</language>${items}</channel></rss>`;
}
export function siteDate(iso: string) { const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`); return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'}); }
