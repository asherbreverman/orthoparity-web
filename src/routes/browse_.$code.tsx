import { createFileRoute, notFound } from '@tanstack/react-router';
import { directoryOptions } from '@/lib/directory-queries';
import { directoryTitle } from '@/lib/directory';
import { procedureHead } from '@/lib/procedure-queries';
import { pageTitle } from '@/lib/benchmark-brand';
import { ProcedurePending, ProcedureError } from '@/components/procedure-shared';
import { DirectoryCodePage, DirectoryNotFound } from '@/components/directory-pages';

export const Route = createFileRoute('/browse_/$code')({
  staticData: {sitemap: true},
  loader: async ({context, params}) => {const detail = await context.queryClient.ensureQueryData(directoryOptions(params.code)); if (!detail.found) throw notFound({data: detail.note}); return detail;},
  head: ({loaderData, params}) => {
    const head = procedureHead(pageTitle(directoryTitle(loaderData, params.code)), loaderData?.found ? `Every FDA record in product code ${loaderData.product_code.product_code}: ${loaderData.totals.products.toLocaleString('en-US')} records from ${loaderData.totals.companies.toLocaleString('en-US')} companies.` : 'Orthopedic FDA records by product code.', `/browse/${encodeURIComponent(params.code)}`);
    return loaderData ? head : {...head, meta: [...head.meta, {name: 'robots', content: 'noindex'}]};
  },
  pendingMs: 0,
  pendingComponent: ProcedurePending,
  errorComponent: ProcedureError,
  notFoundComponent: DirectoryNotFound,
  component: DirectoryCodePage,
});
