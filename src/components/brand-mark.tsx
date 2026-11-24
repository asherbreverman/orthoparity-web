import { logoContents } from '@/lib/benchmark-brand';

export function BrandMark() {
  return <svg width="26" height="26" viewBox="0 0 26 26" className="brand-mark" aria-hidden="true" dangerouslySetInnerHTML={{ __html: logoContents }} />;
}
