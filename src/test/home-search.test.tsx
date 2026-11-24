import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { dataThroughDate, parsePartList, searchLevel } from '@/components/benchmark-navigation';
import { ResearchSearch } from '@/components/research-search';

describe('home search rules', () => {
  it('uses product unless a supported level is supplied', () => {
    expect(searchLevel(undefined)).toBe('product');
    expect(searchLevel('part')).toBe('part');
    expect(searchLevel('company')).toBe('company');
    expect(searchLevel('other')).toBe('product');
  });
  it('deduplicates part lists and caps them at 50', () => {
    expect(parsePartList('213-65-05, 5251300\n213-65-05')).toEqual(['213-65-05', '5251300']);
    expect(parsePartList(Array.from({ length: 55 }, (_, i) => `PART-${i}`).join('\n'))).toHaveLength(50);
  });
  it('formats the live release date without using the mockup date', () => {
    expect(dataThroughDate('2026-11-19 03:28')).toBe('Nov 19, 2026');
    expect(dataThroughDate(undefined)).toBe('…');
  });
  it('runs a shared search link on the styled search field', async () => {
    const load = vi.fn().mockResolvedValue([]);
    render(<ResearchSearch label="Benchmark an orthopedic product" placeholder="Product" initialValue="K140881" autoSearch load={load} onSelect={() => {}} variant="op" submitLabel="Benchmark" />);
    expect(screen.getByRole('combobox')).toHaveValue('K140881');
    await waitFor(() => expect(load).toHaveBeenCalledWith('K140881', expect.any(AbortSignal)), { timeout: 1500 });
    expect(screen.getByRole('button', { name: 'Benchmark' })).toBeInTheDocument();
  });
});
