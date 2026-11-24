import { createFileRoute } from '@tanstack/react-router';
import { directoryIndexOptions } from '@/lib/directory-queries';
import { procedureHead } from '@/lib/procedure-queries';
import { pageTitle } from '@/lib/benchmark-brand';
import { ProcedurePending, ProcedureError } from '@/components/procedure-shared';
import { DirectoryIndexPage } from '@/components/directory-pages';

export const Route = createFileRoute('/browse')({
  staticData: {sitemap: true},
  loader: ({context}) => context.queryClient.ensureQueryData(directoryIndexOptions()),
  head: () => procedureHead(pageTitle('Browse orthopedic devices by category'), 'Every orthopedic FDA 510(k), De Novo, PMA and HDE record, grouped by FDA product code, with companies counted by parent company.', '/browse'),
  pendingMs: 0,
  pendingComponent: ProcedurePending,
  errorComponent: ProcedureError,
  component: DirectoryIndexPage,
});
