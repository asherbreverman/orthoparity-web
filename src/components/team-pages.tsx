import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Printer, Search } from 'lucide-react';
import { PageHead, ScopeLabel } from './op-controls';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { BrandMark } from './brand-mark';
import { Status } from './reviewer-shared';
import { EvidenceSection } from './decision-shared';
import { ProcedureSource } from './procedure-shared';
import { getProcedureList, getTeamCode, getTeamFamily, getTeamHospitals, getTeamNotes } from '@/lib/predicate-data';
import { isStateQuery, stateHospitals, lowerFirst, parseInput, teamDate, teamDollars, teamFamilies, teamLedger, type ClaimInputs, type TeamFamily, type TeamHospital, type TeamPrice } from '@/lib/team';
import { benchmarkOrigin } from '@/lib/benchmark-brand';
import { printBrief } from '@/lib/brief-print';

export const teamFamilyOptions = (fam: string) => ({queryKey: ['team-family', fam], queryFn: () => getTeamFamily(fam), staleTime: Infinity, retry: false});

function Toggle({open, onClick, controls, children}: {open: boolean; onClick: () => void; controls: string; children: ReactNode}) {
  return <Button variant="link" className="px-0 h-auto" aria-expanded={open} aria-controls={controls} onClick={onClick}><ChevronDown className={open ? 'rotate-180 shrink-0' : 'shrink-0'} />{children}</Button>;
}
function PriceRow({price, startOpen = false}: {price: TeamPrice; startOpen?: boolean}) {
  const [open, setOpen] = useState(startOpen);
  const id = `team-regions-${price.drg}`;
  return <><tr><td><span className="font-mono">{price.drg}</span>{price.title && <> {price.title}</>}</td><td>{teamDollars(price.min)}</td><td>{teamDollars(price.median)}</td><td>{teamDollars(price.max)}</td><td><Toggle open={open} onClick={() => setOpen(!open)} controls={id}>Regions</Toggle></td></tr>
    {open && <tr id={id}><td colSpan={5}><table className="brief-table"><thead><tr><th>Census division</th><th>Target price</th></tr></thead><tbody>{price.regions.map(r => <tr key={r.region}><td>{r.region_name}</td><td>{teamDollars(r.target_price)}</td></tr>)}</tbody></table></td></tr>}</>;
}
export function TeamPriceTable({prices, open = false}: {prices: TeamPrice[]; open?: boolean}) {
  return <div tabIndex={0} className="brief-table-scroll"><table className="brief-table"><thead><tr><th>MS-DRG</th><th>Lowest region</th><th>Median</th><th>Highest region</th><th>Regions</th></tr></thead><tbody>{prices.map(p => <PriceRow key={p.drg} price={p} startOpen={open} />)}</tbody></table></div>;
}
function range(prices: TeamPrice[] | undefined) {
  const lo = prices?.map(p => p.min).filter((x): x is number => typeof x === 'number') ?? [];
  const hi = prices?.map(p => p.max).filter((x): x is number => typeof x === 'number') ?? [];
  return lo.length && hi.length ? {min: Math.min(...lo), max: Math.max(...hi)} : null;
}

/** Figure tile for the procedure page; renders only for TEAM families. */
export function TeamFigure({team}: {team: TeamFamily | undefined}) {
  if (!team?.is_team) return null;
  return <div className="op-card op-stat procedure-pay"><small>TEAM episode · <Link to="/team">lookup</Link></small><b>{teamDollars(team.range_2027?.min)} to {teamDollars(team.range_2027?.max)}</b><span>TEAM 2027 preliminary target prices, all regions</span></div>;
}

