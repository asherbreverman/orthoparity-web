import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './ui/button';

export function ModeTabs({ vendor, onChange, compact = false }: { vendor: boolean; onChange: (vendor: boolean) => void; compact?: boolean }) {
  return <div className={`mode-tabs ${vendor ? 'vendor-active' : ''}`} role="tablist" aria-label="Benchmark mode"><span className="segment-thumb" aria-hidden="true" /><Button role="tab" aria-selected={!vendor} variant="ghost" onClick={() => onChange(false)}>{compact ? 'Product' : 'Benchmark a product'}</Button><Button role="tab" aria-selected={vendor} variant="ghost" onClick={() => onChange(true)}>{compact ? 'Vendor' : 'Benchmark a vendor'}</Button></div>;
}
export function DockedSearch({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => { setTarget(document.getElementById('docked-search')); document.documentElement.classList.add('has-result'); return () => document.documentElement.classList.remove('has-result'); }, []);
  return target ? createPortal(children, target) : null;
}