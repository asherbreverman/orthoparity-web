import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from '@tanstack/react-router';
import { Lock, Search } from 'lucide-react';
import { DeviceSearch } from './reviewer-shared';
import { VendorSearch } from './vendor-search';
import { searchParts } from '@/lib/predicate-data';
import { batchAllowed, parseBatch } from '@/lib/reviewer-data';
import { normalizeDeviceNumber } from '@/lib/fda-device';
import { maxCompareProducts, runLimited } from '@/lib/product-comparison';
import type { Meta } from '@/lib/predicate-chain';
import type { VendorCoverage } from '@/lib/vendor-coverage';

export type SearchLevel = 'part' | 'product' | 'company';
const levels: SearchLevel[] = ['part', 'product', 'company'];
export function searchLevel(value: string | undefined): SearchLevel { return value === 'part' || value === 'company' ? value : 'product'; }
export function parsePartList(value: string) { return [...new Set(value.split(/[\n,;]+/).map(part => part.trim()).filter(Boolean))].slice(0, maxCompareProducts); }
export function dataThroughDate(value: string | undefined) {
  if (!value) return '…';
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function useSlashFocus() {
  useEffect(() => {
    const focus = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey || target?.matches('input,textarea,select,[contenteditable="true"]')) return;
      const input = document.getElementById('op-benchmark-search');
      if (!input) return;
      event.preventDefault();
      input.focus();
    };
    document.addEventListener('keydown', focus);
    return () => document.removeEventListener('keydown', focus);
  }, []);
}

