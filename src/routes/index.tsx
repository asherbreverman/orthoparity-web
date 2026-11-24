import { ClientOnly, createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { fallback, zodValidator } from '@tanstack/zod-adapter';
import { lazy, Suspense, useEffect, useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { publicPageOptions } from '@/lib/page-queries';
import { pageSubject, previewMetadata } from '@/lib/page-preview';
import { ProcedureError, ProcedureNotFound } from '@/components/procedure-shared';
import { benchmarkOrigin } from '@/lib/benchmark-brand';
import shareImage from '@/assets/orthoparity-share.png.asset.json';
import { Button } from '@/components/ui/button';
import { DeviceSearch, PublicRecordLoading, useRelease } from '@/components/reviewer-shared';
import { PartNote, PartResults } from '@/components/part-results';
import { getVendorCoverage } from '@/lib/predicate-data';
import { VendorSearch } from '@/components/vendor-search';
import { ProductResult } from '@/components/product-result';
import { ProductComparePage, VendorComparePage } from '@/components/compare-pages';
import type { VendorCoverage } from '@/lib/vendor-coverage';
import type { View } from '@/lib/signals';
import { redirectNavigation } from '@/lib/vendor-data';
import { DockedSearch, ModeTabs } from '@/components/benchmark-navigation';
import { normalizeDeviceNumber } from '@/lib/fda-device';
const VendorWorkspace = lazy(() => import('@/components/vendor-workspace').then(m => ({default: m.VendorWorkspace})));
const productExamples: [string, string][] = [['ATTUNE knee (K140881)', 'K140881'], ['ACTIS hip (K150862)', 'K150862'], ['ExcelsiusGPS spine robot (K171651)', 'K171651'], ['Equinoxe reverse shoulder (K063569)', 'K063569'], ['Smith+Nephew suture anchors (K151105)', 'K151105']];
const vendorExamples: [string, string][] = [['Stryker', 'stryker'], ['Johnson & Johnson (DePuy Synthes)', 'jnj_depuy_synthes'], ['Zimmer Biomet', 'zimmer_biomet'], ['Medtronic', 'medtronic'], ['Smith+Nephew', 'smith_nephew']];
const howItWorks = [
  { hue: 1, label: 'Step 1', title: 'Start with the predicate', body: "What the vendor told FDA its device is equivalent to." },
  { hue: 4, label: 'Step 2', title: 'Find the equivalents', body: 'Every device sharing that predicate or product code.' },
  { hue: 2, label: 'Step 3', title: 'Compare the risk', body: 'Recalls, adverse events and inspections next to your current vendors.' },
  { hue: 5, label: 'Step 4', title: 'Make them compete', body: 'Novel or commodity, and who else already fills the need.' },
  { hue: 6, label: 'Step 5', title: 'Benchmark against your pricing', body: 'Per item, construct or procedure, against what you already pay.' },
];
export const Route = createFileRoute('/')({
  staticData: { sitemap: true },
  validateSearch: zodValidator(z.object({k: fallback(z.string(), '').optional(), v: fallback(z.string(), '').optional(), compare: fallback(z.string(), '').optional(), from: fallback(z.string(), '').optional(), mode: fallback(z.string(), '').optional(), view: fallback(z.string(), '').optional(), part: fallback(z.string(), '').optional()})),
  loaderDeps: ({ search }) => pageSubject(search),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(publicPageOptions(deps)),
  pendingComponent: PublicRecordLoading,
  pendingMs: 0,
  errorComponent: ProcedureError,
  notFoundComponent: ProcedureNotFound,
  head: ({ loaderData, match }) => {
    const base = previewMetadata(match.loaderDeps, loaderData?.preview ?? null);
    const part = match.search.part && !match.search.k ? match.search.part : '';
    const { description, url } = base;
    const title = part ? `Part number ${part} | OrthoParity` : base.title;
    return { meta: [{ title }, { name: 'description', content: description }, { property: 'og:title', content: title }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { property: 'og:url', content: url }, { property: 'og:image', content: new URL(shareImage.url, benchmarkOrigin).href }, { name: 'twitter:image', content: new URL(shareImage.url, benchmarkOrigin).href }, { name: 'twitter:title', content: title }, { name: 'twitter:description', content: description }, { name: 'twitter:card', content: 'summary_large_image' }], links: [{ rel: 'canonical', href: url }] };
  },
  component: DeviceBrief,
});
function DeviceBrief() {
  const { k: rawK, v, compare: rawCompare, from, mode, view: viewParam, part } = Route.useSearch();
  const k = normalizeDeviceNumber(rawK ?? '') ?? rawK;
  const comparing = rawCompare !== undefined;
  const compare = rawCompare;
  const { data: initial } = useSuspenseQuery(publicPageOptions(pageSubject({ k, v })));
  const view: View = viewParam === 'analyst' ? 'analyst' : 'brief';
  const vendorMode = !!v || mode === 'vendor';
  const selected = !!k || !!v || !!part;
  const navigate = useNavigate();
  const { meta } = useRelease(initial.meta ?? undefined);
  const [coverage, setCoverage] = useState<VendorCoverage | null>(initial.coverage);
  useEffect(() => { if (initial.coverage) { setCoverage(initial.coverage); return; } let active = true; getVendorCoverage().then(data => { if (active) setCoverage(data); }).catch(() => {}); return () => { active = false; }; }, [initial.coverage]);
  const setView = (next: View) => void navigate({ to: '/', search: prev => ({ ...prev, view: next === 'analyst' ? 'analyst' : undefined }), replace: true, resetScroll: false });
  const changeMode = (vendor: boolean) => void navigate({ to: '/', search: vendor ? { mode: 'vendor' } : {} });
  const search = vendorMode ? <VendorSearch key={v ?? 'vendor'} initialValue={v ?? ''} onSelect={row => void navigate({to:'/',search:{v:row.vendor_id, from: row.via_vendor_id ?? undefined, view: view === 'analyst' ? 'analyst' : undefined}, viewTransition: !window.matchMedia('(prefers-reduced-motion: reduce)').matches})} /> : <DeviceSearch resetKey={k ?? ''} onSelect={(row, partNumber) => void navigate({ to: '/', search: { k: row.knumber, part: partNumber, view: view === 'analyst' ? 'analyst' : undefined }, viewTransition: !window.matchMedia('(prefers-reduced-motion: reduce)').matches })} />;
  return <>
    {selected ? <DockedSearch>{search}</DockedSearch> : <section className="identify-step home-hero">
      <p className="home-tagline">Free and open source, for ASCs and IDNs. Built from public FDA and CMS data.</p>
      <ModeTabs vendor={vendorMode} onChange={changeMode} />
      <h1>Know what the vendor knows.</h1>
      <p>{vendorMode ? 'Their public record plus your private pricing. Search any orthopedic company and benchmark it against the vendors you already buy from, without a GPO.' : 'Their public record plus your private pricing. Search any orthopedic product by 510(k) number, name, company or part number, and benchmark it against what you already pay, without a GPO.'}</p>
      {search}
      <div className="try-examples"><span>Try:</span>{vendorMode ? vendorExamples.map(([label, id]) => <Button key={id} variant="secondary" size="sm" onClick={() => void navigate({to:'/',search:{v:id}})}>{label}</Button>) : productExamples.map(([label, id]) => <Button key={id} variant="secondary" size="sm" onClick={() => void navigate({to:'/',search:{k:id}})}>{label}</Button>)}</div>
      <p className="home-pill question-hue-5">Your pricing stays yours. OrthoParity never asks for it: no login, nothing to upload.</p>
      <div className="mb-6"><Button asChild variant="link"><Link to="/procedures">Or browse Medicare payments by procedure</Link></Button><span aria-hidden="true"> · </span><Button asChild variant="link"><Link to="/browse">Browse by category</Link></Button></div>
      <div className="how-it-works">
        <p className="glance-caption">Five steps for every new product or vendor request</p>
        <div className="how-tiles">{howItWorks.map(s => <div key={s.label} className={`how-tile question-hue-${s.hue}`}><span className="glance-label">{s.label}</span><strong>{s.title}</strong><p>{s.body}</p></div>)}</div>
        <div className="how-equation">
          <div className="how-eq-tile question-hue-1"><span className="glance-label">From OrthoParity</span><strong>Their public record</strong></div>
          <span className="how-eq-op">+</span>
          <div className="how-eq-tile question-hue-5"><span className="glance-label">From you, kept private</span><strong>Your own pricing</strong></div>
          <span className="how-eq-op">=</span>
          <div className="how-eq-tile how-eq-result"><span className="glance-label">At the table</span><strong>Leverage</strong></div>
        </div>
        <p className="how-equation-note">OrthoParity never asks for your prices or your data. You bring them to the table, not to the website.</p>
      </div>
      <div className="home-about-tiles auto-rows-fr"><div><strong>{coverage?.devices.toLocaleString('en-US') ?? '…'}</strong><p>orthopedic devices cleared or approved by FDA, {coverage?.first ?? '…'} to {coverage?.last ?? '…'}</p></div><div><strong>{coverage?.count.toLocaleString('en-US') ?? '…'}</strong><p>orthopedic companies, counted by parent company</p></div><div><strong>10</strong><p className="text-sm!">public sources: FDA 510(k)s, FDA approvals (PMA and HDE), GUDID, recalls, adverse event reports (MAUDE), establishment registrations, and inspections and warning letters; CMS Open Payments, Medicare hospital payments and Medicare add-on payments</p></div></div>
      <p className="section-caption home-about-note">Every answer traces to a public record.</p>
    </section>}
    {selected ? vendorMode ? <ClientOnly fallback={<PublicRecordLoading />}><Suspense fallback={<PublicRecordLoading />}>{comparing && v ? <VendorComparePage v={v} compare={compare ?? ''} meta={meta} onCompare={value => void navigate({to:'/',search:prev => ({...prev,compare:value})})} onBack={() => void navigate({to:'/',search:prev => ({...prev,compare:undefined})})} /> : <VendorWorkspace v={v} compare={compare} view={view} onView={setView} from={from || undefined} meta={meta} onRedirect={(to, original) => void navigate(redirectNavigation(to, original, view))} onDismiss={() => void navigate({to:'/', search: prev => ({...prev, from: undefined}), replace:true, resetScroll:false})} onCompare={value => void navigate({to:'/',search:prev => ({...prev,compare:value})})} />}</Suspense></ClientOnly> : part && !k ? <PartResults part={part} /> : comparing && k ? <ProductComparePage k={k} compare={rawCompare} meta={meta} onChange={others => void navigate({to:'/', search:prev => ({...prev, compare: others.join(',')}), replace:true, resetScroll:false})} onBack={() => void navigate({to:'/', search:prev => ({...prev, compare:undefined})})} /> : <ProductResult key={k} k={k ?? ''} notice={part && k ? <PartNote part={part} k={k} /> : undefined} compare={compare} view={view} meta={meta} onView={setView} onCompare={value => void navigate({to:'/', search:prev => ({...prev, compare:value})})} /> : null}
  </>;
}
