import { useEffect, useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Download } from 'lucide-react';
import { searchParts, type PartMatch, type PartSearch } from '@/lib/predicate-data';
import { displayName, shortDeviceName } from '@/lib/format';
import { compareHeading, runLimited } from '@/lib/product-comparison';
import { longDate } from '@/lib/signals';
import { downloadCsvText, type PrivatePrices } from '@/lib/private-prices';
import { duplicatePartCompanyNotes, parsePartList, partAttr, partCsv, partCsvName, partFdaLink, partLeadLine, partPriceKey, partProductName } from '@/lib/part-comparison';
import { BriefLink, Status, useRefetch } from './reviewer-shared';
import { CopyLink } from './op-controls';
import { PriceHeader, PriceInput, PriceNote, usePrivatePrices } from './price-controls';

export const gudidFootnote = 'GUDID is company-reported. Units, sterile and MRI safety show only when every device ID on the row agrees. A part with no FDA number in GUDID is shown as NOT FOUND; OrthoParity never guesses one.';

export function PartNote({ part, k }: { part: string; k: string }) {
  const kind = /^[PHN]/i.test(k) ? 'FDA approval' : '510(k)';
  return <p className="part-note no-print">Part number <strong className="font-mono">{part}</strong> is listed under this {kind} in FDA's GUDID.<Link to="/" search={{ part }} className="brief-link">See every product that lists {part}</Link></p>;
}

const nf = <span className="op-badge nf">NOT FOUND</span>;
const attr = (text: string) => text === 'NOT FOUND' ? nf : text;
export function PartFdaCell({ row }: { row: PartMatch }) {
  const link = partFdaLink(row);
  if (link.kind === 'site') return <BriefLink k={link.number} />;
  if (link.kind === 'fda') return <><span className="op-mono">{link.number}</span> <a href={link.url} target="_blank" rel="noopener noreferrer" className="brief-link">FDA record</a></>;
  return nf;
}
export function PartTable({ rows, prices, setPrice }: { rows: PartMatch[]; prices: PrivatePrices; setPrice: (key: string, value: string) => void }) {
  return <div className="op-table-wrap op-part-table" tabIndex={0}><table className="op-table"><thead><tr><th>Part number</th><th>Match</th><th>FDA number</th><th>Product</th><th>Company</th><th>Product code</th><th>Units</th><th>Sterile</th><th>MRI safety</th><th>In distribution</th><th><PriceHeader /></th></tr></thead><tbody>
    {rows.map((row, index) => {
      const key = partPriceKey(row);
      const product = partProductName(row);
      const label = `${row.part_number}, ${row.number ?? 'no FDA number'}`;
      return <tr key={`${key}|${index}`}><td className="op-mono">{row.part_number}</td><td>{row.match}</td><td><PartFdaCell row={row} />{row.fda_number_note && <p className="op-caption">{row.fda_number_note}</p>}</td><td title={product ?? undefined}>{product ? displayName(shortDeviceName(product, 80)) : nf}<br /><span className="op-caption">{row.brand ?? nf}</span></td><td title={row.on_site === false ? 'Company as GUDID names it' : undefined}>{row.company ?? 'NOT FOUND'}</td><td>{row.product_code ? <Link to="/browse/$code" params={{ code: row.product_code }} className="op-mono">{row.product_code}</Link> : nf}</td><td>{attr(partAttr(row.units_per_package, row.device_ids))}</td><td>{attr(partAttr(row.sterile, row.device_ids))}</td><td>{attr(partAttr(row.mri_safety, row.device_ids, false))}</td><td>{row.in_distribution === false ? 'No' : row.in_distribution ? 'Yes' : 'NOT FOUND'}</td><td><PriceInput id={`part-price-${index}-${row.number ?? 'none'}`} label={`Your price for ${label}`} value={prices[key] ?? ''} onChange={value => setPrice(key, value)} /></td></tr>;
    })}
  </tbody></table></div>;
}

function CompanyNotes({ rows }: { rows: PartMatch[] }) {
  return <>{duplicatePartCompanyNotes(rows).map(note => <p className="op-note" key={note}>{note}</p>)}</>;
}

function downloadParts(rows: PartMatch[], prices: PrivatePrices) {
  downloadCsvText(partCsv(rows, prices, longDate(new Date().toISOString())), partCsvName(new Date()));
}

