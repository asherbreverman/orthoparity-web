import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { addOnAmount, addOnStatus, getDeviceAddOn, getVendorAddOn, type AddOnItem, type DeviceAddOn } from '@/lib/add-on';
import { ProductAddOnSection, VendorAddOnEvidence } from '@/components/add-on-evidence';
vi.mock('@/lib/add-on', async importOriginal => ({ ...await importOriginal<typeof import('@/lib/add-on')>(), getDeviceAddOn: vi.fn(), getVendorAddOn: vi.fn() }));
const item: AddOnItem = {
  tech_id: 'test', program: 'NTAP', period: 'FY 2027', status: 'new', technology: 'Technology', company: 'Company', vendor_id: 'company',
  fda_numbers: 'K230088', hcpcs: null, cms_descriptor: null, apc: null, max_payment: 21125, cms_codes: null,
  pathway: null, effective: null, pass_through_ends: null, cms_source: 'https://www.cms.gov/', fda_source: 'https://www.fda.gov/', note: null,
};
const data: DeviceAddOn = { knumber: 'K230088', has_add_on: true, items: [item], category: [], product_code: 'ABC', notes: [] };
afterEach(() => { cleanup(); vi.clearAllMocks(); });
describe('Medicare add-on rules', () => {
  it('formats the NTAP limit of 21125 without cents', () => expect(addOnAmount(21125)).toBe('$21,125'));
  it('preserves nonwhole dollar amounts', () => expect(addOnAmount(4396.6)).toBe('$4,396.60'));
  it('preserves zero', () => expect(addOnAmount(0)).toBe('$0'));
  it('does not turn a missing amount into zero', () => expect(addOnAmount(null)).toBe('NOT FOUND'));
  it('identifies new FY 2027 NTAP', () => expect(addOnStatus(item)).toBe('New for FY 2027'));
  it('identifies continued FY 2027 NTAP', () => expect(addOnStatus({ ...item, status: 'continued' })).toBe('Continues in FY 2027'));
  it('identifies ended FY 2027 NTAP', () => expect(addOnStatus({ ...item, status: 'discontinued' })).toBe('Ended for FY 2027'));
  it('identifies the January 1, 2027 TPT start', () => expect(addOnStatus({ ...item, program: 'TPT' })).toBe('New January 1, 2027'));
  it('identifies continued CY 2027 TPT', () => expect(addOnStatus({ ...item, program: 'TPT', status: 'continued' })).toBe('Continues in CY 2027'));
  it('identifies an expiry during CY 2027', () => expect(addOnStatus({ ...item, program: 'TPT', status: 'continued', pass_through_ends: 'during CY 2027' })).toBe('Continues in CY 2027 (expires during 2027)'));
});
describe('Medicare add-on evidence', () => {
  it('shows the supplied NTAP payment and program', async () => {
    vi.mocked(getDeviceAddOn).mockResolvedValue(data);
    const screen = render(<ProductAddOnSection k="K230088" open onToggle={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Up to $21,125 per case')).toBeInTheDocument());
    expect(screen.getByText('Inpatient NTAP')).toBeInTheDocument();
  });
  it('keeps the evidence section with no direct or category add-on', async () => {
    vi.mocked(getDeviceAddOn).mockResolvedValue({ ...data, has_add_on: false, items: [], category: [] });
    const screen = render(<ProductAddOnSection k="K230088" open onToggle={vi.fn()} />);
    await waitFor(() => expect(getDeviceAddOn).toHaveBeenCalledWith('K230088'));
    expect(screen.container.childElementCount).toBe(1);
  });
  it('shows the supplied TPT code and expiry', async () => {
    vi.mocked(getVendorAddOn).mockResolvedValue({ vendor_id: 'company', ntap: 0, pass_through: 1, notes: [], items: [{ ...item, program: 'TPT', hcpcs: 'C1737', pass_through_ends: 'during CY 2027' }] });
    const screen = render(<VendorAddOnEvidence v="company" mode="current" />);
    await waitFor(() => expect(screen.getByText('HCPCS C1737')).toBeInTheDocument());
    expect(screen.getByText('New January 1, 2027 (expires during 2027)')).toBeInTheDocument();
  });
  it('retains the prior-year amount for discontinued NTAP', async () => {
    vi.mocked(getDeviceAddOn).mockResolvedValue({ ...data, items: [{ ...item, status: 'discontinued' }] });
    const screen = render(<ProductAddOnSection k="K230088" open onToggle={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Was up to $21,125 in FY 2026')).toBeInTheDocument());
  });
  it('does not carry another product into the loading state', async () => {
    vi.mocked(getDeviceAddOn).mockResolvedValueOnce(data).mockReturnValueOnce(new Promise(() => {}));
    const screen = render(<ProductAddOnSection k="K230088" open={false} onToggle={vi.fn()} />);
    await waitFor(() => expect(screen.container.childElementCount).toBe(1));
    screen.rerender(<ProductAddOnSection k="K171651" open={false} onToggle={vi.fn()} />);
    expect(screen.container.childElementCount).toBe(1);
    expect(screen.queryByText('1 add-on payment for this product line')).not.toBeInTheDocument();
  });
});
