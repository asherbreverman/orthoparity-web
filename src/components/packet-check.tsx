import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Check, Copy, Printer } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { BrandMark } from './brand-mark';
import { Status } from './reviewer-shared';
import { NctLink } from './trial-evidence';
import { getSignals, getTeamCode, getTeamHospitals, getTrialLookup } from '@/lib/predicate-data';
import { askLines } from '@/lib/signals';
import { displayName, companyName } from '@/lib/format';
import { normalizeDeviceNumber } from '@/lib/fda-device';
import { normalizeNct, packetQuestions, parseCtGov, trialStatus, type Trial } from '@/lib/trials';
import { lowerFirst, teamDate, type TeamHospital } from '@/lib/team';
import { benchmarkOrigin } from '@/lib/benchmark-brand';
import { printBrief } from '@/lib/brief-print';

const NOT_FOUND = 'NOT FOUND: not in this database';
const NS = 'Not stated in the packet';
function useDebounced(value: string, ms = 400) { const [v, setV] = useState(value); useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]); return v; }

/** Stored trial first; otherwise ClinicalTrials.gov from the browser. */
async function readTrial(nct: string): Promise<{trial: Trial | null; source: 'stored' | 'ctgov' | 'unreachable'}> {
  const stored = await getTrialLookup(nct);
  if (stored.stored && stored.found) return {trial: stored as Trial, source: 'stored'};
  try {
    const res = await fetch(`https://clinicaltrials.gov/api/v2/studies/${nct}`);
    if (!res.ok) throw new Error(String(res.status));
    return {trial: parseCtGov(nct, await res.json()), source: 'ctgov'};
  } catch { return {trial: null, source: 'unreachable'}; }
}

