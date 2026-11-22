import { companyName } from '@/lib/format';
import { ResearchSearch } from './research-search';
import { searchVendors } from '@/lib/predicate-data';
import { vendorOption, type Vendor } from '@/lib/vendor-data';
import { useEffect, useState } from 'react';
const vendors = new Map<string, Vendor>();
const load = async (q: string, signal: AbortSignal) => (await searchVendors(q, signal)).map(row => {
  vendors.set(row.vendor_id, row);
  const name = companyName(row.display_name);
  return {
    ...vendorOption(row), name,
    label: row.via_name ? `${name}, via ${companyName(row.via_name)}` : name,
    extra: row.via_name ? `via ${companyName(row.via_name)}` : row.matched_name && row.matched_name !== row.display_name ? `matched: ${companyName(row.matched_name)}` : undefined,
  };
});
export function VendorSearch({ onSelect, label = 'Identify a vendor to benchmark', initialValue = '' }: { onSelect: (row: Vendor) => void; label?: string; initialValue?: string }) {
  const [name, setName] = useState(initialValue);
  useEffect(() => { setName(initialValue); if (!initialValue) return; const update = (event: Event) => { if (event instanceof CustomEvent && typeof event.detail === 'string') setName(event.detail); }; window.addEventListener('benchmark-name', update); return () => window.removeEventListener('benchmark-name', update); }, [initialValue]);
  return <ResearchSearch label={label} placeholder="e.g. Stryker, Zimmer Biomet, Smith+Nephew" initialValue={name} load={load} onSelect={id => { const row = vendors.get(id); if (row) onSelect(row); }} />;
}
