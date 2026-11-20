import { ClientOnly, createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { fallback, zodValidator } from '@tanstack/zod-adapter';
import { lazy, Suspense, useEffect, useState } from 'react';
import { benchmarkTitle, benchmarkDescription, benchmarkOrigin } from '@/lib/benchmark-brand';
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
export const Route = createFileRoute('/')({
  staticData: { sitemap: true },
  validateSearch: zodValidator(z.object({k: fallback(z.string(), '').optional(), v: fallback(z.string(), '').optional(), compare: fallback(z.string(), '').optional(), from: fallback(z.string(), '').optional(), mode: fallback(z.string(), '').optional(), view: fallback(z.string(), '').optional()})),
  head: () => ({ meta: [{ title: benchmarkTitle }, { name: 'description', content: benchmarkDescription }, { property: 'og:title', content: benchmarkTitle }, { property: 'og:description', content: benchmarkDescription }, { property: 'og:type', content: 'website' }, { property: 'og:url', content: benchmarkOrigin + '/' }, { property: 'og:image', content: new URL(shareImage.url, benchmarkOrigin).href }, { name: 'twitter:image', content: new URL(shareImage.url, benchmarkOrigin).href }, { name: 'twitter:card', content: 'summary_large_image' }], links: [{ rel: 'canonical', href: benchmarkOrigin + '/' }] }),
  component: DeviceBrief,
});
function DeviceBrief() {
  const { k, v, compare, from, mode, view: viewParam } = Route.useSearch();
  const view: View = viewParam === 'analyst' ? 'analyst' : 'brief';
  const vendorMode = !!v || mode === 'vendor';
  const selected = !!k || !!v;
  const navigate = useNavigate();
  const { meta } = useRelease();
  const [coverage, setCoverage] = useState<VendorCoverage | null>(null);
  useEffect(() => { let active = true; getVendorCoverage().then(data => { if (active) setCoverage(data); }).catch(() => {}); return () => { active = false; }; }, []);
  const setView = (next: View) => void navigate({ to: '/', search: prev => ({ ...prev, view: next === 'analyst' ? 'analyst' : undefined }), replace: true, resetScroll: false });
  const changeMode = (vendor: boolean) => void navigate({ to: '/', search: vendor ? { mode: 'vendor' } : {} });
  const search = vendorMode ? <VendorSearch key={v ?? 'vendor'} initialValue={v ?? ''} onSelect={row => void navigate({to:'/',search:{v:row.vendor_id, from: row.via_vendor_id ?? undefined, view: view === 'analyst' ? 'analyst' : undefined}, viewTransition: !window.matchMedia('(prefers-reduced-motion: reduce)').matches})} /> : <DeviceSearch resetKey={k ?? ''} onSelect={row => void navigate({ to: '/', search: { k: row.knumber, view: view === 'analyst' ? 'analyst' : undefined }, viewTransition: !window.matchMedia('(prefers-reduced-motion: reduce)').matches })} />;
  return <>
    {selected ? <DockedSearch>{search}</DockedSearch> : <section className="identify-step home-hero">
      <p className="home-tagline">Free, public FDA and CMS data on orthopedic devices and vendors, the same for everyone.</p>
      <ModeTabs vendor={vendorMode} onChange={changeMode} />
      <h1>{vendorMode ? 'Identify an orthopedic vendor to benchmark' : 'Identify an orthopedic device to benchmark'}</h1>
      <p>{vendorMode ? 'Search by vendor name and get a vendor brief: 11 questions, the evidence, and what to ask.' : 'Search by 510(k) number, product name or company and get a decision brief: 12 questions, the evidence, and what to ask the vendor.'}</p>
      {search}
      <div className="try-examples"><span>Try:</span>{vendorMode ? vendorExamples.map(([label, id]) => <Button key={id} variant="secondary" size="sm" onClick={() => void navigate({to:'/',search:{v:id}})}>{label}</Button>) : productExamples.map(([label, id]) => <Button key={id} variant="secondary" size="sm" onClick={() => void navigate({to:'/',search:{k:id}})}>{label}</Button>)}</div>
      <div className="mb-6"><Button asChild variant="link"><Link to="/procedures">Or browse Medicare payments by procedure</Link></Button></div>
      <div className="home-about-tiles auto-rows-fr"><div><strong>{meta.starting_set_clearances ? Number(meta.starting_set_clearances).toLocaleString('en-US') : '…'}</strong><p>orthopedic 510(k) clearances, from {coverage?.first ?? '…'} to {coverage?.last ?? '…'}</p></div><div><strong>{coverage?.count.toLocaleString('en-US') ?? '…'}</strong><p>orthopedic companies with 510(k) clearances, counted by parent company</p></div><div><strong>9</strong><p className="text-sm!">public sources: FDA 510(k)s, GUDID, recalls, adverse event reports (MAUDE), establishment registrations, and inspections and warning letters; CMS Open Payments, Medicare hospital payments and Medicare add-on payments</p></div></div>
    </section>}
    {selected ? vendorMode ? <ClientOnly><Suspense fallback={<Status busy />}><VendorWorkspace v={v} compare={compare} view={view} onView={setView} from={from || undefined} meta={meta} onRedirect={(to, original) => void navigate(redirectNavigation(to, original, view))} onDismiss={() => void navigate({to:'/', search: prev => ({...prev, from: undefined}), replace:true, resetScroll:false})} onCompare={value => void navigate({to:'/',search:prev => ({...prev,compare:value || undefined}), resetScroll: false})} /></Suspense></ClientOnly> : <ProductResult key={k} k={k ?? ''} compare={compare} view={view} meta={meta} onView={setView} onCompare={value => void navigate({to:'/', search:prev => ({...prev, compare:value || undefined}), resetScroll:false})} /> : null}
  </>;
}