export function TeamEvidence({team, open, onToggle}: {team: TeamFamily | undefined; open: boolean; onToggle: () => void}) {
  if (!team || !team.checked) return null;
  if (!team.is_team) return <section className="brief-section"><h2>Medicare TEAM episode</h2><p>{team.note}</p></section>;
  const r26 = range(team.prices_2026);
  return <EvidenceSection id="team" title="Medicare TEAM episode" summary="" open={open} onToggle={onToggle}>
    <p className="section-lead">Under Medicare's TEAM model, this procedure starts a {lowerFirst(team.category ?? '')} episode at the {typeof team.participants === 'number' ? team.participants.toLocaleString('en-US') : 'NOT FOUND'} hospitals in TEAM (list as of {teamDate(team.participants_as_of)}).</p>
    {team.note && <p>{team.note}</p>}
    <h3>Episode codes</h3>
    <div tabIndex={0} className="brief-table-scroll"><table className="brief-table"><thead><tr><th>Code</th><th>Type</th><th>Setting</th><th>Priced under MS-DRG</th></tr></thead><tbody>{(team.triggers ?? []).map(t => <tr key={`${t.code_type}-${t.code}`}><td className="font-mono">{t.code}{t.note && <p className="section-caption">{t.note}</p>}</td><td>{t.code_type}</td><td>{t.setting ?? 'NOT FOUND'}</td><td className="font-mono">{t.price_drg ?? 'NOT FOUND'}</td></tr>)}</tbody></table></div>
    <h3>CMS preliminary target prices, 2027</h3>
    <TeamPriceTable prices={team.prices_2027 ?? []} />
    {r26 && <p className="section-caption">2026 prices: {teamDollars(r26.min)} to {teamDollars(r26.max)} across the same MS-DRGs</p>}
    {!!team.notes?.length && <ul className="list-disc pl-5 space-y-3 mt-6">{team.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>}
    {!!team.sources?.length && <ul className="mt-6 space-y-1">{team.sources.map(s => <li key={s.url}><ProcedureSource url={s.url}>{s.name}</ProcedureSource></li>)}</ul>}
  </EvidenceSection>;
}

function useDebounced(value: string, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}
function useHospitalSearch(q: string) {
  const d = useDebounced(q.trim());
  const state = isStateQuery(d);
  return useQuery({queryKey: ['team-hospital', d.toLowerCase(), state], queryFn: () => getTeamHospitals(d, state ? 1000 : 50), enabled: d.length >= 2, staleTime: Infinity, retry: false});
}
function HospitalCard({h, pricesNote}: {h: TeamHospital; pricesNote: string | null}) {
  const groups = [...new Set(h.prices_2027.map(p => p.category))];
  return <section className="op-card op-stack team-selected" aria-label="Selected hospital">
    <div className="team-selected-head"><div><p className="op-eyebrow">Selected</p><h2 className="op-h3">{h.hospital}<ScopeLabel>As listed by CMS</ScopeLabel></h2>
      <p className="op-meta"><span>CCN <span className="op-mono">{h.ccn}</span></span><span>{h.cbsa_name ?? h.state ?? 'NOT FOUND'}</span><span>Census division {h.region ?? 'NOT FOUND'}{h.region_name ? `, ${h.region_name}` : ''}</span><span>In TEAM {teamDate(h.start_date)} to {teamDate(h.end_date)}</span></p></div>
      <span className="op-badge">{h.participation ?? 'In TEAM'}</span></div>
    {h.track && <div className="op-nf">{/^NOT FOUND:?\s*/.test(h.track) ? <><span className="op-mono">NOT FOUND</span>Participation track. {h.track.replace(/^NOT FOUND:?\s*/, '')}</> : h.track}</div>}
    {h.prices_2027.length > 0 && <div className="op-table-wrap"><table className="op-table"><thead><tr><th scope="col">MS-DRG</th><th scope="col">Episode category</th><th scope="col" className="num">2027 target price</th></tr></thead><tbody>{groups.flatMap(g => h.prices_2027.filter(p => p.category === g).map(p => <tr key={`${g}-${p.drg}`}><td className="op-mono">{p.drg}</td><td>{g}</td><td className="num">{teamDollars(p.target_price)}</td></tr>))}</tbody></table></div>}
    {pricesNote && <p className="op-caption">{pricesNote}</p>}
  </section>;
}
function HospitalBox() {
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<string | null>(null);
  const {data, isFetching, isError} = useHospitalSearch(q);
  const term = q.trim();
  const state = isStateQuery(term);
  const results = data ? (state ? stateHospitals(data.results, term) : data.results) : [];
  const selected = results.find(h => h.ccn === picked) ?? (results.length === 1 ? results[0] : undefined);
  const listed = data ? <>CMS participant list as of {teamDate(data.as_of)}, {data.total?.toLocaleString('en-US') ?? 'NOT FOUND'} hospitals. CMS updates it quarterly.</> : null;
  return <>
    <div className="op-stack">
      <label className="op-field"><span className="op-sr">Find a hospital</span><span className="op-input lg"><Search size={18} aria-hidden="true" /><input type="search" value={q} onChange={e => { setQ(e.target.value); setPicked(null); }} placeholder="Hospital name, city, state or CCN" aria-label="Find a hospital" /></span></label>
      <p className="op-caption">Search by hospital name, metro area, state or CCN. {data?.source_url ? <ProcedureSource url={data.source_url}>{listed}</ProcedureSource> : listed}</p>
    </div>
    {isFetching && <p className="op-caption">…</p>}
    {isError && <div className="op-nf" role="alert">Could not load the hospital list. Try again.</div>}
    {data && term.length >= 2 && !isFetching && <>
      {results.length === 0 && <div className="op-nf"><span className="op-mono">0 MATCHES</span>{data.note ?? `No TEAM hospital matches “${term}”.`}</div>}
      {results.length > 0 && <div className="op-table-wrap">
        <div className="op-tablebar"><b>{state ? `All ${results.length.toLocaleString('en-US')} TEAM ${results.length === 1 ? 'hospital' : 'hospitals'} in ${term.toUpperCase()}` : `${results.length.toLocaleString('en-US')} ${results.length === 1 ? 'match' : 'matches'}`}</b>{data.note && <span className="op-caption">{data.note}</span>}</div>
        <table className="op-table"><thead><tr><th scope="col">Hospital (as listed by CMS)</th><th scope="col">Area</th><th scope="col">CCN</th><th scope="col"><span className="op-sr">Prices</span></th></tr></thead>
          <tbody>{results.map(h => <tr key={h.ccn} aria-selected={selected?.ccn === h.ccn}><td><b>{h.hospital}</b></td><td className="nw">{h.cbsa_name ?? h.state ?? 'NOT FOUND'}</td><td className="op-mono">{h.ccn}</td><td className="nw"><button type="button" className="op-copy" aria-pressed={selected?.ccn === h.ccn} onClick={() => setPicked(h.ccn)}>2027 prices ›</button></td></tr>)}</tbody></table>
      </div>}
      {selected && <HospitalCard h={selected} pricesNote={data.prices_note} />}
    </>}
  </>;
}
function CodeBox() {
  const [q, setQ] = useState('');
  const d = useDebounced(q.trim());
  const {data, isFetching, isError} = useQuery({queryKey: ['team-code', d.toUpperCase()], queryFn: () => getTeamCode(d), enabled: d.length >= 3, staleTime: Infinity, retry: false});
  const price = data?.found ? data.prices_2027?.filter(p => p.drg === data.price_drg) ?? [] : [];
  return <section className="op-stack">
    <label className="op-field"><span className="op-sr">MS-DRG or HCPCS code</span><span className="op-input lg"><Search size={18} aria-hidden="true" /><input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="MS-DRG or HCPCS code, e.g. 470 or 27447" aria-label="MS-DRG or HCPCS code" /></span></label>
    {isFetching && <p className="section-caption mt-4">…</p>}
    {isError && <p className="notice mt-4" role="alert">Could not check that code. Try again.</p>}
    {data && d.length >= 3 && <div className="mt-6">{data.found ? <>
      <p className="section-lead"><span className="font-mono">{data.code}</span> ({data.code_type}, {data.setting}) starts a {lowerFirst(data.category ?? '')} episode.</p>
      <p>Priced under MS-DRG <span className="font-mono">{data.price_drg}</span></p>
      {!!data.families?.length && <p>Procedures: {data.families.map((f, i) => <Fragment key={f.family_id}>{i > 0 && ', '}<Link className="brief-link" to="/procedures/$familyId" params={{familyId: f.family_id}}>{f.name}</Link></Fragment>)}</p>}
      {price.length > 0 && <div className="mt-4"><TeamPriceTable prices={price} open /></div>}
      {data.note && <p className="section-caption">{data.note}</p>}
    </> : <p>{data.note}</p>}
    {data.source_url ? <p className="section-caption mt-4"><ProcedureSource url={data.source_url}>42 CFR 512.525(d)</ProcedureSource></p> : <p className="section-caption mt-4"><ProcedureSource url="https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-H/part-512/subpart-E/section-512.525">42 CFR 512.525(d)</ProcedureSource></p>}
    </div>}
  </section>;
}
export function TeamLookupPage() {
  const {data: notes, isError} = useQuery({queryKey: ['team-notes'], queryFn: getTeamNotes, staleTime: Infinity, retry: false});
  const [tab, setTab] = useState<'hospital' | 'code'>('hospital');
  return <>
    <PageHead eyebrow="Tools · TEAM" title="Medicare TEAM lookup" lead={notes ? notes[0] : isError ? undefined : '…'}>
      {isError && <div className="op-nf" role="alert">Could not load the TEAM notes.</div>}
      <div className="op-row team-head-actions"><Link className="op-btn-2" to="/team/calculator">Work through a claimed benefit ›</Link></div>
    </PageHead>
    <div className="op-wrap op-section op-stack">
      <div className="op-search team-search">
        <div className="op-search-top"><div className="op-tabs" role="tablist" aria-label="TEAM lookup"><button type="button" role="tab" className="op-tab" aria-selected={tab === 'hospital'} onClick={() => setTab('hospital')}>Is a hospital in TEAM?</button><button type="button" role="tab" className="op-tab" aria-selected={tab === 'code'} onClick={() => setTab('code')}>Does a code start a TEAM episode?</button></div></div>
        <div className="team-search-body op-stack">{tab === 'hospital' ? <HospitalBox /> : <CodeBox />}</div>
      </div>
      {notes && notes.length > 1 && <div className="op-note"><b>What TEAM does and doesn't change</b><ul className="team-notes">{notes.slice(1).map((n, i) => <li key={i}>{n}</li>)}</ul></div>}
    </div>
  </>;
}

/* ---------------- Calculator ---------------- */
const fields: {key: keyof ClaimInputs; label: string; unit?: string}[] = [
  {key: 'cases', label: 'Cases per year'},
  {key: 'implantNow', label: 'Implant cost per case now', unit: '$'},
  {key: 'implantNew', label: 'Implant cost per case with the proposed product', unit: '$'},
  {key: 'losDays', label: 'Claimed change in length of stay (days, can be negative)'},
  {key: 'costPerDay', label: 'Your cost per inpatient day', unit: '$'},
  {key: 'readmitPts', label: 'Claimed change in 30-day readmission rate (percentage points)'},
  {key: 'readmitPay', label: 'Medicare payment for a readmission', unit: '$'},
  {key: 'postAcutePts', label: 'Claimed change in discharges to a skilled nursing or rehab facility (percentage points)'},
  {key: 'postAcutePay', label: 'Medicare payment for that post-acute stay', unit: '$'},
];
type Raw = Record<keyof ClaimInputs, string>;
const blank = Object.fromEntries(fields.map(f => [f.key, ''])) as Raw;
const NE = 'Not entered';
const money = (v: number | null) => v === null ? NE : teamDollars(v);
const outsideLine = 'Claims about revisions, implant survival or function after 30 days fall outside the episode. They are evidence questions, not TEAM dollars.';
const fixedNotes = ["TEAM reconciliation also applies a quality adjustment, risk adjustment, the hospital's own target price and stop-gain and stop-loss limits; this arithmetic leaves them out.", 'This is arithmetic on the figures above, not a forecast or financial advice.'];

function useTeamFamilies() {
  const list = useQuery({queryKey: ['procedures'], queryFn: getProcedureList, staleTime: Infinity, retry: false});
  const fams = useQuery({queryKey: ['team-families-all'], queryFn: () => Promise.all(teamFamilies.map(f => getTeamFamily(f))), staleTime: Infinity, retry: false});
  return {list: list.data, fams: fams.data, error: list.isError || fams.isError};
}

export function TeamCalculatorPage() {
  const {list, fams, error} = useTeamFamilies();
  const [fam, setFam] = useState('');
  const [drg, setDrg] = useState('');
  const [region, setRegion] = useState('');
  const [hq, setHq] = useState('');
  const [hospital, setHospital] = useState<string | null>(null);
  const [filled, setFilled] = useState<string | null>(null);
  const [raw, setRaw] = useState<Raw>(blank);
  const hospitals = useHospitalSearch(hq);
  const family = fams?.[teamFamilies.indexOf(fam as typeof teamFamilies[number])];
  const price = family?.prices_2027?.find(p => p.drg === drg);
  const regions = price?.regions ?? family?.prices_2027?.[0]?.regions ?? [];
  const target = price?.regions.find(r => r.region === region)?.target_price ?? null;
  const inputs = useMemo(() => Object.fromEntries(fields.map(f => [f.key, parseInput(raw[f.key])])) as unknown as ClaimInputs, [raw]);
  const L = teamLedger(inputs, target);
  const name = (id: string) => list?.procedures.find(p => p.family_id === id)?.name ?? id;
  const famLabel = (id: string, i: number) => `${fams?.[i]?.category ?? 'TEAM'}: ${name(id)}`;
  const regionName = regions.find(r => r.region === region)?.region_name;
  const shown = (k: keyof ClaimInputs) => raw[k].trim() === '' ? NE : inputs[k] === null ? NE : fields.find(f => f.key === k)?.unit ? teamDollars(inputs[k]) : String(inputs[k]);
  const tag = (t: 'cms' | 'you') => <span className="data-tag ml-2">{t === 'cms' ? 'CMS figure' : 'your input'}</span>;

  const ledger = <>
    <h3>a) Hospital cost per case (outside TEAM, because Medicare's DRG payment for the stay is fixed)</h3>
    <table className="brief-table"><tbody>
      <tr><td>Implant difference = proposed minus current {tag('you')}</td><td>{money(L.implantDiff)}</td></tr>
      <tr><td>Length-of-stay cost change = days change x cost per day {tag('you')}</td><td>{money(L.losCost)}</td></tr>
      <tr><td><strong>Hospital cost change per case</strong></td><td><strong>{money(L.hospital)}</strong></td></tr>
    </tbody></table>
    <h3 className="mt-6">b) Medicare spending in the TEAM episode per case</h3>
    <table className="brief-table"><tbody>
      <tr><td>Readmission change = rate change / 100 x readmission payment {tag('you')}</td><td>{money(L.readmit)}</td></tr>
      <tr><td>Post-acute change = discharge change / 100 x post-acute payment {tag('you')}</td><td>{money(L.postAcute)}</td></tr>
      <tr><td><strong>Episode spending change per case</strong></td><td><strong>{money(L.episode)}</strong></td></tr>
      <tr><td>As a percent of the target price {tag('cms')}</td><td>{L.episodePct === null ? NE : `${L.episodePct.toFixed(1)}%`}</td></tr>
    </tbody></table>
    <h3 className="mt-6">c) Outside the episode</h3><p>{outsideLine}</p>
    <h3 className="mt-6">Result</h3>
    <table className="brief-table"><tbody>
      <tr><td>Net per case = a + b (a cost increase is positive)</td><td><strong>{money(L.net)}</strong></td></tr>
      <tr><td>Per year = net per case x cases per year {tag('you')}</td><td>{money(L.perYear)}</td></tr>
      <tr><td colSpan={2}>{L.breakEven === null ? <>The claimed effects offset an implant premium of up to {NE} per case.</> : <>The claimed effects offset an implant premium of up to {teamDollars(L.breakEven)} per case.</>}</td></tr>
    </tbody></table>
    <p className="section-caption">Totals add only the lines entered.</p>
    <h3 className="mt-6">Sensitivity</h3>
    <table className="brief-table"><thead><tr><th>Claimed effects as entered</th><th>Net per case</th></tr></thead><tbody>{[0.5, 1, 1.5].map(s => <tr key={s}><td>{s * 100}%</td><td>{money(teamLedger(inputs, target, s).net)}</td></tr>)}</tbody></table>
    <ul className="list-disc pl-5 space-y-2 mt-6">{fixedNotes.map(n => <li key={n}>{n}</li>)}</ul>
  </>;
  const episode = <table className="brief-table"><tbody>
    <tr><td>Procedure</td><td>{fam ? name(fam) : NE}</td></tr>
    <tr><td>MS-DRG</td><td>{price ? `${price.drg}${price.title ? ` ${price.title}` : ''}` : NE}</td></tr>
    <tr><td>Census division</td><td>{regionName ?? NE}{hospital && ` (from ${hospital})`}</td></tr>
    <tr><td>CMS 2027 preliminary target price {tag('cms')}</td><td>{target === null ? NE : teamDollars(target)}</td></tr>
  </tbody></table>;

  const [url, setUrl] = useState(''); const [generated, setGenerated] = useState('');
  useEffect(() => { setUrl(`${benchmarkOrigin}/team/calculator`); setGenerated(new Date().toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'})); }, []);

  return <>
    <PageHead eyebrow="Tools · TEAM" title="TEAM arithmetic for a device claim" lead="Everything on this page runs in your browser. Nothing you type is sent or stored." crumb={<Link to="/team" className="op-crumb">Medicare TEAM lookup</Link>}>
      <div className="op-row team-head-actions"><button type="button" className="op-btn-2" onClick={() => void printBrief()}><Printer size={16} aria-hidden="true" />Print</button></div>
    </PageHead>
    <div className="op-wrap op-section op-stack team-calc">
    <section className="brief-section"><h2>Step 1. The episode</h2>
      {error && <p className="notice" role="alert">Could not load TEAM prices. Try again.</p>}
      {!fams && !error && <Status busy />}
      {fams && <div className="team-form">
        <label>Procedure<select className="team-select" value={fam} onChange={e => { setFam(e.target.value); setDrg(''); }}><option value="">Choose a procedure</option>{teamFamilies.map((f, i) => <option key={f} value={f}>{famLabel(f, i)}</option>)}</select></label>
        <label>MS-DRG<select className="team-select" value={drg} disabled={!family} onChange={e => setDrg(e.target.value)}><option value="">Choose an MS-DRG</option>{(family?.prices_2027 ?? []).map(p => <option key={p.drg} value={p.drg}>{p.drg}{p.title ? ` ${p.title}` : ''}</option>)}</select></label>
        <label>Census division<select className="team-select" value={region} disabled={!regions.length} onChange={e => { setRegion(e.target.value); setHospital(null); setFilled(null); }}><option value="">Choose a census division</option>{regions.map(r => <option key={r.region} value={r.region}>{r.region_name}</option>)}</select></label>
        <label>Or find a hospital<Input type="search" value={hq} onChange={e => setHq(e.target.value)} placeholder="Hospital name, city, state or CCN" /></label>
        {filled && hospital && <p className="op-caption team-filled" role="status">Filled census division {filled} from the hospital</p>}
        {hospitals.data && hq.trim().length >= 2 && <div className="team-hospitals">{hospitals.data.note && <p className="section-caption">{hospitals.data.note}</p>}{hospitals.data.results.slice(0, 12).map(h => <Button key={h.ccn} variant="link" className="px-0 h-auto whitespace-normal text-left" onClick={() => { if (h.region) setRegion(h.region); setHospital(h.hospital); setFilled(h.region); setHq(''); }}>{h.hospital}, {h.cbsa_name ?? h.state} · {h.region_name}</Button>)}</div>}
      </div>}
      <div className="mt-6">{episode}</div>
    </section>
    <section className="brief-section"><h2>Step 2. The claim</h2><p className="section-caption">All optional. Blank means not entered.</p>
      <div className="team-form">{fields.map(f => <label key={f.key}>{f.label}<Input inputMode="decimal" value={raw[f.key]} onChange={e => setRaw({...raw, [f.key]: e.target.value})} /></label>)}</div>
    </section>
    <section className="brief-section"><h2>Step 3. The arithmetic</h2>{ledger}</section>
    </div>
    <div className="print-brief decision-print compare-print" aria-hidden="true">
      <div className="print-brand-bar"><div className="print-brand-lockup"><BrandMark /><span className="print-wordmark"><strong>Ortho</strong><span>Parity</span></span><span className="print-tagline">Orthopedic device and vendor benchmarks</span></div><p className="print-generated">Brief generated {generated}</p></div>
      <p className="print-sub">Medicare TEAM</p><h1>TEAM arithmetic for a device claim</h1>
      <h2>The episode</h2>{episode}
      <h2>The claim</h2><table className="brief-table"><tbody>{fields.map(f => <tr key={f.key}><td>{f.label}</td><td>{shown(f.key)}</td></tr>)}</tbody></table>
      <h2>The arithmetic</h2>{ledger}
      <footer><p>{url}</p><p>Computed in the browser. Nothing typed was sent or stored.</p><p>Generated by OrthoParity from public CMS data. Not regulatory or compliance advice.</p><p>Terms and privacy: orthoparity.com/terms · orthoparity.com/privacy</p></footer>
    </div>
  </>;
}
