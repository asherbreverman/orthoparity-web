import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { parsePricesHash, serializePrices, type PrivatePrices } from '@/lib/private-prices';
import { ScopeLabel } from './op-controls';

const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** Prices live in component state and the fragment, never in storage or a request. */
export function usePrivatePrices() {
  const [prices, setPrices] = useState<PrivatePrices>({});
  const current = useRef<PrivatePrices>({});
  const timer = useRef<number | null>(null);

  const flush = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    const fragment = serializePrices(current.current);
    const next = `${window.location.pathname}${window.location.search}${fragment ? `#prices=${fragment}` : ''}`;
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== next) window.history.replaceState(window.history.state, '', next);
  }, []);

  useBrowserLayoutEffect(() => {
    const sync = () => { const next = parsePricesHash(window.location.hash); current.current = next; setPrices(next); };
    sync();
    window.addEventListener('hashchange', sync);
    window.addEventListener('op-flush-prices', flush);
    window.addEventListener('beforeunload', flush);
    return () => { window.removeEventListener('hashchange', sync); window.removeEventListener('op-flush-prices', flush); window.removeEventListener('beforeunload', flush); };
  }, [flush]);

  const setPrice = useCallback((key: string, value: string) => {
    const next = { ...current.current };
    if (value.trim()) next[key] = value;
    else delete next[key];
    current.current = next;
    setPrices(next);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, 180);
  }, [flush]);

  return { prices, setPrice };
}

export const PricePrintContext = createContext(false);

export function PriceInput({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  const print = useContext(PricePrintContext);
  const [local, setLocal] = useState(value);
  const focused = useRef(false);
  useEffect(() => { if (!focused.current) setLocal(value); }, [value]);
  if (print) return null;
  return <label className="op-price no-print" htmlFor={id}><span aria-hidden="true">$</span><input id={id} aria-label={label} inputMode="decimal" autoComplete="off" maxLength={40} placeholder="Your price" value={local} onFocus={() => { focused.current = true; }} onBlur={() => { focused.current = false; setLocal(value); }} onChange={event => { setLocal(event.target.value); onChange(event.target.value); }} /></label>;
}

export function PriceHeader() {
  return <>Your price <ScopeLabel>stays in your browser</ScopeLabel></>;
}

export function PriceNote() {
  return <p className="op-note op-price-note no-print"><b>Your prices stay in this browser.</b> OrthoParity never receives them. They go into your CSV download and into the link only if you copy it.</p>;
}
