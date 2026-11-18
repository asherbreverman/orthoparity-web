import { ClientOnly, createFileRoute, useNavigate } from '@tanstack/react-router';
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
import { fallbackVendorCoverage } from '@/lib/vendor-coverage';
import type { View } from '@/lib/signals';
import { StoryReveal } from '@/components/story-shared';
const VendorWorkspace = lazy(() => import('@/components/vendor-workspace').then(m => ({default: m.VendorWorkspace})));
export const Route = createFileRoute('/')({
  validateSearch: zodValidator(z.object({k: fallback(z.string(), '').optional(), v: fallback(z.string(), '').optional(), compare: fallback(z.string(), '').optional(), own: fallback(z.string(), '').optional(), mode: fallback(z.string(), '').optional(), view: fallback(z.string(), '').optional()})),
  head: () => ({ meta: [{ title: benchmarkTitle }, { name: 'description', content: benchmarkDescription }, { property: 'og:title', content: benchmarkTitle }, { property: 'og:description', content: benchmarkDescription }, { property: 'og:type', content: 'website' }, { property: 'og:url', content: benchmarkOrigin + '/' }, { property: 'og:image', content: new URL(shareImage.url, benchmarkOrigin).href }, { name: 'twitter:image', content: new URL(shareImage.url, benchmarkOrigin).href }, { name: 'twitter:card', content: 'summary_large_image' }], links: [{ rel: 'canonical', href: benchmarkOrigin + '/' }] }),
  component: DeviceBrief,
});
function DeviceBrief() {
  const { k, v, compare, own, mode, view: viewParam } = Route.useSearch();
  const view: View = viewParam === 'analyst' ? 'analyst' : 'brief';
  const vendorMode = !!v || mode === 'vendor';
  const selected = !!k || !!v;
  const navigate = useNavigate();
  const { meta } = useRelease();
  const [coverage, setCoverage] = useState(fallbackVendorCoverage);
  useEffect(() => { let active = true; getVendorCoverage().then(data => { if (active) setCoverage(data); }).catch(() => {}); return () => { active = false; }; }, []);
  const setView = (next: View) => void navigate({ to: '/', search: prev => ({ ...prev, view: next === 'analyst' ? 'analyst' : undefined }), replace: true, resetScroll: false });
  return <>
    <section className={`identify-step ${selected ? 'result-search' : 'home-hero'}`}>
      {!selected && <><h1>Every implant decision, on the same page.</h1><p>Free benchmarks for orthopedic devices and vendors, built from public FDA and CMS data.</p></>}
      <div className="mode-tabs" role="tablist" aria-label="Benchmark mode"><Button role="tab" aria-selected={!vendorMode} variant="ghost" onClick={() => void navigate({to:'/',search:{}})}>Product</Button><Button role="tab" aria-selected={vendorMode} variant="ghost" onClick={() => void navigate({to:'/',search:{mode:'vendor'}})}>Vendor</Button></div>
      {vendorMode ? <VendorSearch key={v ?? 'vendor'} onSelect={row => void navigate({to:'/',search:{v:row.vendor_id, view: view === 'analyst' ? 'analyst' : undefined}})} /> : <DeviceSearch resetKey={k ?? ''} onSelect={row => void navigate({ to: '/', search: { k: row.knumber, view: view === 'analyst' ? 'analyst' : undefined } })} />}
      <p className="coverage-line">{vendorMode ? <>Search by orthopedic vendor company name. Covers {coverage.count.toLocaleString('en-US')} orthopedic vendors with 510(k) clearances from {coverage.first} to {coverage.last}.</> : <>Search by 510(k) number, product name or company. Covers {meta.starting_set_clearances ? Number(meta.starting_set_clearances).toLocaleString('en-US') : '—'} orthopedic 510(k) clearances from 1976 to 2026.</>}</p>
    </section>
    {selected ? vendorMode ? <ClientOnly><Suspense fallback={<Status busy />}><VendorWorkspace v={v} compare={compare} view={view} onView={setView} mode={own === 'current' ? 'current' : 'pit'} meta={meta} onOwnership={m => void navigate({to:'/',search: prev => ({...prev,own:m === 'current' ? 'current' : undefined}), resetScroll: false})} onCompare={value => void navigate({to:'/',search:prev => ({...prev,compare:value}), resetScroll: false})} /></Suspense></ClientOnly> : <ProductResult key={k} k={k ?? ''} view={view} meta={meta} onView={setView} /> : <div className="home-story">
      {[['Is it new?', 'See what FDA cleared it against, and how far back the line goes.'],['What else does this job?', 'Every company with a cleared device in the same category.'],['What should we ask?', 'Plain-English questions drawn from FDA and CMS records, ready for your committee.']].map(([title,text])=><section className="home-beat" key={title}><StoryReveal><h2>{title}</h2><p>{text}</p></StoryReveal></section>)}
      <section className="home-beat"><StoryReveal><h2>Built on public data. Clear about its limits.</h2><p>Public FDA and CMS records provide the benchmarks. Their sources and limitations stay with the evidence.</p><Button variant="link" onClick={()=>document.querySelector<HTMLButtonElement>('.benchmark-footer button')?.click()}>About and limitations ›</Button></StoryReveal></section>
    </div>}
  </>;
}