export function PartResults({ part }: { part: string }) {
  const [data, setData] = useState<PartSearch | null>(null);
  const [error, setError] = useState('');
  const { prices, setPrice } = usePrivatePrices();
  const reload = useRefetch();
  useEffect(() => { let active = true; setData(null); setError(''); searchParts(part, 100).then(d => { if (active) setData(d); }).catch(e => { if (active) setError(e.message); }); return () => { active = false; }; }, [part, reload]);
  const rows = data?.results ?? [];
  return <div className="compare-page op-compare-page">
    <div className="op-band op-compare-head"><div className="op-wrap op-pagehead"><p className="op-eyebrow">Part number</p><h1 className="op-title">{part}</h1><p className="op-lead compare-lead">{data ? rows.length ? partLeadLine(rows.length, data.counts) : <>No match among GUDID items tied to an FDA number. GUDID also lists items with no FDA number, often instruments and accessories; OrthoParity doesn't load those yet. You can search the part number on <a href="https://accessgudid.nlm.nih.gov/" target="_blank" rel="noopener noreferrer">AccessGUDID (accessgudid.nlm.nih.gov)</a>.</> : 'Looking in FDA’s GUDID…'}</p><div className="op-row op-record-actions compare-actions no-print"><Link to="/" search={{ level: 'part', part, compare: '' }} className="op-btn-2">Compare with another part</Link>{rows.length > 0 && <button type="button" className="op-btn-2" onClick={() => downloadParts(rows, prices)}><Download size={16} />Download CSV</button>}<CopyLink /></div></div></div>
    <div className="op-wrap op-section op-compare-body">
      <Status error={error} busy={!data && !error} />
      {data?.note && <p className="op-note">{data.note}</p>}
      {rows.length > 0 && <><PartTable rows={rows} prices={prices} setPrice={setPrice} /><CompanyNotes rows={rows} /><PriceNote /></>}
      {data && <p className="op-note">{gudidFootnote}</p>}
    </div>
  </div>;
}

export function PartComparePage({ part, onChange }: { part: string; onChange: (parts: string[]) => void }) {
  const list = useMemo(() => parsePartList(part), [part]);
  const [loaded, setLoaded] = useState<Record<string, PartSearch | null>>({});
  const [paste, setPaste] = useState(list.join('\n')); const [formError, setFormError] = useState('');
  const { prices, setPrice } = usePrivatePrices();
  const reload = useRefetch();
  useEffect(() => { setPaste(list.join('\n')); }, [list]);
  useEffect(() => {
    let active = true;
    const missing = list.filter(item => !(item in loaded));
    void runLimited(missing, 6, item => searchParts(item, 100), (item, result) => { if (active) setLoaded(previous => ({ ...previous, [item]: result })); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, reload]);
  const done = list.filter(item => item in loaded).length;
  const rows = list.flatMap(item => loaded[item]?.results ?? []);
  const exactRows = rows.filter(row => row.match === 'exact');
  const companies = new Set(exactRows.map(row => row.company).filter(Boolean));
  const failed = list.some(item => loaded[item] === null);
  const startsWith = rows.length - exactRows.length;
  const title = compareHeading(list);
  return <div className="compare-page op-compare-page">
    <div className="op-band op-compare-head"><div className="op-wrap op-pagehead"><p className="op-eyebrow">Compare parts</p><h1 className="op-title">{title || 'Compare parts'}</h1><p className="op-lead compare-lead">{list.length} part {list.length === 1 ? 'number' : 'numbers'}, {exactRows.length} GUDID {exactRows.length === 1 ? 'device' : 'devices'} with an exact match, from {companies.size} {companies.size === 1 ? 'labeler' : 'labelers'}.</p><div className="op-row op-record-actions compare-actions no-print"><button type="button" className="op-btn" disabled={!rows.length || done < list.length} onClick={() => downloadParts(rows, prices)}><Download size={16} />Download CSV</button><CopyLink /></div></div></div>
    <div className="op-wrap op-section op-compare-body">
      <section className="op-card compact op-paste-panel no-print" aria-label="Compare part numbers"><label className="op-field"><span>Part numbers</span><small>One per line, up to 50. Paste straight from a price file or item master.</small><textarea className="op-paste op-paste-input" rows={4} value={paste} onChange={event => { setPaste(event.target.value); setFormError(''); }} /></label><div className="op-row"><button type="button" className="op-btn" onClick={() => { const next = parsePartList(paste); if (!next.length) { setFormError('Enter at least one part number.'); return; } onChange(next); }}>Compare</button><span className="op-caption">Spaces and dashes are ignored.</span></div>{formError && <p className="op-caption" role="alert">{formError}</p>}</section>
      <Status error={failed ? 'Some part numbers could not be loaded.' : ''} busy={done < list.length && !failed} />
      {done === list.length && rows.length > 0 && <><div className="op-tablebar op-part-tablebar"><b>{rows.length} {rows.length === 1 ? 'device' : 'devices'}</b>{startsWith > 0 && <span className="op-caption">Plus {startsWith} starts-with {startsWith === 1 ? 'match' : 'matches'}</span>}</div><PartTable rows={rows} prices={prices} setPrice={setPrice} /><CompanyNotes rows={rows} /><PriceNote /></>}
      {done === list.length && !rows.length && !failed && <p className="op-nf">No matching GUDID devices.</p>}
      {list.map(item => loaded[item]?.note ? <p className="op-note" key={item}>{loaded[item]?.note}</p> : null)}
      <p className="op-note">{gudidFootnote}</p>
    </div>
  </div>;
}
