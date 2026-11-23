import { describe, expect, it } from 'vitest';
import { portfolioCountLine, isApprovalNumber } from '@/lib/vendor-data';
describe('portfolioCountLine', () => {
  it('510(k)s only', () => expect(portfolioCountLine(3, 0, 1)).toBe('3 orthopedic 510(k)s · 1 product code'));
  it('approvals only', () => expect(portfolioCountLine(1, 1, 2)).toBe('1 orthopedic FDA approval · 2 product codes'));
  it('both', () => expect(portfolioCountLine(1524, 10, 104)).toBe('1,514 orthopedic 510(k)s and 10 FDA approvals · 104 product codes'));
  it('singular 510(k)', () => expect(portfolioCountLine(2, 1, 1)).toBe('1 orthopedic 510(k) and 1 FDA approval · 1 product code'));
  it('P, H, N are approvals', () => expect(['P790008','H230003','N12345','K241487','DEN1'].map(isApprovalNumber)).toEqual([true,true,true,false,false]));
});
