import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { benchmarkOrigin } from '@/lib/benchmark-brand';
import { sitemapStaticPaths, sitemapXML } from '@/lib/sitemap';

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

  it('includes only the public home page in the sitemap with the www URL', () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const paths = sitemapStaticPaths(router);
    expect(paths).toEqual(['/']);
    const xml = sitemapXML(benchmarkOrigin, paths.map(path => ({ path })));
    expect(xml).toContain('<loc>https://www.orthoparity.com/</loc>');
    expect(xml).not.toContain('<lastmod>');
  });
});
