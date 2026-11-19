import { queryOptions } from '@tanstack/react-query';
import { getProcedure, getProcedureList } from './predicate-data';
import { benchmarkOrigin } from './benchmark-brand';
import shareImage from '@/assets/orthoparity-share.png.asset.json';

export const procedureListOptions = () => queryOptions({queryKey: ['procedures'], queryFn: getProcedureList, staleTime: Infinity, retry: false});
export const procedureOptions = (fid: string) => queryOptions({queryKey: ['procedure', fid, 100], queryFn: () => getProcedure(fid), staleTime: Infinity, retry: false});
export function procedureHead(title: string, description: string, path: string) {
  const url = new URL(path, benchmarkOrigin).href;
  const image = new URL(shareImage.url, benchmarkOrigin).href;
  return {meta: [{title}, {name: 'description', content: description}, {property: 'og:title', content: title}, {property: 'og:description', content: description}, {property: 'og:type', content: 'website'}, {property: 'og:url', content: url}, {property: 'og:image', content: image}, {name: 'twitter:title', content: title}, {name: 'twitter:description', content: description}, {name: 'twitter:card', content: 'summary_large_image'}, {name: 'twitter:image', content: image}], links: [{rel: 'canonical', href: url}]};
}