import { useMemo, useState, type ReactNode } from 'react';
import { Link, getRouteApi } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ArrowLeft, Download } from 'lucide-react';
import { directoryIndexOptions, directoryOptions } from '@/lib/directory-queries';
import { directoryCsv, directoryCsvName, distributionText, filterCodes, filterRows, ownerDiffers, pageOf, sortRows, type DirectoryCode, type DirectoryCompany, type DirectoryFound, type DirectoryProcedure, type DirectoryRow, type SortState } from '@/lib/directory';
import { companyName, displayName } from '@/lib/format';
import { longDate, questionHue } from '@/lib/signals';
import { BriefLink, PathwayTag } from './reviewer-shared';
import { Button } from './ui/button';
import { Input } from './ui/input';

const n = (v: number | null | undefined) => typeof v === 'number' ? v.toLocaleString('en-US') : 'NOT FOUND';
const date = (v: string | null | undefined) => v ? longDate(v) : 'NOT FOUND';

function useSort<K extends string>(initial: SortState<K>) {
  const [sort, setSort] = useState(initial);
  const head = (col: K, label: string, numeric = false) => <th scope="col" key={col} aria-sort={sort.col === col ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}><button type="button" className="sort-button" onClick={() => setSort(prev => ({ col, dir: prev.col === col ? (prev.dir === 1 ? -1 : 1) : numeric ? -1 : 1 }))}>{label}</button></th>;
  return { sort, head };
}
function Tiles({ items }: { items: [number | null | undefined, string][] }) {
  return <div className={`how-tiles directory-stats directory-stats-${items.length}`}>{items.map(([value, label], i) => <div key={label} className={`how-tile ${questionHue(i)}`}><strong>{n(value)}</strong><p>{label}</p></div>)}</div>;
}
function ProcedureLinks({ list }: { list: DirectoryProcedure[] | null | undefined }) {
  if (!list?.length) return <span className="text-muted-foreground">None linked</span>;
  return <>{list.map((p, i) => <span key={p.family_id}>{i > 0 && ', '}<Link className="brief-link" to="/procedures/$familyId" params={{ familyId: p.family_id }}>{p.name}</Link></span>)}</>;
}
export function CodeChip({ code }: { code: string }) {
  return <Link to="/browse/$code" params={{ code }} className="data-tag font-mono directory-chip" title={`Every FDA record in product code ${code}`}>{code}</Link>;
}

type CodeCol = 'code' | 'name' | 'class' | 'records' | 'companies' | 'latest' | 'procedures';
const codeValue = (c: DirectoryCode, col: CodeCol) => ({ code: c.product_code, name: c.plain_name ?? c.fda_name, class: c.device_class == null ? null : String(c.device_class), records: c.products, companies: c.companies, latest: c.latest, procedures: c.procedures?.map(p => p.name).join(', ') ?? null })[col];
function SegmentTable({ codes }: { codes: DirectoryCode[] }) {
  const { sort, head } = useSort<CodeCol>({ col: 'records', dir: -1 });
  const rows = sortRows(codes, sort, codeValue);
  return <div tabIndex={0} className="brief-table-scroll"><table className="brief-table directory-table"><thead><tr>{head('code', 'Code')}{head('name', 'Name')}{head('class', 'Class')}{head('records', 'Records', true)}{head('companies', 'Companies', true)}{head('latest', 'Latest', true)}{head('procedures', 'Procedures')}</tr></thead>
    <tbody>{rows.map(c => <tr key={c.product_code}><td><CodeChip code={c.product_code} /></td><td>{c.plain_name ?? c.fda_name ?? 'NOT FOUND'}{c.fda_name && c.plain_name && <small className="directory-sub">{c.fda_name}</small>}</td><td>{c.device_class ?? 'NOT FOUND'}</td><td>{n(c.products)}</td><td>{n(c.companies)}</td><td>{date(c.latest)}</td><td><ProcedureLinks list={c.procedures} /></td></tr>)}</tbody></table></div>;
}
function Page({ children }: { children: ReactNode }) { return <div className="compare-page directory-page">{children}</div>; }

