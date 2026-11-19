import { render, cleanup, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProductProceduresSection, VendorProceduresSection } from '@/components/benchmark-procedures';
import { getDeviceProcedures, getVendorProcedures } from '@/lib/predicate-data';

vi.mock('@/lib/predicate-data', () => ({
  LOAD_FAILED: "This brief didn't load. Try again in a moment.",
  getDeviceProcedures: vi.fn(() => new Promise(() => {})),
  getVendorProcedures: vi.fn(() => new Promise(() => {})),
}));
afterEach(() => {cleanup(); vi.clearAllMocks();});
describe('Lazy benchmark procedure reads', () => {
  it('does not read product procedures until the section opens', async () => {
    const props = {id:'procedures', k:'K110694', code:'MAX', onToggle:vi.fn()};
    const screen = render(<ProductProceduresSection {...props} open={false} />);
    expect(getDeviceProcedures).not.toHaveBeenCalled();
    screen.rerender(<ProductProceduresSection {...props} open />);
    await waitFor(() => expect(getDeviceProcedures).toHaveBeenCalledWith('K110694'));
    expect(getDeviceProcedures).toHaveBeenCalledTimes(1);
  });
  it('reads vendor procedures only when vendor evidence is open', async () => {
    const props = {id:'procedures', v:'globus', onToggle:vi.fn()};
    const screen = render(<VendorProceduresSection {...props} mode="current" open={false} />);
    screen.rerender(<VendorProceduresSection {...props} mode="current" open={false} />);
    expect(getVendorProcedures).not.toHaveBeenCalled();
    screen.rerender(<VendorProceduresSection {...props} mode="current" open />);
    await waitFor(() => expect(getVendorProcedures).toHaveBeenCalledWith('globus', 'current'));
    screen.rerender(<VendorProceduresSection {...props} mode="current" open />);
    await waitFor(() => expect(getVendorProcedures).toHaveBeenCalledWith('globus', 'current'));
    expect(getVendorProcedures).toHaveBeenCalledTimes(1);
  });
});