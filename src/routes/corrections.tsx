import { createFileRoute } from '@tanstack/react-router';
import { procedureHead } from '@/lib/procedure-queries';
import { ProcedurePending, ProcedureError, ProcedureNotFound } from '@/components/procedure-shared';
import { CorrectionsPage, correctionsOptions } from '@/components/site-pages';

export const Route = createFileRoute('/corrections')({
  staticData: {sitemap: true},
  loader: ({context}) => context.queryClient.ensureQueryData(correctionsOptions()),
  head: () => procedureHead('Corrections | OrthoParity', 'Every time something on OrthoParity was wrong or misleading: what was wrong, what changed and which pages it affected, with the date.', '/corrections'),
  pendingMs: 0, pendingComponent: ProcedurePending, errorComponent: ProcedureError, notFoundComponent: ProcedureNotFound,
  component: CorrectionsPage,
});