export function DirectoryIndexPage() {
  const { data } = useSuspenseQuery(directoryIndexOptions());
  const [query, setQuery] = useState('');
  const segments = data.segments.map(s => ({ ...s, shown: filterCodes(s.codes, query) })).filter(s => s.shown.length);
  return <Page>
    <section className="result-header"><h1 className="result-title">Browse by category</h1><p className="section-lead">{data.note}</p>
      <Tiles items={[[data.totals.products, 'orthopedic FDA records with a product code'], [data.totals.product_codes, 'FDA product codes'], [data.totals.companies, 'companies, counted by parent company']]} />
      <p className="section-caption">{n(data.totals.no_product_code)} more records have no product code on file and stay searchable by name.</p>
      <label className="directory-filter"><span className="sr-only">Filter categories</span><Input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Filter by code or name" aria-label="Filter categories by code, plain name or FDA name" /></label>
    </section>
    {segments.map(s => <section key={s.segment} className="brief-section"><h2>{s.segment} · {n(s.product_codes)} codes · {n(s.products)} records</h2><SegmentTable codes={s.shown} /></section>)}
    {!segments.length && <section className="brief-section"><p className="section-caption">No categories match “{query}”.</p></section>}
    <p className="section-caption directory-source">{data.source}</p>
  </Page>;
}

const codeRoute = getRouteApi('/browse_/$code');
type CompanyCol = 'company' | 'records' | 'last5' | 'listed' | 'first' | 'latest';
const companyValue = (c: DirectoryCompany, col: CompanyCol) => ({ company: c.owner_name, records: c.products, last5: c.last5, listed: c.listed_in_distribution, first: c.first, latest: c.latest })[col];
type RowCol = 'number' | 'product' | 'filer' | 'owner' | 'date' | 'brand' | 'dist';
const rowValue = (r: DirectoryRow, col: RowCol) => ({ number: r.number, product: r.product ?? r.device_name, filer: r.filer, owner: r.owner_name, date: r.decision_date, brand: r.gudid_devices ? r.gudid_brand : null, dist: r.gudid_in_distribution })[col];

