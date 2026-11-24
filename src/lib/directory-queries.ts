import { queryOptions } from '@tanstack/react-query';
import { getDirectory, getDirectoryIndex } from './predicate-data';

export const directoryIndexOptions = () => queryOptions({queryKey: ['directory-index'], queryFn: getDirectoryIndex, staleTime: Infinity, retry: false});
export const directoryOptions = (code: string) => queryOptions({queryKey: ['directory', code.trim().toUpperCase()], queryFn: () => getDirectory(code), staleTime: Infinity, retry: false});
