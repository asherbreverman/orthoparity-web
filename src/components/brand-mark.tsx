import { logoContents } from '@/lib/benchmark-brand';

export function BrandMark() {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="OrthoParity" width="32" height="32" className="brand-tile" dangerouslySetInnerHTML={{ __html: logoContents }} />;
}