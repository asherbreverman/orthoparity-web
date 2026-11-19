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
  const [example, setExample] = useState('');
  const [coverage, setCoverage] = useState<VendorCoverage | null>(null);
  useEffect(() => { let active = true; getVendorCoverage().then(data => { if (active) setCoverage(data); }).catch(() => {}); return () => { active = false; }; }, []);
  const setView = (next: View) => void navigate({ to: '/', search: prev => ({ ...prev, view: next === 'analyst' ? 'analyst' : undefined }), replace: true, resetScroll: false });
  const changeMode = (vendor: boolean) => void navigate({ to: '/', search: vendor ? { mode: 'vendor' } : {} });
  const search = vendorMode ? <VendorSearch key={v ?? 'vendor'} initialValue={v ?? example} onSelect={row => void navigate({to:'/',search:{v:row.vendor_id, from: row.via_vendor_id ?? undefined, view: view === 'analyst' ? 'analyst' : undefined}, viewTransition: !window.matchMedia('(prefers-reduced-motion: reduce)').matches})} /> : <DeviceSearch resetKey={k ?? ''} onSelect={row => void navigate({ to: '/', search: { k: row.knumber, view: view === 'analyst' ? 'analyst' : undefined }, viewTransition: !window.matchMedia('(prefers-reduced-motion: reduce)').matches })} />;
  return <>
    {selected ? <DockedSearch>{search}</DockedSearch> : <section className="identify-step home-hero">
      <ModeTabs vendor={vendorMode} onChange={changeMode} />
      <h1>{vendorMode ? 'Identify an orthopedic vendor to benchmark' : 'Identify an orthopedic device to benchmark'}</h1>
      <p>{vendorMode ? 'Search by vendor name and get a vendor brief: seven questions, the evidence, and what to ask.' : 'Search by 510(k) number, product name or company and get a decision brief: six questions, the evidence, and what to ask the vendor.'}</p>
      {search}
      <div className="try-examples"><span>Try:</span><Button variant="secondary" size="sm" onClick={() => void navigate({to:'/',search:{k:'K140881'}})}>ATTUNE knee (K140881)</Button><Button variant="secondary" size="sm" onClick={() => void navigate({to:'/',search:{k:'K203153'}})}>CREO spine system (K203153)</Button><Button variant="secondary" size="sm" onClick={() => { setExample('Globus Medical'); void navigate({to:'/',search:{mode:'vendor'}}); }}>Globus Medical</Button></div>
      <div className="mb-6"><Button asChild variant="link"><Link to="/procedures">Or browse Medicare payments by procedure</Link></Button></div>
      <div className="home-about-tiles"><div><strong>{meta.starting_set_clearances ? Number(meta.starting_set_clearances).toLocaleString('en-US') : '—'}</strong><p>orthopedic 510(k) clearances, from {coverage?.first ?? '—'} to {coverage?.last ?? '—'}</p></div><div><strong>{coverage?.count.toLocaleString('en-US') ?? '—'}</strong><p>orthopedic vendors with 510(k) clearances</p></div><div><strong>5</strong><p>public sources: FDA 510(k) summaries, FDA GUDID, FDA recalls, CMS Open Payments and CMS Medicare hospital payments</p></div></div>
    </section>}
    {selected ? vendorMode ? <ClientOnly><Suspense fallback={<Status busy />}><VendorWorkspace v={v} compare={compare} view={view} onView={setView} from={from || undefined} meta={meta} onRedirect={(to, original) => void navigate(redirectNavigation(to, original, view))} onDismiss={() => void navigate({to:'/', search: prev => ({...prev, from: undefined}), replace:true, resetScroll:false})} onCompare={value => void navigate({to:'/',search:prev => ({...prev,compare:value}), resetScroll: false})} /></Suspense></ClientOnly> : <ProductResult key={k} k={k ?? ''} view={view} meta={meta} onView={setView} /> : null}
  </>;
}
