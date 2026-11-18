export interface VendorCoverage { count: number; first: number; last: number }
export const fallbackVendorCoverage: VendorCoverage = { count: 2040, first: 1976, last: 2026 };
export function vendorCoverage(count: number | null, first: unknown, last: unknown): VendorCoverage {
  const firstYear = Number(first), lastYear = Number(last);
  return count !== null && count > 0 && firstYear > 0 && lastYear >= firstYear
    ? { count, first: firstYear, last: lastYear }
    : fallbackVendorCoverage;
}