function HomeSearch({ level, compare, initialQuery }: { level: SearchLevel; compare: boolean; initialQuery: string }) {
  const navigate = useNavigate();
  const [formError, setFormError] = useState('');
  useSlashFocus();
  useEffect(() => { setFormError(''); }, [level, compare]);

  const changeLevel = (next: SearchLevel) => void navigate({ to: '/', search: compare ? { level: next, compare: '' } : { level: next } });
  const changeMode = (next: boolean) => void navigate({ to: '/', search: next ? { level, compare: '' } : { level } });
  const product = (k: string, part?: string) => {
    if (compare) return void navigate({ to: '/', search: { level: 'product', k, compare: '' } });
    return void navigate({ to: '/', search: { level, k, part } });
  };
  const company = (vendor: string) => void navigate({ to: '/', search: compare ? { level: 'company', v: vendor, compare: '' } : { level: 'company', v: vendor } });

  function submitProducts(value: string) {
    setFormError('');
    if (!compare) {
      const number = normalizeDeviceNumber(value);
      if (number) product(number);
      else setFormError('Choose a product from the search results.');
      return;
    }
    const numbers = parseBatch(value);
    if (!batchAllowed(numbers)) { setFormError(numbers.length ? `You can compare up to ${maxCompareProducts} products.` : 'Enter FDA numbers or choose a product from the search results.'); return; }
    const [first, ...others] = numbers;
    if (first) void navigate({ to: '/', search: { level: 'product', k: first, compare: others.join(',') } });
  }

  async function submitParts(value: string) {
    setFormError('');
    const list = parsePartList(value);
    if (!compare) {
      if (value.trim()) void navigate({ to: '/', search: { level: 'part', part: value.trim() } });
      return;
    }
    if (!list.length) { setFormError('Enter part numbers or choose a part from the search results.'); return; }
    const found = new Map<string, string>();
    await runLimited(list, 6, part => searchParts(part, 1), (part, result) => {
      const number = result?.results[0]?.number;
      if (number) found.set(part, number);
    });
    const numbers = [...new Set(list.map(part => found.get(part)).filter((number): number is string => !!number))];
    if (!numbers.length) { setFormError('No matching part numbers found.'); return; }
    const [first, ...others] = numbers;
    if (first) void navigate({ to: '/', search: { level: 'part', k: first, compare: others.join(',') } });
  }

  function submitCompany(value: string) {
    if (value.trim()) setFormError('Choose a company from the search results.');
  }

  const placeholder = compare
    ? level === 'part' ? 'Paste part numbers, one per line (up to 50)' : level === 'company' ? 'Add two companies' : 'Add 2 to 50 products by FDA number or name'
    : level === 'part' ? 'Type a catalog or model number, e.g. 213-65-05' : level === 'company' ? 'Type a company name' : 'Type an FDA number, product name or brand';
  const label = compare ? 'Compare orthopedic records' : `Benchmark an orthopedic ${level}`;
  const submitLabel = compare ? 'Compare' : 'Benchmark';
  const searchKey = `${level}-${compare}-${initialQuery}`;

  const examples = compare
    ? level === 'product' ? <>
      <button type="button" className="op-chip" onClick={() => void navigate({ to: '/', search: { level: 'product', k: 'K171651', compare: 'K250477' } })}>K171651 + K250477</button>
      <button type="button" className="op-chip" onClick={() => void navigate({ to: '/', search: { level: 'product', k: 'K171651', compare: '' } })}>Paste a list of 50</button>
    </> : level === 'part' ? <button type="button" className="op-chip" onClick={() => void submitParts('213-65-05\n5251300')}>213-65-05 + 5251300</button>
      : <button type="button" className="op-chip" onClick={() => void navigate({ to: '/', search: { level: 'company', v: 'globus_medical', compare: 'alphatec_spine' } })}>Globus Medical + Alphatec Spine</button>
    : level === 'product' ? <>
      <button type="button" className="op-chip" onClick={() => product('K140881')}>ATTUNE knee (K140881)</button>
      <button type="button" className="op-chip" onClick={() => product('K150862')}>ACTIS hip (K150862)</button>
      <button type="button" className="op-chip" onClick={() => product('K171651')}>ExcelsiusGPS (K171651)</button>
      <button type="button" className="op-chip" onClick={() => product('K063569')}>Equinoxe reverse shoulder (K063569)</button>
    </> : level === 'part' ? <>
      <button type="button" className="op-chip" onClick={() => void navigate({ to: '/', search: { level: 'part', part: '213-65-05' } })}>213-65-05</button>
      <button type="button" className="op-chip" onClick={() => void navigate({ to: '/', search: { level: 'part', part: '5251300' } })}>5251300</button>
    </> : <>
      <button type="button" className="op-chip" onClick={() => company('zimmer_biomet')}>Zimmer Biomet</button>
      <button type="button" className="op-chip" onClick={() => company('stryker')}>Stryker</button>
      <button type="button" className="op-chip" onClick={() => company('globus_medical')}>Globus Medical</button>
      <button type="button" className="op-chip" onClick={() => company('smith_nephew')}>Smith+Nephew</button>
    </>;

  return <>
    <div className="op-search">
      <div className="op-search-top">
        <div className="op-tabs" role="tablist" aria-label="Benchmark level" onKeyDown={event => {
          const index = levels.indexOf(level);
          let next = index;
          if (event.key === 'ArrowRight') next = (index + 1) % levels.length;
          else if (event.key === 'ArrowLeft') next = (index + levels.length - 1) % levels.length;
          else if (event.key === 'Home') next = 0;
          else if (event.key === 'End') next = levels.length - 1;
          else return;
          event.preventDefault();
          const selected = levels[next] ?? 'product';
          changeLevel(selected);
          requestAnimationFrame(() => document.getElementById(`op-tab-${selected}`)?.focus());
        }}>
          <button id="op-tab-part" type="button" className="op-tab" role="tab" aria-selected={level === 'part'} tabIndex={level === 'part' ? 0 : -1} onClick={() => changeLevel('part')}>Part<small>Catalog or model number</small></button>
          <button id="op-tab-product" type="button" className="op-tab" role="tab" aria-selected={level === 'product'} tabIndex={level === 'product' ? 0 : -1} onClick={() => changeLevel('product')}>Product<small>510(k), approval or name</small></button>
          <button id="op-tab-company" type="button" className="op-tab" role="tab" aria-selected={level === 'company'} tabIndex={level === 'company' ? 0 : -1} onClick={() => changeLevel('company')}>Company<small>Counted by parent</small></button>
        </div>
        <div className="op-seg" role="radiogroup" aria-label="Benchmark mode" onKeyDown={event => {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); changeMode(!compare); }
        }}>
          <button type="button" role="radio" aria-checked={!compare} onClick={() => changeMode(false)}>Benchmark one</button>
          <button type="button" role="radio" aria-checked={compare} onClick={() => changeMode(true)}>Compare</button>
        </div>
      </div>
      {level === 'company' ? <VendorSearch key={searchKey} label={label} placeholder={placeholder} initialValue={initialQuery} autoSearch={!!initialQuery} onSelect={row => company(row.vendor_id)} variant="op" submitLabel={submitLabel} inputId="op-benchmark-search" onSubmitValue={submitCompany} /> : <DeviceSearch key={searchKey} label={label} placeholder={placeholder} initialValue={initialQuery} autoSearch={!!initialQuery} onSelect={(row, part) => product(row.knumber, part)} variant="op" submitLabel={submitLabel} inputId="op-benchmark-search" onSubmitValue={level === 'part' ? submitParts : submitProducts} />}
      <div className="op-search-try"><span>Try {level === 'company' ? 'a company' : `a ${level}`}:</span>{examples}</div>
      {formError && <p className="op-caption op-search-error" role="alert">{formError}</p>}
    </div>
    <p className="op-caption op-privacy-note"><Lock size={13} aria-hidden="true" />Your pricing stays yours. No login, nothing to upload, and OrthoParity never asks for it.</p>
  </>;
}

