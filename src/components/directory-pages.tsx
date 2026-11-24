import { useMemo, useState } from 'react';
import { Link, getRouteApi } from '@tanstack/react-router';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { Download, Search } from 'lucide-react';
import { directoryIndexOptions, directoryOptions } from '@/lib/directory-queries';
import { deviceClassLabel, directoryCsv, directoryCsvName, directoryProcedureOptions, distributionText, filterCodes, filterCodesByProcedure, filterRows, ownerDiffers, pageOf, sortCodes, sortRows, type CodeSort, type DirectoryCode, type DirectoryCompany, type DirectoryFound, type DirectoryProcedure, type DirectoryRow, type SortState } from '@/lib/directory';
import { companyName, displayName } from '@/lib/format';
import { longDate } from '@/lib/signals';
import { getVendorCoverage } from '@/lib/predicate-data';
import { BriefLink, PathwayTag } from './reviewer-shared';
import { PageHead, ScopeLabel } from './op-controls';
import { Button } from './ui/button';

const n = (v: number | null | undefined) => typeof v === 'number' ? v.toLocaleString('en-US') : 'NOT FOUND';
const text = (v: string | null | undefined) => v && v.trim() ? v : 'NOT FOUND';
const date = (v: string | null | undefined) => v ? longDate(v) : 'NOT FOUND';
const LISTING_NOTE = 'A listing is an FDA record. It doesn’t show that a product is sold today, that parts fit together or that one product is better than another.';

function useSort<K extends string>(initial: SortState<K>) {
  const [sort, setSort] = useState(initial);
  const head = (col: K, label: string, numeric = false, className?: string) => <th scope="col" key={col} className={className} aria-sort={sort.col === col ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}><button type="button" className="sort-button" onClick={() => setSort(prev => ({ col, dir: prev.col === col ? (prev.dir === 1 ? -1 : 1) : numeric ? -1 : 1 }))}>{label}</button></th>;
  return { sort, head };
}
function ProcedureLinks({ list }: { list: DirectoryProcedure[] | null | undefined }) {
  if (!list?.length) return <span className="op-caption">None linked</span>;
  return <>{list.map((p, i) => <span key={p.family_id}>{i > 0 && ', '}<Link to="/procedures/$familyId" params={{ familyId: p.family_id }}>{p.name}</Link></span>)}</>;
}
export function CodeChip({ code }: { code: string }) {
  return <Link to="/browse/$code" params={{ code }} className="op-mono directory-code" title={`Every FDA record in product code ${code}`}>{code}</Link>;
}

function SegmentTable({ title, codes }: { title: string; codes: DirectoryCode[] }) {
  return <div className="op-table-wrap">
    <div className="op-tablebar"><b>{title}</b></div>
    <table className="op-table directory-table"><thead><tr><th scope="col">Code</th><th scope="col">Name</th><th scope="col">Class</th><th scope="col" className="num">Records</th><th scope="col" className="num">Companies</th><th scope="col">Latest</th><th scope="col">Procedures</th></tr></thead>
      <tbody>{codes.map(c => <tr key={c.product_code}><td><CodeChip code={c.product_code} /></td><td><b>{c.plain_name ?? c.fda_name ?? 'NOT FOUND'}</b>{c.fda_name && c.plain_name && <small>{c.fda_name}</small>}</td><td>{c.device_class ?? 'NOT FOUND'}</td><td className="num">{n(c.products)}</td><td className="num">{n(c.companies)}</td><td className="nw">{date(c.latest)}</td><td><ProcedureLinks list={c.procedures} /></td></tr>)}</tbody></table>
  </div>;
}