export function DirectoryCodePage() {
  const { code } = codeRoute.useParams();
  const { data } = useSuspenseQuery(directoryOptions(code));
  return data.found ? <CodeDetail d={data} /> : null;
}
function CodeDetail({ d }: { d: DirectoryFound }) {
  const pc = d.product_code, code = pc.product_code, plain = pc.plain_name ?? pc.fda_name ?? code;
  const companies = useSort<CompanyCol>({ col: 'records', dir: -1 });
  const records = useSort<RowCol>({ col: 'date', dir: -1 });
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => sortRows(filterRows(d.rows, query), records.sort, rowValue), [d.rows, query, records.sort]);
  const shown = pageOf(filtered, page);
  const download = () => { const blob = new Blob([directoryCsv(code, plain, d.rows, longDate(new Date().toISOString()))], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = directoryCsvName(code, new Date()); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
  const pager = shown.pages > 1 && <nav className="directory-pager" aria-label="Record pages"><Button variant="secondary" size="sm" disabled={shown.current === 1} onClick={() => setPage(shown.current - 1)}>Previous</Button><span>Page {shown.current} of {shown.pages} · {n(filtered.length)} records</span><Button variant="secondary" size="sm" disabled={shown.current === shown.pages} onClick={() => setPage(shown.current + 1)}>Next</Button></nav>;
  return <Page>
    <section className="result-header"><p className="eyebrow">Browse by category</p><Link to="/browse" className="brief-link mb-6 inline-flex items-center gap-1"><ArrowLeft className="size-4" />All categories</Link>
      <h1 className="result-title">{plain}</h1>
      <p className="result-meta">FDA product code {code} · {pc.fda_name ?? 'NOT FOUND'} · Class {pc.device_class ?? 'NOT FOUND'} · Regulation {pc.regulation_number ?? 'NOT FOUND'}</p>
      {pc.plain_description && <p className="plain-description">{pc.plain_description}</p>}
      <Tiles items={[[d.totals.products, 'FDA records'], [d.totals.companies, 'companies by parent'], [d.totals.companies_last5, 'with a record in the last five years'], [d.totals.listed_in_distribution, 'listed in distribution in GUDID']]} />
      <p className="section-caption">{date(d.totals.first)} to {date(d.totals.latest)}. Data through {date(d.totals.data_end)}.</p>
      {!!d.procedures?.length && <p className="section-caption">Procedures: <ProcedureLinks list={d.procedures} /></p>}
    </section>
    <section className="brief-section"><h2>Companies</h2><div tabIndex={0} className="brief-table-scroll"><table className="brief-table directory-table"><thead><tr>{companies.head('company', 'Company')}{companies.head('records', 'Records', true)}{companies.head('last5', 'Last five years', true)}{companies.head('listed', 'Listed in distribution', true)}{companies.head('first', 'First', true)}{companies.head('latest', 'Latest', true)}</tr></thead>
      <tbody>{sortRows(d.companies, companies.sort, companyValue).map(c => <tr key={c.owner_id}><td><Link className="brief-link" to="/" search={{ v: c.owner_id }}>{companyName(c.owner_name)}</Link></td><td>{n(c.products)}</td><td>{n(c.last5)}</td><td>{n(c.listed_in_distribution)}</td><td>{date(c.first)}</td><td>{date(c.latest)}</td></tr>)}</tbody></table></div></section>
    <section className="brief-section"><div className="directory-records-head"><h2>Every record</h2><Button variant="secondary" size="sm" onClick={download}><Download />Download CSV</Button></div>
      <label className="directory-filter"><span className="sr-only">Filter records</span><Input type="search" value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} placeholder="Filter by number, product, company or brand" aria-label="Filter records by number, product, company or brand" /></label>
      {pager}
      <div tabIndex={0} className="brief-table-scroll"><table className="brief-table directory-table"><thead><tr>{records.head('number', 'FDA number')}{records.head('product', 'Product')}{records.head('filer', 'Filed by')}{records.head('owner', 'Owner today')}{records.head('date', 'Decision date', true)}{records.head('brand', 'GUDID brand')}{records.head('dist', 'In distribution', true)}</tr></thead>
        <tbody>{shown.rows.map(r => { const differs = ownerDiffers(r); const owner = r.owner_id ? <Link className="brief-link" to="/" search={{ v: r.owner_id }}>{companyName(r.owner_name ?? r.owner_id)}</Link> : null; return <tr key={r.number}><td><BriefLink k={r.number} /> <PathwayTag number={r.number} /></td><td title={r.device_name ?? undefined}>{displayName(r.product ?? r.device_name ?? 'NOT FOUND')}</td><td>{differs || !owner ? r.filer ?? 'NOT FOUND' : owner}</td><td>{differs ? owner : null}</td><td>{date(r.decision_date)}</td><td>{r.gudid_devices ? r.gudid_brand ?? 'NOT FOUND' : <span className="text-muted-foreground">Not in GUDID</span>}</td><td>{distributionText(r)}</td></tr>; })}</tbody></table></div>
      {!filtered.length && <p className="section-caption">No records match “{query}”.</p>}
      {pager}
    </section>
    <section className="brief-section"><h2>Notes</h2><ul>{(d.notes ?? []).map(t => <li key={t} className="section-caption">{t}</li>)}</ul><p className="section-caption">{d.source}</p></section>
  </Page>;
}

export function DirectoryNotFound({ data }: { data?: unknown }) {
  return <div className="flex min-h-[60vh] items-center justify-center px-4"><div className="max-w-md text-center"><h1 className="text-7xl font-bold text-foreground">404</h1><h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2><p className="mt-2 text-sm text-muted-foreground">{typeof data === 'string' && data ? data : "The page you're looking for doesn't exist or has been moved."}</p><div className="mt-6 flex justify-center gap-3"><Button asChild><Link to="/browse">All categories</Link></Button><Button asChild variant="secondary"><Link to="/">Go home</Link></Button></div></div></div>;
}
