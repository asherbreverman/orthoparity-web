import { useEffect, useState } from 'react';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { BriefLink, PdfLink, Status, useRefetch } from './reviewer-shared';
import { getDeviceIndications } from '@/lib/predicate-data';
import type { DeviceIndications } from '@/lib/signals';
import type { DeviceOwner } from '@/lib/vendor-data';

function IndicationsQuote({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  return <><blockquote className={`ifu-quote ${expanded ? '' : 'clamped'}`}>{text}</blockquote><Button variant="link" size="sm" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? 'Show less' : 'Show more'}<ChevronDown className={expanded ? 'rotate-180' : ''} /></Button></>;
}
export function ProductIndicationsEvidence({ k, summaryUrl }: { k: string; summaryUrl: string | null | undefined }) {
  const [result, setResult] = useState<DeviceIndications | null>(null);
  const [error, setError] = useState('');
  const reload = useRefetch();
  useEffect(() => {
    let active = true; setError('');
    getDeviceIndications(k).then(data => { if (active) setResult(data); }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [k, reload]);
  const data = result?.knumber === k ? result : null;
  if (!data) return <Status busy={!error} error={error} />;
  return <>
    <h3>This 510(k)</h3>
    {data.found && data.ifu_text ? <><IndicationsQuote text={data.ifu_text} /><p className="section-caption">From the 510(k) summary, page {data.page ?? 'NOT FOUND'}. <PdfLink url={summaryUrl ?? null} /></p></> : <p className="section-caption">NOT FOUND: we couldn't extract the Indications for Use from this 510(k) summary.</p>}
    {data.predicate && <h3>Primary predicate: <BriefLink k={data.predicate.knumber} /> {data.predicate.device_name ?? 'NOT FOUND'}</h3>}
    {data.predicate?.ifu_text ? <IndicationsQuote text={data.predicate.ifu_text} /> : <p className="section-caption">NOT FOUND: the primary predicate's Indications for Use isn't on file.</p>}
    {data.similarity != null && <p className="section-caption">The wording is {Math.round(data.similarity * 100)}% similar to the primary predicate's. This compares wording only. It doesn't judge whether the cleared use is broader or narrower.</p>}
  </>;
}
export function ProductOwnerEvidence({ owner }: { owner: DeviceOwner | null }) {
  if (!owner) return <Status busy />;
  if (!owner.found) return <p className="section-caption">NOT FOUND</p>;
  return <><p className="section-caption">FDA cleared it for {owner.filer ?? 'NOT FOUND'}.</p><p className="section-caption">{owner.owner_name ? `${owner.owner_name} sells this product line today.` : 'The same company sells it today.'}</p>{owner.explanation && <p className="section-caption">{owner.explanation}</p>}{owner.source_url && /^https?:\/\//.test(owner.source_url) && <a className="brief-link" href={owner.source_url} target="_blank" rel="noopener noreferrer">Source<ExternalLink size={12} /></a>}</>;
}