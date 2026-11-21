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
import { DeviceSearch, Status, useRelease } from '@/components/reviewer-shared';
import { getVendorCoverage } from '@/lib/predicate-data';
import { VendorSearch } from '@/components/vendor-search';
import { ProductResult } from '@/components/product-result';
import type { VendorCoverage } from '@/lib/vendor-coverage';
import type { View } from '@/lib/signals';
import { redirectNavigation } from '@/lib/vendor-data';
import { DockedSearch, ModeTabs } from '@/components/benchmark-navigation';
const VendorWorkspace = lazy(() => import('@/components/vendor-workspace').then(m => ({default: m.VendorWorkspace})));
const productExamples: [string, string][] = [['ATTUNE knee (K140881)', 'K140881'], ['ACTIS hip (K150862)', 'K150862'], ['ExcelsiusGPS spine robot (K171651)', 'K171651'], ['Equinoxe reverse shoulder (K063569)', 'K063569'], ['Smith+Nephew suture anchors (K151105)', 'K151105']];
const vendorExamples: [string, string][] = [['Stryker', 'stryker'], ['Johnson & Johnson (DePuy Synthes)', 'jnj_depuy_synthes'], ['Zimmer Biomet', 'zimmer_biomet'], ['Medtronic', 'medtronic'], ['Smith+Nephew', 'smith_nephew']];
const howItWorks = [
  { hue: 1, label: 'Step 1', title: 'Start with the predicate', body: "What the vendor told FDA its device is equivalent to." },
  { hue: 4, label: 'Step 2', title: 'Find the equivalents', body: 'Every device sharing that predicate or product code.' },
  { hue: 2, label: 'Step 3', title: 'Compare the risk', body: 'Recalls, adverse events and inspections next to your current vendors.' },
  { hue: 5, label: 'Step 4', title: 'Make them compete', body: 'Novel or commodity, and who else already fills the need.' },
  { hue: 6, label: 'Step 5', title: 'Turn questions into leverage', body: 'Hard questions, backed by data, in a printable worksheet.' },
];
export const Route = createFileRoute('/')({
  staticData: { sitemap: true },
  validateSearch: zodValidator(z.object({k: fallback(z.string(), '').optional(), v: fallback(z.string(), '').optional(), compare: fallback(z.string(), '').optional(), from: fallback(z.string(), '').optional(), mode: fallback(z.string(), '').optional(), view: fallback(z.string(), '').optional()})),
  loaderDeps: ({ search }) => pageSubject(search),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(publicPageOptions(deps)),
  errorComponent: ProcedureError,
  notFoundComponent: ProcedureNotFound,
  head: ({ loaderData, match }) => {
    const { title, description, url } = previewMetadata(match.loaderDeps, loaderData?.preview ?? null);
    return { meta: [{ title }, { name: 'description', content: description }, { property: 'og:title', content: title }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { property: 'og:url', content: url }, { property: 'og:image', content: new URL(shareImage.url, benchmarkOrigin).href }, { name: 'twitter:image', content: new URL(shareImage.url, benchmarkOrigin).href }, { name: 'twitter:title', content: title }, { name: 'twitter:description', content: description }, { name: 'twitter:card', content: 'summary_large_image' }], links: [{ rel: 'canonical', href: url }] };
  },
  component: DeviceBrief,
});
function DeviceBrief() {
  const { k, v, compare, from, mode, view: viewParam } = Route.useSearch();
  const { data: initial } = useSuspenseQuery(publicPageOptions(pageSubject({ k, v })));
  const view: View = viewParam === 'analyst' ? 'analyst' : 'brief';
  const vendorMode = !!v || mode === 'vendor';
  const selected = !!k || !!v;
  const navigate = useNavigate();
  const { meta } = useRelease(initial.meta ?? undefined);
  const [coverage, setCoverage] = useState<VendorCoverage | null>(initial.coverage);
  useEffect(() => { if (initial.coverage) { setCoverage(initial.coverage); return; } let active = true; getVendorCoverage().then(data => { if (active) setCoverage(data); }).catch(() => {}); return () => { active = false; }; }, [initial.coverage]);
  const setView = (next: View) => void navigate({ to: '/', search: prev => ({ ...prev, view: next === 'analyst' ? 'analyst' : undefined }), replace: true, resetScroll: false });
  const changeMode = (vendor: boolean) => void navigate({ to: '/', search: vendor ? { mode: 'vendor' } : {} });
  const search = vendorMode ? <VendorSearch key={v ?? 'vendor'} initialValue={v ?? ''} onSelect={row => void navigate({to:'/',search:{v:row.vendor_id, from: row.via_vendor_id ?? undefined, view: view === 'analyst' ? 'analyst' : undefined}, viewTransition: !window.matchMedia('(prefers-reduced-motion: reduce)').matches})} /> : <DeviceSearch resetKey={k ?? ''} onSelect={row => void navigate({ to: '/', search: { k: row.knumber, view: view === 'analyst' ? 'analyst' : undefined }, viewTransition: !window.matchMedia('(prefers-reduced-motion: reduce)').matches })} />;
  return <>
    {selected ? <DockedSearch>{search}</DockedSearch> : <section className="identify-step home-hero">
      <p className="home-tagline">Free and open source, for ASCs and IDNs. Built from public FDA and CMS data.</p>
      <ModeTabs vendor={vendorMode} onChange={changeMode} />
      <h1>Know what the vendor knows.</h1>
      <p>{vendorMode ? 'Search any orthopedic company. See its portfolio, risk record and competitors, rolled up to the parent company, without a GPO.' : 'Search any orthopedic product by 510(k) number, name or company. See its predicate, its equivalents, its risk record and the questions to ask, without a GPO.'}</p>
      {search}
      <div className="try-examples"><span>Try:</span>{vendorMode ? vendorExamples.map(([label, id]) => <Button key={id} variant="secondary" size="sm" onClick={() => void navigate({to:'/',search:{v:id}})}>{label}</Button>) : productExamples.map(([label, id]) => <Button key={id} variant="secondary" size="sm" onClick={() => void navigate({to:'/',search:{k:id}})}>{label}</Button>)}</div>
      <div className="mb-6"><Button asChild variant="link"><Link to="/procedures">Or browse Medicare payments by procedure</Link></Button></div>
      <div className="how-it-works">
        <p className="glance-caption">How it works</p>
        <div className="how-tiles">{howItWorks.map(s => <div key={s.label} className={`how-tile question-hue-${s.hue}`}><span className="glance-label">{s.label}</span><strong>{s.title}</strong><p>{s.body}</p></div>)}</div>
        <p className="how-note">All from public FDA and CMS data. No GPO required.</p>
      </div>
      <div className="home-about-tiles auto-rows-fr"><div><strong>{meta.starting_set_clearances ? Number(meta.starting_set_clearances).toLocaleString('en-US') : '…'}</strong><p>orthopedic 510(k) clearances, from {coverage?.first ?? '…'} to {coverage?.last ?? '…'}</p></div><div><strong>{coverage?.count.toLocaleString('en-US') ?? '…'}</strong><p>orthopedic companies with 510(k) clearances, counted by parent company</p></div><div><strong>9</strong><p className="text-sm!">public sources: FDA 510(k)s, GUDID, recalls, adverse event reports (MAUDE), establishment registrations, and inspections and warning letters; CMS Open Payments, Medicare hospital payments and Medicare add-on payments</p></div></div>
    </section>}
    {selected ? vendorMode ? <ClientOnly><Suspense fallback={<Status busy />}><VendorWorkspace v={v} compare={compare} view={view} onView={setView} from={from || undefined} meta={meta} onRedirect={(to, original) => void navigate(redirectNavigation(to, original, view))} onDismiss={() => void navigate({to:'/', search: prev => ({...prev, from: undefined}), replace:true, resetScroll:false})} onCompare={value => void navigate({to:'/',search:prev => ({...prev,compare:value || undefined}), resetScroll: false})} /></Suspense></ClientOnly> : <ProductResult key={k} k={k ?? ''} compare={compare} view={view} meta={meta} onView={setView} onCompare={value => void navigate({to:'/', search:prev => ({...prev, compare:value || undefined}), resetScroll:false})} /> : null}
  </>;
}
