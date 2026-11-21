import { queryOptions } from '@tanstack/react-query';
import { getPublicPageData } from './page-data.functions';
import { emptyPageData, PAGE_CACHE_MS, type PageSubject } from './page-preview';

export const publicPageOptions = (subject: PageSubject) => queryOptions({
  queryKey: ['public-page', subject.k, subject.v],
  queryFn: () => getPublicPageData({ data: subject }).catch(() => emptyPageData()),
  staleTime: PAGE_CACHE_MS,
  gcTime: PAGE_CACHE_MS,
  retry: false,
});