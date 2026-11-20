import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { maudeDate, maudeNumber, type DeviceMaude } from '@/lib/maude';
import { ProductMaudeSection } from '@/components/maude-evidence';
import { getDeviceMaude } from '@/lib/predicate-data';

vi.mock('@/lib/predicate-data', () => ({ getDeviceMaude: vi.fn() }));
vi.mock('@/components/maude-chart', () => ({ default: () => null }));
const data: DeviceMaude = {
  knumber: 'K120578', has_reports: true, reports: 1000, deaths: 0, injuries: null,
  malfunctions: 2, other: 0, first_year: 2020, last_year: 2026,
  last5: { reports: 5, deaths: 0, injuries: null, malfunctions: 2, other: 0, since: '2021-11-20' },
  by_year: [{ year: 2026, reports: 0 }], category: null, data_through: '2026-11-19',
  source: 'FDA MAUDE', maude_url: 'https://www.accessdata.fda.gov/', tplc_url: null, notes: [],
};
afterEach(() => { cleanup(); vi.resetAllMocks(); });
describe('MAUDE counts and dates', () => {
  it('preserves a zero count', () => expect(maudeNumber(0)).toBe('0'));
  it('marks a null count as missing', () => expect(maudeNumber(null)).toBe('NOT FOUND'));
  it('formats report counts without abbreviation', () => expect(maudeNumber(1000)).toBe('1,000'));
  it('formats the five-year start as month and year', () => expect(maudeDate('2021-11-20', true)).toBe('Nov 2021'));
  it('formats the data-through date', () => expect(maudeDate('2026-11-19')).toBe('Nov 19, 2026'));
  it('marks missing dates as missing', () => expect(maudeDate(null)).toBe('NOT FOUND'));
});
describe('Conditional MAUDE evidence', () => {
  it('renders nothing while loading', () => {
    vi.mocked(getDeviceMaude).mockReturnValue(new Promise(() => {}));
    const screen = render(<ProductMaudeSection k="K120578" open={false} onToggle={vi.fn()} />);
    expect(screen.container.childElementCount).toBe(0);
  });
  it('renders nothing for a product without reports', async () => {
    vi.mocked(getDeviceMaude).mockResolvedValue({ ...data, has_reports: false });
    const screen = render(<ProductMaudeSection k="K120578" open={false} onToggle={vi.fn()} />);
    await waitFor(() => expect(getDeviceMaude).toHaveBeenCalledWith('K120578'));
    expect(screen.container.childElementCount).toBe(0);
  });
  it('does not carry reported evidence into a different product while loading', async () => {
    vi.mocked(getDeviceMaude).mockResolvedValueOnce(data).mockReturnValueOnce(new Promise(() => {}));
    const screen = render(<ProductMaudeSection k="K120578" open={false} onToggle={vi.fn()} />);
    await waitFor(() => expect(screen.container.childElementCount).toBe(1));
    screen.rerender(<ProductMaudeSection k="K140881" open={false} onToggle={vi.fn()} />);
    expect(screen.container.childElementCount).toBe(0);
  });
});