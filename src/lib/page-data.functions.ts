import { createServerFn } from '@tanstack/react-start';
import { pageSubject } from './page-preview';

export const getPublicPageData = createServerFn({ method: 'GET' })
  .inputValidator((input: { k?: string; v?: string }) => pageSubject(input))
  .handler(async ({ data }) => {
    const { readPublicPageData } = await import('./page-data.server');
    return readPublicPageData(data);
  });