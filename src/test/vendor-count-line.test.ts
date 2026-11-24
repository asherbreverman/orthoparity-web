import { describe, expect, it, vi } from 'vitest';
import { portfolioApprovalCount, portfolioCountLine, isApprovalNumber } from '@/lib/vendor-data';
describe('portfolioCountLine', () => {
  it('510(k)s only', () => expect(portfolioCountLine(3, 0, 1)).toBe('3 orthopedic 510(k)s · 1 product code'));
  it('approvals only', () => expect(portfolioCountLine(1, 1, 2)).toBe('1 orthopedic FDA approval · 2 product codes'));
  it('both', () => expect(portfolioCountLine(1524, 10, 104)).toBe('1,514 orthopedic 510(k)s and 10 FDA approvals · 104 product codes'));
  it('singular 510(k)', () => expect(portfolioCountLine(2, 1, 1)).toBe('1 orthopedic 510(k) and 1 FDA approval · 1 product code'));
  it('P, H, N are approvals', () => expect(['P790008','H230003','N12345','K241487','DEN1'].map(isApprovalNumber)).toEqual([true,true,true,false,false]));
});
describe('portfolioApprovalCount', () => {
  it.each([10, 11, 1, 8, 0])('uses a supplied approval count of %i without loading the portfolio', async approvals => {
    const fallback = vi.fn().mockResolvedValue(99);
    expect(await portfolioApprovalCount({ approvals }, fallback)).toBe(approvals);
    expect(fallback).not.toHaveBeenCalled();
  });
  it.each([{}, { approvals: null }])('loads the fallback only when approvals are missing: %j', async portfolio => {
    const fallback = vi.fn().mockResolvedValue(10);
    expect(await portfolioApprovalCount(portfolio, fallback)).toBe(10);
    expect(fallback).toHaveBeenCalledTimes(1);
  });
});