const steps = [
  ['Step 1', 'Start with the predicate', 'What the vendor told FDA its device is equivalent to.'],
  ['Step 2', 'Find the equivalents', 'Every device sharing that predicate or product code.'],
  ['Step 3', 'Compare the risk', 'Recalls, adverse events and inspections next to your current vendors.'],
  ['Step 4', 'Make them compete', 'Novel or commodity, and who else already fills the need.'],
  ['Step 5', 'Bring your pricing', 'Add your price to any compare or part list. It stays in your browser and lands in your CSV.'],
];
const sources = ['FDA 510(k)s', 'FDA approvals (PMA, HDE)', 'GUDID', 'Recalls', 'Adverse events (MAUDE)', 'Establishment registrations', 'Inspections and warning letters', 'CMS Open Payments', 'Medicare hospital payments', 'Medicare add-on payments', 'Medicare ASC rates', 'CMS TEAM model', 'ClinicalTrials.gov'];

export function HomeLanding({ level, compare, initialQuery, coverage, meta }: { level: SearchLevel; compare: boolean; initialQuery: string; coverage: VendorCoverage | null; meta: Meta }) {
  const productCodeCount = Number(meta.starting_set_clearances);
  return <>
    <section className="op-band op-home-hero-band">
      <div className="op-wrap op-home-hero">
        <p className="op-small">Free and open source, for value analysis, supply chain and materials management teams. Built only from public FDA and CMS data.</p>
        <h1 className="op-display">Know what the vendor knows.</h1>
        <p className="op-lead">Their public record plus your private pricing. Look up any orthopedic part, product or company, or put them side by side.</p>
        <HomeSearch level={level} compare={compare} initialQuery={initialQuery} />
      </div>
    </section>

    <section className="op-wrap op-section">
      <h2 className="op-h2">Built for the people who decide what goes on the shelf</h2>
      <p className="op-intro">Same tools whether you work at a health system, an ASC or a GPO.</p>
      <div className="op-grid-3 op-home-cards">
        <article className="op-card"><h3 className="op-h3">Value analysis</h3><ul><li>A 12-question brief on any product, with questions for the vendor</li><li>Packet check: a vendor claim next to FDA and the trial registry</li><li>Recalls, adverse events and registered trials in one place</li></ul><Link className="op-link" to="/for/value-analysis">For value analysis teams</Link></article>
        <article className="op-card"><h3 className="op-h3">Supply chain and sourcing</h3><ul><li>Who owns whom, supplier sites and FDA inspections</li><li>Every company in a product category, by parent</li><li>Compare up to 50 products and download a CSV</li></ul><Link className="op-link" to="/for/supply-chain">For supply chain teams</Link></article>
        <article className="op-card"><h3 className="op-h3">Materials management</h3><ul><li>Look up any part number in FDA's GUDID</li><li>Catalog size and what's still in distribution</li><li>Medicare and ASC payments for the procedures it's used in</li></ul><Link className="op-link" to="/for/materials-management">For materials management</Link></article>
      </div>
    </section>

    <section className="op-wrap op-section">
      <h2 className="op-h2">Everything OrthoParity does</h2>
      <div className="op-grid op-home-cards op-tool-grid">
        <Link className="op-card compact op-card-link" to="/" search={{ level: 'part' }}><span className="op-tag">PRT</span><b>Benchmark a part</b><span>Find the product behind any catalog number.</span></Link>
        <Link className="op-card compact op-card-link" to="/" search={{ level: 'product' }}><span className="op-tag">PRD</span><b>Benchmark a product</b><span>Predicates, alternatives, recalls, payments and Medicare.</span></Link>
        <Link className="op-card compact op-card-link" to="/" search={{ level: 'company' }}><span className="op-tag">CO</span><b>Benchmark a company</b><span>Ownership, portfolio, supplier record and trials.</span></Link>
        <Link className="op-card compact op-card-link" to="/" search={{ level: 'product', compare: '' }}><span className="op-tag">VS</span><b>Compare</b><span>2 to 50 products, or two companies, side by side.</span></Link>
        <Link className="op-card compact op-card-link" to="/browse"><span className="op-tag">CAT</span><b>Browse by category</b><span>Every FDA record in all 291 product codes.</span></Link>
        <Link className="op-card compact op-card-link" to="/procedures"><span className="op-tag">DRG</span><b>Medicare by procedure</b><span>What Medicare pays for 15 procedure families.</span></Link>
        <Link className="op-card compact op-card-link" to="/team"><span className="op-tag">TM</span><b>TEAM lookup</b><span>Which hospitals are in TEAM and their 2027 target prices.</span></Link>
        <Link className="op-card compact op-card-link" to="/packet-check" search={{}}><span className="op-tag">CHK</span><b>Packet check</b><span>Set a vendor packet's claim next to the public record.</span></Link>
      </div>
    </section>

    <section className="op-wrap op-section">
      <h2 className="op-h2">Their public record <span className="op-home-accent">+</span> your pricing <span className="op-home-accent">=</span> leverage</h2>
      <p className="op-intro">Five steps for every new product or vendor request.</p>
      <div className="op-home-cards op-home-steps">{steps.map(([label, title, body]) => <article className="op-card compact" key={label}><p className="op-step">{label}</p><h3 className="op-h3">{title}</h3><p className="op-small">{body}</p></article>)}</div>
    </section>

    <section className="op-wrap op-section">
      <h2 className="op-h2">Every answer traces to a public record</h2>
      <div className="op-card op-home-record">
        <div className="op-stats">
          <div className="op-stat"><b>{coverage?.devices.toLocaleString('en-US') ?? '…'}</b><span>orthopedic FDA records, {coverage?.first ?? '…'} to {coverage?.last ?? '…'}<br />({Number.isFinite(productCodeCount) && productCodeCount > 0 ? productCodeCount.toLocaleString('en-US') : '…'} with a product code)</span></div>
          <div className="op-stat"><b>{coverage?.count.toLocaleString('en-US') ?? '…'}</b><span>orthopedic companies, counted by parent company</span></div>
          <div className="op-stat"><b>13</b><span>public FDA, CMS and NLM sources</span></div>
          <div className="op-stat"><b>{dataThroughDate(meta.exported_utc)}</b><span>data current through</span></div>
        </div>
        <div className="op-row op-home-sources">{sources.map(source => <span className="op-source" key={source}>{source}</span>)}</div>
        <div className="op-row op-home-record-links"><Link className="op-link" to="/corrections">Corrections</Link><Link className="op-link" to="/updates">Release notes</Link><button type="button" className="op-text-link" onClick={() => window.dispatchEvent(new Event('op-methodology'))}>Methodology and limitations</button><a className="op-link" href="https://github.com/asherbreverman/orthoparity-data" target="_blank" rel="noopener noreferrer">Download the data</a></div>
      </div>
    </section>
  </>;
}

