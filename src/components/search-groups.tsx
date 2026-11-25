import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getSearchGroups, searchDevices } from '@/lib/predicate-data';
import { filedAsText, groupSummary, gudidBrandText, type GroupItem, type SearchGroup } from '@/lib/research-groups';
import { displayName, shortDeviceName } from '@/lib/format';
import { longDate } from '@/lib/signals';
import { BriefLink, Status } from './reviewer-shared';

function Items({ items, records }: { items: GroupItem[]; records: number }) {
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, 5);
  return <>
    <ul className="op-group-items">{shown.map(item => <li key={item.number}><BriefLink k={item.number} /><span className="op-stack-tight"><b title={item.device_name ?? undefined}>{item.device_name ? displayName(shortDeviceName(item.device_name, 90)) : 'NOT FOUND'}</b><span className="op-caption">Filed as {item.filer ?? 'NOT FOUND'}</span></span><span className="op-caption nw">{longDate(item.decision_date)}</span></li>)}</ul>
    {!all && items.length > 5 && <div className="op-group-more"><button type="button" className="op-btn-2" onClick={() => setAll(true)}>Show all {records}, newest first</button></div>}
  </>;
}

function CodeLinks({ codes }: { codes: string[] }) {
  return <>{codes.map((c, i) => <span key={c}>{i > 0 && ', '}<Link to="/browse/$code" params={{ code: c }} className="op-mono">{c}</Link></span>)}</>;
}

function Group({ g }: { g: SearchGroup }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(g.kind === 'brand');
  const brands = gudidBrandText(g);
  const caption = [filedAsText(g.filed_as), brands].filter(Boolean).join('. ');
  const numbers = g.items.map(i => i.number);
  return <article className="op-group">
    <header><div className="op-stack-tight"><h2 className="op-h3">{g.label}</h2>
    <p className="op-small">{g.owner_name ?? 'NOT FOUND'} today · {g.records.toLocaleString('en-US')} FDA records, {longDate(g.first)} to {longDate(g.latest)} · product codes <CodeLinks codes={g.product_codes} /></p>
    {caption && <p className="op-caption">{caption}</p>}</div>
    <div className="op-row">
      {g.records >= 2 && g.records <= 50 && numbers.length >= 2 && <button type="button" className="op-btn-2" onClick={() => void navigate({ to: '/', search: { level: 'product', k: numbers[0], compare: numbers.slice(1).join(',') } })}>Compare all {g.records}</button>}
      {g.owner_id && <Link to="/" search={{ v: g.owner_id }} className="op-btn-2">Open the company</Link>}
      {!open && <button type="button" className="op-btn-2" onClick={() => setOpen(true)}>Show {g.records}</button>}
    </div></header>
    {open && <Items items={g.items} records={g.records} />}
  </article>;
}

function CloseSpelling({ q }: { q: string }) {
  const { data } = useQuery({ queryKey: ['close-spelling', q], queryFn: () => searchDevices(q), staleTime: Infinity, retry: false });
  if (!data?.length) return null;
  return <div className="op-group"><ul>{data.map(row => <li key={row.knumber}><BriefLink k={row.knumber} /><span className="op-stack-tight"><b>{row.device_name ? displayName(shortDeviceName(row.device_name, 90)) : 'NOT FOUND'}</b><span className="op-caption">Filed as {row.applicant ?? 'NOT FOUND'}{row.match === 'close spelling' ? ' · close spelling' : ''}</span></span><span className="op-caption nw">{longDate(row.decision_date)}</span></li>)}</ul></div>;
}

export function SearchGroupsSection({ q }: { q: string }) {
  const { data, error, isPending } = useQuery({ queryKey: ['search-groups', q.trim().toLowerCase()], queryFn: () => getSearchGroups(q), staleTime: Infinity, retry: false });
  const [insideOpen, setInsideOpen] = useState(false);
  const inside = data?.inside_word_group;
  return <section className="op-wrap op-section op-stack op-search-groups" aria-label="Search results">
    <Status error={error ? 'Search results could not be loaded.' : ''} busy={isPending} />
    {data && <p className="op-lead">{groupSummary(q.trim(), data)}</p>}
    {data?.note && <p className="op-note">{data.note}</p>}
    {data && !data.total && <CloseSpelling q={q.trim()} />}
    {data?.groups.map(g => <Group key={`${g.kind}|${g.owner_id}|${g.label}`} g={g} />)}
    {inside && <article className="op-group">
      <header><div className="op-stack-tight"><h2 className="op-h3">{inside.label}</h2>
      <p className="op-small">{inside.by_owner.map(o => `${o.owner_name} (${o.records})`).join(', ')}</p></div>
      {!insideOpen && <button type="button" className="op-btn-2" onClick={() => setInsideOpen(true)}>Show {inside.records}</button>}</header>
      {insideOpen && <Items items={inside.items} records={inside.records} />}
    </article>}
    {data?.notes.map(n => <p key={n} className="op-note">{n}</p>)}
  </section>;
}