export function PacketCheckPage({initialK}: {initialK: string}) {
  const [f, setF] = useState({k: initialK, claim: '', outcome: '', comparator: '', timeframe: '', nct: '', code: '', hospitalQ: '', preparedBy: ''});
  const [hospital, setHospital] = useState<TeamHospital | null>(null);
  const [copied, setCopied] = useState(false);
  const set = (key: keyof typeof f) => (e: {target: {value: string}}) => setF({...f, [key]: e.target.value});
  const k = normalizeDeviceNumber(useDebounced(f.k)) ?? '';
  const nct = normalizeNct(useDebounced(f.nct)) ?? '';
  const code = useDebounced(f.code).trim();
  const hq = useDebounced(f.hospitalQ).trim();
  const sig = useQuery({queryKey: ['signals', k], queryFn: () => getSignals(k), enabled: !!k, staleTime: Infinity, retry: false});
  const tr = useQuery({queryKey: ['packet-trial', nct], queryFn: () => readTrial(nct), enabled: !!nct, staleTime: Infinity, retry: false});
  const tc = useQuery({queryKey: ['team-code', code.toUpperCase()], queryFn: () => getTeamCode(code), enabled: code.length >= 3, staleTime: Infinity, retry: false});
  const hs = useQuery({queryKey: ['team-hospital', hq.toLowerCase()], queryFn: () => getTeamHospitals(hq), enabled: hq.length >= 2 && !hospital, staleTime: Infinity, retry: false});
  const s = sig.data; const trial = tr.data?.trial ?? null;
  const questions = packetQuestions(f, trial, s?.found ? askLines(s.cards) : []);
  const copy = async () => { await navigator.clipboard.writeText(questions.map((q, i) => `${i + 1}. ${q}`).join('\n')); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const [url, setUrl] = useState(''); const [generated, setGenerated] = useState('');
  useEffect(() => { setUrl(`${benchmarkOrigin}/packet-check${k ? `?k=${k}` : ''}`); setGenerated(new Date().toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'})); }, [k]);

  const fda = !f.k.trim() ? <p>Not entered</p> : !k ? <p>{NOT_FOUND}</p> : sig.isError ? <Status error="Could not load the FDA record." /> : !s ? <Status busy /> : !s.found ? <p>{NOT_FOUND}</p> : <>
    <table className="brief-table"><tbody>
      <tr><td>Product</td><td>{displayName(s.header.device_name ?? 'NOT FOUND')}</td></tr>
      <tr><td>Company</td><td>{companyName(s.header.company ?? 'NOT FOUND')}</td></tr>
      <tr><td>Pathway and decision</td><td>{s.pathway ?? 'NOT FOUND'} · {s.header.cleared ?? 'NOT FOUND'}</td></tr>
      <tr><td>Product code</td><td>{s.header.product_code ? <Link className="brief-link font-mono" to="/browse/$code" params={{code: s.header.product_code}}>{s.header.product_code}</Link> : 'NOT FOUND'}</td></tr>
    </tbody></table>
    <table className="brief-table mt-4"><thead><tr><th>Question</th><th>Finding</th></tr></thead><tbody>{s.cards.map(c => <tr key={c.key}><td>{c.short ?? c.question}</td><td>{c.badge}</td></tr>)}</tbody></table>
    <p className="mt-3 no-print"><Link className="brief-link" to="/" search={{k}}>Open the full brief</Link></p></>;

  const reg = (v: string | null | undefined) => tr.data ? (v ?? 'NOT FOUND') : '';
  const compare = <>{f.nct.trim() && !nct && <p>Not a valid NCT number.</p>}
    {nct && tr.isFetching && <Status busy />}
    {tr.data?.source === 'unreachable' && <p>Couldn't reach ClinicalTrials.gov from your browser. <a className="brief-link" href={`https://clinicaltrials.gov/study/${nct}`} target="_blank" rel="noopener noreferrer">Open {nct} on ClinicalTrials.gov</a></p>}
    {trial && <p className="section-caption"><NctLink t={trial} /> {trial.title} · {tr.data?.source === 'stored' ? "From OrthoParity's copy of ClinicalTrials.gov" : 'Read from ClinicalTrials.gov in your browser'}</p>}
    <div tabIndex={0} className="brief-table-scroll"><table className="brief-table"><thead><tr><th></th><th>The packet</th><th>The trial registry{nct ? ` (${nct})` : ''}</th></tr></thead><tbody>
      {([['Outcome', f.outcome, trial?.primary_outcome], ['Comparator', f.comparator, null], ['Time frame', f.timeframe, trial?.primary_timeframe], ['Study design', '', trial?.allocation], ['Status', '', trialStatus(trial)], ['Results posted', '', trial ? (trial.has_results === true ? 'Yes' : trial.has_results === false ? 'No' : null) : null], ['Sponsor', '', trial?.sponsor]] as [string, string, string | null | undefined][]).map(([label, typed, r]) => <tr key={label}><td>{label}</td><td>{['Outcome', 'Comparator', 'Time frame'].includes(label) ? (typed.trim() || NS) : NS}</td><td>{!nct ? 'Not entered' : label === 'Comparator' ? (trial ? 'Not a registry field' : '') : reg(r)}</td></tr>)}
    </tbody></table></div></>;

  const episode = <table className="brief-table"><tbody>
    <tr><td>Code</td><td>{!code ? 'Not entered' : tc.isFetching ? '…' : tc.data ? (tc.data.found ? <>{tc.data.code} ({tc.data.code_type}, {tc.data.setting}) starts a {lowerFirst(tc.data.category ?? '')} episode, priced under MS-DRG {tc.data.price_drg}.</> : tc.data.note) : ''}</td></tr>
    <tr><td>Hospital</td><td>{!hospital ? 'Not entered' : <>{hospital.hospital} ({hospital.ccn}) is in TEAM: {hospital.participation ?? 'NOT FOUND'}, starting {teamDate(hospital.start_date)}, {hospital.region_name ?? 'NOT FOUND'}.</>}</td></tr>
  </tbody></table>;

  const qList = <ol className="list-decimal pl-5 space-y-2">{questions.map((q, i) => <li key={i}>{q}</li>)}</ol>;
  const fieldRows: [string, string][] = [["Product's FDA number", f.k], ['The claim as written', f.claim], ['Claimed outcome', f.outcome], ['Compared with', f.comparator], ['Time frame', f.timeframe], ['NCT number cited', f.nct], ['MS-DRG or HCPCS code', f.code], ['Hospital', hospital?.hospital ?? ''], ['Prepared by', f.preparedBy]];

  return <>
    <section className="result-header"><h1 className="result-title">Packet check</h1><p className="section-lead">A vendor packet's claim next to the public record.</p>
      <p className="section-caption">Everything you type stays in your browser. Only the FDA number, NCT number, code and hospital search go to OrthoParity's database, and an NCT number OrthoParity doesn't store goes to ClinicalTrials.gov.</p>
      <Button onClick={() => void printBrief()}><Printer />Print / Save as PDF</Button></section>
    <section className="brief-section"><h2>The packet</h2><div className="team-form">
      <label>Product's FDA number (K, DEN, P or H number)<Input value={f.k} onChange={set('k')} /></label>
      <label style={{gridColumn: '1/-1'}}>The claim as written<Textarea value={f.claim} onChange={set('claim')} rows={3} /></label>
      <label>Claimed outcome<Input value={f.outcome} onChange={set('outcome')} /></label>
      <label>Compared with (comparator)<Input value={f.comparator} onChange={set('comparator')} /></label>
      <label>Time frame<Input value={f.timeframe} onChange={set('timeframe')} /></label>
      <label>NCT number cited<Input value={f.nct} onChange={set('nct')} placeholder="NCT01234567" /></label>
      <label>MS-DRG or HCPCS code for the procedure<Input value={f.code} onChange={set('code')} /></label>
      <label>Hospital (optional)<Input type="search" value={hospital ? hospital.hospital : f.hospitalQ} onChange={e => { setHospital(null); setF({...f, hospitalQ: e.target.value}); }} placeholder="Hospital name, city, state (AZ) or 6-digit CCN" /></label>
      {!hospital && hs.data && hq.length >= 2 && <div className="team-hospitals">{hs.data.note && <p className="section-caption">{hs.data.note}</p>}{hs.data.results.slice(0, 10).map(h => <Button key={h.ccn} variant="link" className="px-0 h-auto whitespace-normal text-left" onClick={() => setHospital(h)}>{h.hospital}, {h.cbsa_name ?? h.state}</Button>)}</div>}
      <label>Prepared by (prints only)<Input value={f.preparedBy} onChange={set('preparedBy')} /></label>
    </div></section>
    <section className="brief-section"><h2>1. FDA record</h2>{fda}</section>
    <section className="brief-section"><h2>2. Claim next to the trial registry</h2>{f.claim.trim() && <blockquote className="section-caption mb-4">{f.claim}</blockquote>}{compare}</section>
    <section className="brief-section"><h2>3. Medicare episode</h2>{episode}</section>
    <section className="brief-section"><div className="section-heading"><h2>4. Questions for the vendor</h2><Button size="sm" onClick={() => void copy()}>{copied ? <Check /> : <Copy />}Copy all</Button></div>{qList}</section>
    <div className="print-brief decision-print compare-print packet-print" aria-hidden="true">
      <div className="print-brand-bar"><div className="print-brand-lockup"><BrandMark /><span className="print-wordmark"><strong>Ortho</strong><span>Parity</span></span><span className="print-tagline">Orthopedic device and vendor benchmarks</span></div><p className="print-generated">Brief generated {generated}</p></div>
      <p className="print-sub">Packet check</p><h1>A vendor packet against the public record</h1>
      <h2>The packet</h2><table><tbody>{fieldRows.map(([l, v]) => <tr key={l}><td>{l}</td><td>{v.trim() || 'Not entered'}</td></tr>)}</tbody></table>
      <h2>1. FDA record</h2>{fda}
      <h2>2. Claim next to the trial registry</h2>{compare}
      <h2>3. Medicare episode</h2>{episode}
      <h2>4. Questions for the vendor</h2>{qList}
      <footer><p>{url}</p><p>Typed fields stayed in the browser. Not regulatory or compliance advice.</p><p>Terms and privacy: orthoparity.com/terms · orthoparity.com/privacy</p></footer>
    </div>
  </>;
}
