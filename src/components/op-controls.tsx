import { Check, Link2 } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { glossaryEntry, type GlossaryTermName } from '@/lib/glossary';

export function Term({ term, children }: { term: GlossaryTermName; children?: ReactNode }) {
  const entry = glossaryEntry(term);
  if (!entry) return children ?? term;
  return <abbr className="op-term" title={entry.definition}><a href={`/glossary#${entry.id}`}>{children ?? term}</a></abbr>;
}

export function CopyLink() {
  const [copied, setCopied] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timeout.current) clearTimeout(timeout.current); }, []);

  async function copy() {
    try {
      window.dispatchEvent(new Event('op-flush-prices'));
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      if (timeout.current) clearTimeout(timeout.current);
      timeout.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return <button type="button" className="op-btn-2" onClick={() => void copy()} aria-live="polite">
    {copied ? <Check size={16} aria-hidden="true" /> : <Link2 size={16} aria-hidden="true" />}
    {copied ? 'Copied' : 'Copy link'}
  </button>;
}

export function ScopeLabel({ children }: { children: ReactNode }) {
  return <span className="op-scope">{children}</span>;
}
