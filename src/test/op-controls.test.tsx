import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CopyLink, ScopeLabel, Term } from '@/components/op-controls';
import { glossaryEntry, glossaryTerms } from '@/lib/glossary';

afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

describe('shared v2 controls', () => {
  it('keeps glossary tooltips and native slug links together', () => {
    render(<><Term term="Predicate">Predicate</Term><Term term="510(k)">510(k)</Term><Term term="MAUDE">MAUDE</Term></>);
    expect(screen.getByTitle(glossaryEntry('Predicate')?.definition ?? '').querySelector('a')).toHaveAttribute('href', '/glossary#predicate');
    expect(screen.getByTitle(glossaryEntry('510(k)')?.definition ?? '').querySelector('a')).toHaveAttribute('href', '/glossary#510k');
    expect(screen.getByTitle(glossaryEntry('MAUDE')?.definition ?? '').querySelector('a')).toHaveAttribute('href', '/glossary#maude');
  });

  it('copies the current URL and restores the label after two seconds', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    render(<CopyLink />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Copy link' })); await Promise.resolve(); });
    expect(writeText).toHaveBeenCalledWith(window.location.href);
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(2000); });
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument();
  });

  it('renders a scope label with the supplied class', () => {
    render(<ScopeLabel>FDA records, not sales</ScopeLabel>);
    expect(screen.getByText('FDA records, not sales')).toHaveClass('op-scope');
  });
});

describe('glossary', () => {
  it('contains all 18 terms with stable anchors', () => {
    expect(glossaryTerms).toHaveLength(18);
    expect(glossaryEntry('510(k)')).toMatchObject({ id: '510k', definition: 'FDA clearance that a device is substantially equivalent to one already on the market. Clearance is not a finding that it is better than others.' });
    expect(glossaryEntry('Predicate')?.definition).toBe('The already-cleared device a 510(k) says it is equivalent to. A chain of predicates shows lineage; the last device found is the earliest predicate on record.');
    expect(glossaryEntry('TEAM')?.definition).toBe("Transforming Episode Accountability Model: Medicare's mandatory episode model for selected hospitals, 2026 to 2030.");
    expect(glossaryEntry('CCN')?.definition).toBe('CMS Certification Number, the ID CMS uses for each hospital.');
  });
});
