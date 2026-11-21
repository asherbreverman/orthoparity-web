import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { benchmarkOrigin, pageTitle, benchmarkTitle } from '@/lib/benchmark-brand';
import { pageHead } from '@/components/reviewer-shared';
import { Route as ProceduresIndex } from '@/routes/procedures';
import { Route as ProcedureDetail } from '@/routes/procedures_.$familyId';
import { sitemapStaticPaths, sitemapXML, sitemapPathForLocation } from '@/lib/sitemap';

type HeadMeta = { meta?: { title?: string }[] };
const titleOf = (head: unknown, ctx: unknown) => (head as ((ctx: unknown) => HeadMeta) | undefined)?.(ctx)?.meta?.find(m => 'title' in m)?.title;

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it('uses the www public origin', () => {
    expect(benchmarkOrigin).toBe('https://www.orthoparity.com');
  });

  it('includes the public home and procedure index in the sitemap with the www URL', () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const paths = sitemapStaticPaths(router);
    expect(paths).toEqual(['/', '/privacy', '/procedures', '/terms']);
    const xml = sitemapXML(benchmarkOrigin, paths.map(path => ({ path })));
    expect(xml).toContain('<loc>https://www.orthoparity.com/</loc>');
    expect(xml).toContain('<loc>https://www.orthoparity.com/procedures</loc>');
    expect(xml).not.toContain('<lastmod>');
  });

  it('includes real procedure detail locations but not invented routes', () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const path = '/procedures/hip_knee_replacement';
    expect(sitemapPathForLocation(router, { pathname: path, publicHref: path }, '/procedures_/$familyId')).toBe(path);
    expect(sitemapPathForLocation(router, { pathname: '/internal', publicHref: '/internal' }, '/procedures_/$familyId')).toBeUndefined();
  });

  it('matches a procedure detail as a separate leaf under the root shell', () => {
    const router = createRouter({routeTree, context: {queryClient: new QueryClient()}});
    expect(router.matchRoutes('/procedures/hip_knee_replacement').map(m => m.routeId)).toEqual(['__root__', '/procedures_/$familyId']);
  });

  it('puts " | OrthoParity" at the end of every page tab title', () => {
    expect(pageTitle('Medicare payments by procedure')).toBe('Medicare payments by procedure | OrthoParity');
    expect(benchmarkTitle).toBe('Orthopedic device and vendor benchmarks | OrthoParity');
    expect(pageHead('LANDMARK Total Knee System', 'A device brief.').meta?.[0]?.title).toBe('LANDMARK Total Knee System | OrthoParity');
    expect(titleOf(ProceduresIndex.options.head, {})).toBe('Medicare payments by procedure | OrthoParity');
    expect(titleOf(ProcedureDetail.options.head, { loaderData: null, params: { familyId: 'not_a_family' } })).toBe('Procedure unavailable | OrthoParity');
    expect(titleOf(ProcedureDetail.options.head, { loaderData: { family: { name: 'Primary hip and knee replacement', description: 'd' } }, params: { familyId: 'hip_knee_replacement' } })).toBe('Primary hip and knee replacement: Medicare payments and device categories | OrthoParity');
  });
});
