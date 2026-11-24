import { createFileRoute } from '@tanstack/react-router';
import { getRouterInstance } from '@tanstack/react-start';
import { benchmarkOrigin } from '@/lib/benchmark-brand';
import { sitemapStaticPaths, sitemapXML, sitemapPathForLocation } from '@/lib/sitemap';

export const Route = createFileRoute('/sitemap.xml')({
  staticData: { sitemap: false },
  server: {
    handlers: {
      GET: async () => {
        const router = await getRouterInstance();
        const entries = sitemapStaticPaths(router).map(path => ({ path }));
        try {
          const { readPublicProcedurePaths } = await import('@/lib/page-data.server');
          for (const path of await readPublicProcedurePaths()) {
            const included = sitemapPathForLocation(router, { pathname: path, publicHref: path }, '/procedures_/$familyId');
            if (included) entries.push({ path: included });
          }
          const { readPublicDirectoryPaths } = await import('@/lib/page-data.server');
          for (const path of await readPublicDirectoryPaths()) {
            const included = sitemapPathForLocation(router, { pathname: path, publicHref: path }, '/browse_/$code');
            if (included) entries.push({ path: included });
          }
        } catch {
          return new Response('The public procedure or category index is temporarily unavailable.', { status: 503, headers: { 'Cache-Control': 'no-store' } });
        }
        if (entries.length === 0) {
          return new Response('No pages are included in this sitemap.', {
            status: 404, headers: { 'Cache-Control': 'no-store' },
          });
        }
        return new Response(sitemapXML(benchmarkOrigin, entries), {
          headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' },
        });
      },
    },
  },
});