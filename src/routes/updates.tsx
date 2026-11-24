import { createFileRoute } from '@tanstack/react-router';
import { procedureHead } from '@/lib/procedure-queries';
import { ProcedurePending, ProcedureError, ProcedureNotFound } from '@/components/procedure-shared';
import { UpdatesPage, releaseNotesOptions } from '@/components/site-pages';

export const Route = createFileRoute('/updates')({
  staticData: {sitemap: true},
  loader: ({context}) => context.queryClient.ensureQueryData(releaseNotesOptions()),
  head: () => procedureHead('Release notes | OrthoParity', 'What changed on OrthoParity and in each data release.', '/updates'),
  pendingMs: 0, pendingComponent: ProcedurePending, errorComponent: ProcedureError, notFoundComponent: ProcedureNotFound,
  component: UpdatesPage,
});
