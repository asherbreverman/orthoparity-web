import { logoContents } from '@/lib/benchmark-brand';

// No tile, border or shadow: currentColor lets the mark follow the theme (near-black in light,
// white in dark) beside the unchanged wordmark.
export function BrandMark() {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="OrthoParity" width="32" height="32" className="brand-mark" dangerouslySetInnerHTML={{ __html: logoContents }} />;
}
