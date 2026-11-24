import { ClientOnly, createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { fallback, zodValidator } from '@tanstack/zod-adapter';
import { lazy, Suspense, useEffect, useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { publicPageOptions } from '@/lib/page-queries';
import { pageSubject, previewMetadata } from '@/lib/page-preview';
import { ProcedureError, ProcedureNotFound } from '@/components/procedure-shared';
import { benchmarkOrigin } from '@/lib/benchmark-brand';
import shareImage from '@/assets/orthoparity-share.png.asset.json';
import { DeviceSearch, PublicRecordLoading, useRelease } from '@/components/reviewer-shared';
import { PartComparePage, PartNote, PartResults } from '@/components/part-results';
import { getVendorCoverage } from '@/lib/predicate-data';
import { VendorSearch } from '@/components/vendor-search';
import { ProductResult } from '@/components/product-result';
import { ProductComparePage, VendorComparePage } from '@/components/compare-pages';
import type { VendorCoverage } from '@/lib/vendor-coverage';
import type { View } from '@/lib/signals';
import { redirectNavigation } from '@/lib/vendor-data';
import { DockedSearch, HomeLanding, searchLevel } from '@/components/benchmark-navigation';
import { normalizeDeviceNumber } from '@/lib/fda-device';
const VendorWorkspace = lazy(() => import('@/components/vendor-workspace').then(m => ({default: m.VendorWorkspace})));

export const Route = createFileRoute('/')({
  staticData: { sitemap: true },
  validateSearch: zodValidator(z.object({k: fallback(z.string(), '').optional(), v: fallback(z.string(), '').optional(), compare: fallback(z.string(), '').optional(), from: fallback(z.string(), '').optional(), mode: fallback(z.string(), '').optional(), level: fallback(z.string(), '').optional(), view: fallback(z.string(), '').optional(), part: fallback(z.string(), '').optional(), q: fallback(z.string(), '').optional()})),
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
    const title = part ? (match.search.compare !== undefined ? 'Compare parts | OrthoParity' : `Part number ${part} | OrthoParity`) : base.title;
    return { meta: [{ title }, { name: 'description', content: description }, { property: 'og:title', content: title }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { property: 'og:url', content: url }, { property: 'og:image', content: new URL(shareImage.url, benchmarkOrigin).href }, { name: 'twitter:image', content: new URL(shareImage.url, benchmarkOrigin).href }, { name: 'twitter:title', content: title }, { name: 'twitter:description', content: description }, { name: 'twitter:card', content: 'summary_large_image' }], links: [{ rel: 'canonical', href: url }] };
  },
  component: DeviceBrief,
});

function DeviceBrief() {
  const { k: rawK, v, compare: rawCompare, from, mode, level: levelParam, view: viewParam, part, q } = Route.useSearch();
  const k = normalizeDeviceNumber(rawK ?? '') ?? rawK;
  const comparing = rawCompare !== undefined;
  const compare = rawCompare;
  const { data: initial } = useSuspenseQuery(publicPageOptions(pageSubject({ k, v })));
  const view: View = viewParam === 'analyst' ? 'analyst' : 'brief';
  const level = searchLevel(levelParam ?? (mode === 'vendor' ? 'company' : undefined));
  const vendorMode = !!v || mode === 'vendor' || level === 'company';
  const selected = !!k || !!v || !!part;
  const navigate = useNavigate();
  const { meta } = useRelease(initial.meta ?? undefined);
  const [coverage, setCoverage] = useState<VendorCoverage | null>(initial.coverage);
  useEffect(() => { if (initial.coverage) { setCoverage(initial.coverage); return; } let active = true; getVendorCoverage().then(data => { if (active) setCoverage(data); }).catch(() => {}); return () => { active = false; }; }, [initial.coverage]);
  const setView = (next: View) => void navigate({ to: '/', search: prev => ({ ...prev, view: next === 'analyst' ? 'analyst' : undefined }), replace: true, resetScroll: false });
  const search = vendorMode ? <VendorSearch key={v ?? 'vendor'} initialValue={v ?? ''} onSelect={row => void navigate({to:'/',search:{v:row.vendor_id, from: row.via_vendor_id ?? undefined, view: view === 'analyst' ? 'analyst' : undefined}, viewTransition: !window.matchMedia('(prefers-reduced-motion: reduce)').matches})} /> : <DeviceSearch resetKey={k ?? ''} onSelect={(row, partNumber) => void navigate({ to: '/', search: { k: row.knumber, part: partNumber, view: view === 'analyst' ? 'analyst' : undefined }, viewTransition: !window.matchMedia('(prefers-reduced-motion: reduce)').matches })} />;

  return <>
    {!selected && <HomeLanding level={level} compare={comparing} initialQuery={q ?? ''} coverage={coverage} meta={meta} />}
    {selected ? vendorMode ? <ClientOnly fallback={<PublicRecordLoading />}><Suspense fallback={<PublicRecordLoading />}>{comparing && v ? <VendorComparePage v={v} compare={compare ?? ''} meta={meta} onCompare={value => void navigate({to:'/',search:prev => ({...prev,compare:value})})} onBack={() => void navigate({to:'/',search:prev => ({...prev,compare:undefined})})} /> : <VendorWorkspace v={v} compare={compare} view={view} onView={setView} from={from || undefined} meta={meta} onRedirect={(to, original) => void navigate(redirectNavigation(to, original, view))} onDismiss={() => void navigate({to:'/', search: prev => ({...prev, from: undefined}), replace:true, resetScroll:false})} onCompare={value => void navigate({to:'/',search:prev => ({...prev,compare:value})})} />}</Suspense></ClientOnly> : part && !k ? comparing ? <PartComparePage part={part} onChange={parts => void navigate({ to: '/', search: prev => ({ ...prev, part: parts.join(','), compare: '' }), replace: true, resetScroll: false })} /> : <PartResults part={part} /> : comparing && k ? <ProductComparePage k={k} compare={rawCompare} meta={meta} onChange={others => void navigate({to:'/', search:prev => ({...prev, compare: others.join(',')}), replace:true, resetScroll:false})} onBack={() => void navigate({to:'/', search:prev => ({...prev, compare:undefined})})} /> : <ProductResult key={k} k={k ?? ''} notice={part && k ? <PartNote part={part} k={k} /> : undefined} compare={compare} view={view} meta={meta} onView={setView} onCompare={value => void navigate({to:'/', search:prev => ({...prev, compare:value})})} /> : null}
    {selected && <DockedSearch>{search}</DockedSearch>}
  </>;
}