export function DirectoryIndexPage() {
  const { data } = useSuspenseQuery(directoryIndexOptions());
  const coverage = useQuery({ queryKey: ['vendor-coverage'], queryFn: getVendorCoverage, staleTime: Infinity, retry: false }).data;
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<CodeSort>('records');
  const [procedure, setProcedure] = useState('');
  const [segment, setSegment] = useState('');
  const procedures = useMemo(() => directoryProcedureOptions(data.segments), [data.segments]);
  const segments = data.segments
    .filter(s => !segment || s.segment === segment)
    .map(s => ({ ...s, shown: sortCodes(filterCodesByProcedure(filterCodes(s.codes, query), procedure), sort) }))
    .filter(s => s.shown.length);
  const filtered = !!query.trim() || !!procedure;
  return <>
    <PageHead eyebrow="Explore" title="Every orthopedic FDA record, by product code" lead={data.note} />
    <div className="op-wrap op-section op-stack directory-body">
      <div className="op-stats">
        <div className="op-stat"><b>{n(data.totals.products)}</b><span>orthopedic FDA records with a product code</span></div>
        <div className="op-stat"><b>{n(data.totals.product_codes)}</b><span>FDA product codes</span></div>
        <div className="op-stat"><b>{n(data.totals.companies)}</b><span>companies, counted by parent company</span></div>
      </div>
      <p className="op-caption">Counts here cover records with a product code, so they run slightly below the site-wide totals ({coverage ? coverage.devices.toLocaleString('en-US') : '…'} records, {coverage ? coverage.count.toLocaleString('en-US') : '…'} companies). FDA records, not sales. {n(data.totals.no_product_code)} more records have no product code on file and stay searchable by name. Data current through {date(data.totals.data_end)}.</p>
      <div className="op-row directory-controls">
        <label className="op-input directory-filter"><Search size={18} aria-hidden="true" /><span className="op-sr">Filter categories</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Filter categories by name or code" aria-label="Filter categories by code, plain name or FDA name" /></label>
        <label className="op-input op-select"><span className="op-sr">Sort</span><select value={sort} onChange={e => setSort(e.target.value as CodeSort)} aria-label="Sort categories"><option value="records">Sort: most records</option><option value="latest">Sort: latest record</option></select></label>
        <label className="op-input op-select"><span className="op-sr">Procedure</span><select value={procedure} onChange={e => setProcedure(e.target.value)} aria-label="Filter by procedure"><option value="">Procedure: any</option>{procedures.map(p => <option key={p.family_id} value={p.family_id}>{p.name}</option>)}</select></label>
      </div>
      <div className="op-row directory-chips" role="group" aria-label="Segments">
        {data.segments.map(s => <button key={s.segment} type="button" className="op-chip directory-segment" aria-pressed={segment === s.segment} onClick={() => setSegment(segment === s.segment ? '' : s.segment)}>{s.segment} <span className="op-caption">{n(s.product_codes)}</span></button>)}
        {segment && <button type="button" className="op-copy" onClick={() => setSegment('')}>Show all segments</button>}
      </div>
      {segments.map(s => <SegmentTable key={s.segment} codes={s.shown} title={filtered ? `${s.segment} · ${n(s.shown.length)} of ${n(s.product_codes)} codes` : `${s.segment} · ${n(s.product_codes)} codes · ${n(s.products)} records`} />)}
      {!segments.length && <div className="op-nf"><span className="op-mono">0 MATCHES</span>No categories match{query.trim() ? ` “${query.trim()}”` : ''}{procedure ? ` for ${procedures.find(p => p.family_id === procedure)?.name ?? 'that procedure'}` : ''}.</div>}
      <div className="op-note">{LISTING_NOTE}</div>
      <p className="op-caption">{data.source}</p>
    </div>
  </>;
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
  const pager = shown.pages > 1 && <nav className="op-row directory-pager" aria-label="Record pages"><Button variant="secondary" size="sm" disabled={shown.current === 1} onClick={() => setPage(shown.current - 1)}>Previous</Button><span className="op-caption">Page {shown.current} of {shown.pages} · {n(filtered.length)} records</span><Button variant="secondary" size="sm" disabled={shown.current === shown.pages} onClick={() => setPage(shown.current + 1)}>Next</Button></nav>;
  return <>
    <PageHead eyebrow="Explore · category" title={plain} lead={pc.plain_description} crumb={<Link to="/browse" className="op-crumb">All categories</Link>}>
      <p className="op-meta directory-meta"><span>FDA product code <span className="op-mono">{code}</span></span><span>{text(pc.fda_name)}</span><span>{deviceClassLabel(pc.device_class)}</span><span>Regulation {text(pc.regulation_number)}</span>{!!d.procedures?.length && <span>Procedures: <ProcedureLinks list={d.procedures} /></span>}</p>
    </PageHead>
    <div className="op-wrap op-section op-stack directory-body">
      <div className="op-stats">
        <div className="op-stat"><b>{n(d.totals.products)}</b><span>FDA records</span></div>
        <div className="op-stat"><b>{n(d.totals.companies)}</b><span>companies by parent</span><ScopeLabel>FDA records, not sales</ScopeLabel></div>
        <div className="op-stat"><b>{n(d.totals.companies_last5)}</b><span>with a record in the last five years</span></div>
        <div className="op-stat"><b>{n(d.totals.listed_in_distribution)}</b><span>listed in distribution in GUDID</span></div>
      </div>
      <p className="op-caption">{date(d.totals.first)} to {date(d.totals.latest)}. Data current through {date(d.totals.data_end)}.</p>
      <div className="op-table-wrap">
        <div className="op-tablebar"><b>Companies, {n(d.companies.length)}</b></div>
        <table className="op-table directory-table"><thead><tr>{companies.head('company', 'Company')}{companies.head('records', 'Records', true, 'num')}{companies.head('last5', 'Last five years', true, 'num')}{companies.head('listed', 'Listed in distribution', true, 'num')}{companies.head('first', 'First', true)}{companies.head('latest', 'Latest', true)}</tr></thead>
          <tbody>{sortRows(d.companies, companies.sort, companyValue).map(c => <tr key={c.owner_id}><td><Link to="/" search={{ v: c.owner_id }}><b>{companyName(c.owner_name)}</b></Link></td><td className="num">{n(c.products)}</td><td className="num">{n(c.last5)}</td><td className="num">{n(c.listed_in_distribution)}</td><td className="nw">{date(c.first)}</td><td className="nw">{date(c.latest)}</td></tr>)}</tbody></table>
      </div>
      <div className="op-table-wrap">
        <div className="op-tablebar directory-records-bar">
          <div className="op-row"><b>Every record</b><label className="op-input directory-filter"><Search size={16} aria-hidden="true" /><span className="op-sr">Filter records</span><input type="search" value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} placeholder="Filter records" aria-label="Filter records by number, product, company or brand" /></label></div>
          <div className="op-row"><button type="button" className="op-btn-2" onClick={download}><Download size={16} aria-hidden="true" />Download CSV</button>{pager}</div>
        </div>
        <table className="op-table directory-table"><thead><tr>{records.head('number', 'FDA number')}{records.head('product', 'Product')}{records.head('filer', 'Filer')}{records.head('owner', 'Company today')}{records.head('date', 'Decision', true)}{records.head('brand', 'GUDID brand')}{records.head('dist', 'In distribution', true)}</tr></thead>
          <tbody>{shown.rows.map(r => { const differs = ownerDiffers(r); const owner = r.owner_id ? <Link to="/" search={{ v: r.owner_id }}>{companyName(r.owner_name ?? r.owner_id)}</Link> : null; return <tr key={r.number}><td className="nw"><BriefLink k={r.number} /> <PathwayTag number={r.number} /></td><td title={r.device_name ?? undefined}><b>{displayName(r.product ?? r.device_name ?? 'NOT FOUND')}</b></td><td>{differs || !owner ? r.filer ?? 'NOT FOUND' : owner}</td><td>{differs ? owner : null}</td><td className="nw">{date(r.decision_date)}</td><td>{r.gudid_devices ? r.gudid_brand ?? 'NOT FOUND' : <span className="op-badge nf">No GUDID match</span>}</td><td className="nw">{distributionText(r)}</td></tr>; })}</tbody></table>
      </div>
      {!filtered.length && <div className="op-nf"><span className="op-mono">0 MATCHES</span>No records match “{query}”.</div>}
      {pager}
      <div className="op-note"><b>Notes</b><ul className="directory-notes">{(d.notes ?? []).map(t => <li key={t}>{t}</li>)}</ul><p className="op-caption">{d.source}</p></div>
    </div>
  </>;
}

export function DirectoryNotFound({ data }: { data?: unknown }) {
  return <PageHead eyebrow="Explore · category" title="Category not found" lead={typeof data === 'string' && data ? data : "The page you're looking for doesn't exist or has been moved."}><div className="op-row directory-nf-actions"><Link className="op-btn" to="/browse">All categories</Link><Link className="op-btn-2" to="/">Go home</Link></div></PageHead>;
}
