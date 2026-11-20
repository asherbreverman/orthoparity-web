import { cleanup, render, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VendorSupplierEvidence } from '@/components/supplier-evidence';
import { getVendorSupplier, supplierActivities, supplierLocation, supplierNumber, type VendorSupplier } from '@/lib/supplier';
vi.mock('@/lib/supplier', async importOriginal => ({ ...await importOriginal<typeof import('@/lib/supplier')>(), getVendorSupplier: vi.fn() }));
const fixture: VendorSupplier = {
  vendor_id: 'globus', since: '2021-11-20', inspections_through: '2026-11-19',
  sites: { company_sites: 1, company_making: 1, company_countries: 1, partner_sites: 0, partner_making: 0, other_company_sites: 0 },
  countries: [], inspections_last5: { inspections: 4, nai: 1, vai: 2, oai: 1, sites_inspected: 1 },
  inspections_all: { inspections: 8, nai: 4, vai: 3, oai: 1, first: '2009-01-01', latest: '2026-11-19' },
  partner_inspections_last5: null,
  warning_letters: { company_last5: 1, company_all: 2, partner_last5: 0, company_rows: [{ date: '2025-01-10', type: 'Device', site: 'Example facility', city: 'Boston', country: 'US', case_id: '123456' }] },
  top_citations: [{ cfr: '21 CFR 820.100', short_description: 'Corrective action', n: 2 }],
  company_sites: [{ fei: '100', name: 'Example facility', city: 'Boston', state: 'MA', country: 'US', activities: 'Manufacture Medical Device', makes: true, products: 7, last_inspection: { date: '2025-01-01', classification: 'OAI' }, inspections_last5: 4, oai_last5: 1, warning_letters_last5: 1 }],
  partner_sites: [], other_company_sites: [], recalls: { figs: [{ label: 'recall events, last five years', value: 3 }], badge: '' },
  maude_last5: { reports: 1000, deaths: 0, injuries: 1, malfunctions: 999, other: 0, since: '2021-11-20' },
  sources: { sites: 'https://www.fda.gov/', inspections: 'https://www.fda.gov/', compliance: 'https://www.fda.gov/', warning_letters: 'https://www.fda.gov/' }, notes: ['Counts are not rates.'],
};
afterEach(() => { cleanup(); vi.clearAllMocks(); });
describe('Supplier evidence', () => {
  it('renders the six supplied metrics, letter, site and partner context', async () => {
    vi.mocked(getVendorSupplier).mockResolvedValue(fixture);
    const screen = render(<VendorSupplierEvidence v="globus" mode="current" />);
    await waitFor(() => expect(screen.container.querySelectorAll('.metric')).toHaveLength(6));
    const values = Array.from(screen.container.querySelectorAll('.metric-value'), node => node.textContent);
    expect(values).toEqual(['3', '1,000', '1', '4', '1', '1']);
    expect(screen.getByText('123456')).toBeInTheDocument();
    expect(screen.getByText('Manufacturer')).toBeInTheDocument();
    expect(screen.getByText('OAI', { selector: 'span' })).toHaveAttribute('title', 'Official action indicated');
    expect(screen.getByText("Other firms that list this company's products: contract manufacturers, sterilizers, importers and relabelers. Their results describe their own site.")).toBeInTheDocument();
    const tables = screen.getAllByRole('table');
    const letterTable = tables[0];
    if (!letterTable) throw new Error('Missing warning letter table');
    expect(within(letterTable).getAllByRole('row')).toHaveLength(2);
  });
  it('shows the warning-letter empty state', async () => {
    vi.mocked(getVendorSupplier).mockResolvedValue({ ...fixture, warning_letters: { company_last5: 0, company_all: 0, partner_last5: 0, company_rows: [] } });
    const screen = render(<VendorSupplierEvidence v="globus" mode="current" />);
    expect(await screen.findByText("No device warning letters to company sites in FDA's data since fiscal year 2009.")).toBeInTheDocument();
  });
  it('handles null nested fields without inventing zeroes', async () => {
    vi.mocked(getVendorSupplier).mockResolvedValue({ ...fixture, sites: null, inspections_all: null, inspections_last5: null, warning_letters: null, recalls: null, maude_last5: null, company_sites: null, partner_sites: null, notes: null, sources: null });
    const screen = render(<VendorSupplierEvidence v="globus" mode="current" />);
    await waitFor(() => expect(screen.container.querySelectorAll('.metric-value')).toHaveLength(6));
    expect(Array.from(screen.container.querySelectorAll('.metric-value'), node => node.textContent)).toEqual(Array(6).fill('NOT FOUND'));
  });
});
describe('Supplier formatting', () => {
  it('preserves zero and marks null numbers as missing', () => { expect(supplierNumber(0)).toBe('0'); expect(supplierNumber(null)).toBe('NOT FOUND'); });
  it('expands country codes and retains unknown activities', () => { expect(supplierLocation({ city: 'Boston', state: 'MA', country: 'US' })).toBe('Boston, MA, United States'); expect(supplierActivities('Manufacture Medical Device; Unlisted activity')).toBe('Manufacturer, Unlisted activity'); });
});