export function NotFoundPage() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  useSlashFocus();
  useEffect(() => { document.title = "This page isn't here | OrthoParity"; }, []);
  return <section className="op-band op-not-found">
    <div className="op-wrap op-pagehead op-prose">
      <p className="op-eyebrow">404</p>
      <h1 className="op-title">This page isn't here</h1>
      <p className="op-lead">The link may be old, or the address has a typo. Search for a part, product or company instead.</p>
      <form onSubmit={event => { event.preventDefault(); if (query.trim()) void navigate({ to: '/', search: { level: 'product', q: query.trim() } }); }}>
        <div className="op-search-row"><label className="op-input lg"><Search size={18} aria-hidden="true" /><input id="op-benchmark-search" aria-label="Search OrthoParity" placeholder="Type a part number, FDA number, product or company" value={query} onChange={event => setQuery(event.target.value)} /></label><button className="op-btn" type="submit">Search</button></div>
      </form>
      <nav className="op-row op-not-found-links" aria-label="Helpful pages"><Link className="op-link" to="/" search={{}}>Home</Link><Link className="op-link" to="/browse">Browse by category</Link><Link className="op-link" to="/procedures">Medicare by procedure</Link><Link className="op-link" to="/updates">Release notes</Link></nav>
    </div>
  </section>;
}

export function DockedSearch({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => { setTarget(document.getElementById('docked-search')); document.documentElement.classList.add('has-result'); return () => document.documentElement.classList.remove('has-result'); }, []);
  return target ? createPortal(children, target) : null;
}
