import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Check, Copy, Lock, Printer, X } from 'lucide-react';
import { Status } from './reviewer-shared';
import { BrandMark } from './brand-mark';
import { NctLink } from './trial-evidence';
import { CopyLink, PageHead } from './op-controls';
import { getSignals, getTeamCode, getTeamHospitals, getTrialLookup } from '@/lib/predicate-data';
import { askLines } from '@/lib/signals';
import { displayName, companyName } from '@/lib/format';
import { normalizeDeviceNumber } from '@/lib/fda-device';
import { normalizeNct, packetQuestions, parseCtGov, trialStatus, type Trial } from '@/lib/trials';
import { lowerFirst, teamDate } from '@/lib/team';
import { benchmarkOrigin } from '@/lib/benchmark-brand';
import { printBrief } from '@/lib/brief-print';
import { emptyClaim, MAX_CLAIMS, parsePacketHash, serializePacket, type PacketClaim, type PacketState } from '@/lib/packet-claims';

const NOT_FOUND = 'NOT FOUND: not in this database';
const NS = 'Not stated in the packet';
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
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

/** Typed packet text goes into the URL fragment only, which browsers never send in requests. */
function usePacketState(initialK: string) {
  const [state, setState] = useState<PacketState>(() => ({preparedBy: '', claims: [emptyClaim(initialK)]}));
  const ref = useRef(state); ref.current = state;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loaded = useRef(false);
  useIsoLayoutEffect(() => { setState(parsePacketHash(window.location.hash, initialK)); loaded.current = true; }, [initialK]);
  const flush = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (!loaded.current) return;
    const frag = serializePacket(ref.current);
    const url = window.location.pathname + window.location.search + (frag ? `#${frag}` : '');
    if (url !== window.location.pathname + window.location.search + window.location.hash) window.history.replaceState(window.history.state, '', url);
  }, []);
  useEffect(() => { if (!loaded.current) return; if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(flush, 250); }, [state, flush]);
  useEffect(() => { window.addEventListener('op-flush-prices', flush); window.addEventListener('beforeunload', flush); return () => { window.removeEventListener('op-flush-prices', flush); window.removeEventListener('beforeunload', flush); }; }, [flush]);
  return [state, setState] as const;
}

function useClaimData(f: PacketClaim) {
  const k = normalizeDeviceNumber(useDebounced(f.k)) ?? '';
  const nct = normalizeNct(useDebounced(f.nct)) ?? '';
  const code = useDebounced(f.code).trim();
  const sig = useQuery({queryKey: ['signals', k], queryFn: () => getSignals(k), enabled: !!k, staleTime: Infinity, retry: false});
  const tr = useQuery({queryKey: ['packet-trial', nct], queryFn: () => readTrial(nct), enabled: !!nct, staleTime: Infinity, retry: false});
  const tc = useQuery({queryKey: ['team-code', code.toUpperCase()], queryFn: () => getTeamCode(code), enabled: code.length >= 3, staleTime: Infinity, retry: false});
  return {k, nct, code, sig, tr, tc};
}

