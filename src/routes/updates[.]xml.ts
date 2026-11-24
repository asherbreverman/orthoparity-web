import { createFileRoute } from '@tanstack/react-router';
import { benchmarkOrigin } from '@/lib/benchmark-brand';
import { releaseRss, type ReleaseNote } from '@/lib/site-log';

export const Route = createFileRoute('/updates.xml')({
  staticData: { sitemap: false },
  server: {
    handlers: {
      GET: async () => {
        try {
          const { readPublicReleaseNotes } = await import('@/lib/page-data.server');
          const rows = await readPublicReleaseNotes() as ReleaseNote[];
          return new Response(releaseRss(benchmarkOrigin.replace(/\/$/, ''), rows), { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
        } catch {
          return new Response('The release notes feed is temporarily unavailable.', { status: 503, headers: { 'Cache-Control': 'no-store' } });
        }
      },
    },
  },
});
