import { createFileRoute, notFound, redirect } from '@tanstack/react-router';
import { normalizeDeviceNumber } from '@/lib/fda-device';
import { pageHead } from '@/components/reviewer-shared';
import { ProcedureNotFound } from '@/components/procedure-shared';

export const Route = createFileRoute('/device/$id')({
  staticData: { sitemap: false },
  beforeLoad: ({ params }) => {
    const k = normalizeDeviceNumber(params.id);
    if (!k) throw notFound();
    throw redirect({ to: '/', search: { k }, replace: true });
  },
  head: ({ params }) => pageHead(`FDA device ${normalizeDeviceNumber(params.id) ?? params.id}`, 'Public FDA device benchmarks, approval history and vendor questions from OrthoParity.'),
  notFoundComponent: ProcedureNotFound,
});