/** One claim's public-record comparison; rendered on screen for the open tab and in print for every claim. */
function ClaimRecord({f, index, print}: {f: PacketClaim; index: number; print?: boolean}) {
  const {k, nct, code, sig, tr, tc} = useClaimData(f);
  const [copied, setCopied] = useState(false);
  const s = sig.data; const trial = tr.data?.trial ?? null;
  const questions = packetQuestions(f, trial, s?.found ? askLines(s.cards) : []);
  const copy = async () => { await navigator.clipboard.writeText(questions.map((q, i) => `${i + 1}. ${q}`).join('\n')); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  const fda = !f.k.trim() ? <p className="op-small">Not entered</p> : !k ? <p>{NOT_FOUND}</p> : sig.isError ? <Status error="Could not load the FDA record." /> : !s ? <Status busy /> : !s.found ? <p>{NOT_FOUND}</p> : <>
    <p className="packet-fda-line"><b>{displayName(s.header.device_name ?? 'NOT FOUND')}</b> · <span className="op-mono">{k}</span> · {companyName(s.header.company ?? 'NOT FOUND')} · {s.pathway ?? 'NOT FOUND'} · {s.header.cleared ?? 'NOT FOUND'}{s.header.product_code && <> · <Link className="op-mono" to="/browse/$code" params={{code: s.header.product_code}}>{s.header.product_code}</Link></>}{!print && <> · <Link to="/" search={{k}}>Product page ›</Link></>}</p>
    <table className="op-table packet-findings"><thead><tr><th scope="col">Question</th><th scope="col">Finding</th></tr></thead><tbody>{s.cards.map(c => <tr key={c.key}><td>{c.short ?? c.question}</td><td>{c.badge}</td></tr>)}</tbody></table></>;

  const reg = (v: string | null | undefined) => tr.data ? (v ?? 'NOT FOUND') : '';
  const rows = ([['Outcome', f.outcome, trial?.primary_outcome], ['Comparator', f.comparator, null], ['Time frame', f.timeframe, trial?.primary_timeframe], ['Study design', '', trial?.allocation], ['Status', '', trialStatus(trial)], ['Results posted', '', trial ? (trial.has_results === true ? 'Yes' : trial.has_results === false ? 'No' : null) : null], ['Sponsor', '', trial?.sponsor]] as [string, string, string | null | undefined][]);
  const compare = <>
    {f.nct.trim() && !nct && <div className="op-nf">Not a valid NCT number.</div>}
    {nct && tr.isFetching && <Status busy />}
    {tr.data?.source === 'unreachable' && <p className="op-small">Couldn't reach ClinicalTrials.gov from your browser. <a href={`https://clinicaltrials.gov/study/${nct}`} target="_blank" rel="noopener noreferrer">Open {nct} on ClinicalTrials.gov</a></p>}
    {trial && <p className="op-caption"><NctLink t={trial} /> {trial.title} · {tr.data?.source === 'stored' ? "From OrthoParity's copy of ClinicalTrials.gov" : 'Read from ClinicalTrials.gov in your browser'}</p>}
    <table className="op-table"><thead><tr><th scope="col"><span className="op-sr">Field</span></th><th scope="col">The packet</th><th scope="col">The trial registry{nct ? ` (${nct})` : ''}</th></tr></thead><tbody>
      {rows.map(([label, typed, r]) => { const mine = ['Outcome', 'Comparator', 'Time frame'].includes(label) ? (typed.trim() || NS) : NS; return <tr key={label}><td><b>{label}</b></td><td className={mine === NS ? 'op-caption' : undefined}>{mine}</td><td>{!nct ? 'Not entered' : label === 'Comparator' ? (trial ? 'Not a registry field' : '') : reg(r)}</td></tr>; })}
    </tbody></table></>;

  const episode = <table className="op-table"><tbody>
    <tr><td><b>Code</b></td><td>{!code ? 'Not entered' : tc.isFetching ? '…' : tc.data ? (tc.data.found ? <>{tc.data.code} ({tc.data.code_type}, {tc.data.setting}) starts a {lowerFirst(tc.data.category ?? '')} episode, priced under MS-DRG {tc.data.price_drg}.</> : tc.data.note) : ''}</td></tr>
    <tr><td><b>Hospital</b></td><td>{!f.hospital ? 'Not entered' : <>{f.hospital.hospital} ({f.hospital.ccn}) is in TEAM: {f.hospital.participation ?? 'NOT FOUND'}, starting {teamDate(f.hospital.start_date)}, {f.hospital.region_name ?? 'NOT FOUND'}.</>}</td></tr>
  </tbody></table>;
  const qList = <ol className="op-qlist">{questions.map((q, i) => <li key={i}><span>{q}</span>{!print && <button type="button" className="op-copy" aria-label={`Copy question ${i + 1}`} onClick={() => void navigator.clipboard.writeText(q)}><Copy size={14} aria-hidden="true" /></button>}</li>)}</ol>;

  if (print) return <section className="packet-print-claim">
    <h2>Claim {index + 1}{f.claim.trim() ? `: ${f.claim.trim()}` : ''}</h2>
    <h3>1. FDA record</h3>{fda}
    <h3>2. Claim next to the trial registry</h3>{compare}
    <h3>3. Medicare episode</h3>{episode}
    <h3>4. Questions for the vendor</h3>{qList}
  </section>;
  return <div className="op-stack packet-results">
    <section className="op-table-wrap"><div className="op-tablebar"><b>1. FDA record</b></div><div className="packet-pad">{fda}</div></section>
    <section className="op-table-wrap"><div className="op-tablebar"><b>2. Claim next to the trial registry</b>{trial && <NctLink t={trial} />}</div>{f.claim.trim() && <blockquote className="packet-quote">{f.claim}</blockquote>}{compare}</section>
    <section className="op-table-wrap"><div className="op-tablebar"><b>3. Medicare episode</b></div>{episode}</section>
    <section className="op-card"><div className="packet-q-head"><h2 className="op-h3">4. Questions for the vendor</h2><button type="button" className="op-btn-2" onClick={() => void copy()}>{copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}Copy all</button></div>{qList}</section>
  </div>;
}

function ClaimForm({f, index, onChange}: {f: PacketClaim; index: number; onChange: (next: PacketClaim) => void}) {
  const hq = useDebounced(f.hospitalQ).trim();
  const hs = useQuery({queryKey: ['team-hospital', hq.toLowerCase()], queryFn: () => getTeamHospitals(hq), enabled: hq.length >= 2 && !f.hospital, staleTime: Infinity, retry: false});
  const field = (key: 'k' | 'claim' | 'outcome' | 'comparator' | 'timeframe' | 'nct' | 'code', label: string, placeholder?: string) => <label className="op-field">{label}<span className="op-input"><input value={f[key]} onChange={e => onChange({...f, [key]: e.target.value})} placeholder={placeholder} aria-label={`${label}, claim ${index + 1}`} /></span></label>;
  return <div className="op-stack packet-form">
    {field('k', "Product's FDA number (K, DEN, P or H number)")}
    <label className="op-field">The claim as written<span className="op-input packet-textarea"><textarea rows={3} value={f.claim} onChange={e => onChange({...f, claim: e.target.value})} aria-label={`The claim as written, claim ${index + 1}`} /></span></label>
    {field('outcome', 'Claimed outcome')}
    {field('comparator', 'Compared with (comparator)', NS)}
    {field('timeframe', 'Time frame')}
    {field('nct', 'NCT number cited', 'NCT01234567')}
    {field('code', 'MS-DRG or HCPCS code for the procedure', 'Optional')}
    <label className="op-field">Hospital (optional)<span className="op-input"><input type="search" value={f.hospital ? f.hospital.hospital : f.hospitalQ} onChange={e => onChange({...f, hospital: null, hospitalQ: e.target.value})} placeholder="Hospital name, city, state or CCN" aria-label={`Hospital, claim ${index + 1}`} /></span></label>
    {!f.hospital && hs.data && hq.length >= 2 && <div className="team-hospitals">{hs.data.note && <p className="op-caption">{hs.data.note}</p>}{hs.data.results.slice(0, 10).map(h => <button type="button" key={h.ccn} className="op-copy" onClick={() => onChange({...f, hospital: {ccn: h.ccn, hospital: h.hospital, participation: h.participation, start_date: h.start_date, region_name: h.region_name}})}>{h.hospital}, {h.cbsa_name ?? h.state}</button>)}</div>}
  </div>;
}

export function PacketCheckPage({initialK}: {initialK: string}) {
  const [state, setState] = usePacketState(initialK);
  const [active, setActive] = useState(0);
  const current = Math.min(active, state.claims.length - 1);
  const claim = state.claims[current] ?? emptyClaim();
  const [url, setUrl] = useState(''); const [generated, setGenerated] = useState('');
  useEffect(() => { setUrl(`${benchmarkOrigin}/packet-check`); setGenerated(new Date().toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'})); }, []);
  const update = (next: PacketClaim) => setState(prev => ({...prev, claims: prev.claims.map((c, i) => i === current ? next : c)}));
  const add = () => { setState(prev => prev.claims.length >= MAX_CLAIMS ? prev : {...prev, claims: [...prev.claims, emptyClaim(prev.claims[prev.claims.length - 1]?.k ?? '')]}); setActive(state.claims.length); };
  const remove = (i: number) => { setState(prev => prev.claims.length <= 1 ? prev : {...prev, claims: prev.claims.filter((_, j) => j !== i)}); setActive(a => Math.max(0, a >= i ? a - 1 : a)); };

  return <>
    <PageHead eyebrow="Tools" title="Packet check" lead="A vendor packet's claim next to the public record.">
      <div className="op-row packet-actions"><button type="button" className="op-btn-2" onClick={() => void printBrief()}><Printer size={16} aria-hidden="true" />Print / Save as PDF</button><CopyLink /></div>
    </PageHead>
    <div className="op-wrap op-section op-stack">
      <p className="op-small packet-privacy"><Lock size={14} aria-hidden="true" /> Everything you type stays in your browser. Only the FDA number, NCT number, code and hospital search go to OrthoParity's database, and an NCT number OrthoParity doesn't store goes to ClinicalTrials.gov. Copy link puts what you typed into the link, so share it only with people who should see it.</p>
      <div className="packet-grid">
        <section className="op-card op-stack packet-card" aria-label="The packet">
          <h2 className="op-h3">The packet</h2>
          <div className="op-claims" role="tablist" aria-label="Claims">
            {state.claims.map((_, i) => <span key={i} className="packet-claim-tab"><button type="button" role="tab" className="op-tab" aria-selected={i === current} onClick={() => setActive(i)}>Claim {i + 1}</button>{state.claims.length > 1 && i === current && <button type="button" className="packet-remove" aria-label={`Remove claim ${i + 1}`} onClick={() => remove(i)}><X size={14} aria-hidden="true" /></button>}</span>)}
            {state.claims.length < MAX_CLAIMS && <button type="button" className="op-btn-2" onClick={add}>+ Add claim</button>}
          </div>
          <ClaimForm key={current} f={claim} index={current} onChange={update} />
          <label className="op-field">Prepared by (prints only)<span className="op-input"><input value={state.preparedBy} onChange={e => setState(prev => ({...prev, preparedBy: e.target.value}))} /></span></label>
        </section>
        <ClaimRecord f={claim} index={current} />
      </div>
    </div>
    <div className="print-brief decision-print compare-print packet-print" aria-hidden="true">
      <div className="print-brand-bar"><div className="print-brand-lockup"><BrandMark /><span className="print-wordmark"><strong>Ortho</strong><span>Parity</span></span><span className="print-tagline">Orthopedic device and vendor benchmarks</span></div><p className="print-generated">Brief generated {generated}</p></div>
      <p className="print-sub">Packet check</p><h1>A vendor packet against the public record</h1>
      <p>{state.claims.length} {state.claims.length === 1 ? 'claim' : 'claims'}{state.preparedBy.trim() ? ` · Prepared by ${state.preparedBy.trim()}` : ''}</p>
      {state.claims.map((c, i) => <ClaimRecord key={i} f={c} index={i} print />)}
      <footer><p>{url}</p><p>Typed fields stayed in the browser. Not regulatory or compliance advice.</p><p>Terms and privacy: orthoparity.com/terms · orthoparity.com/privacy</p></footer>
    </div>
  </>;
}
