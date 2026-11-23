export interface VendorCoverage { count: number; devices: number; first: number; last: number }
export const fallbackVendorCoverage: VendorCoverage = { count: 1898, first: 1971, last: 2026, devices: 18355 };
export function vendorCoverage(count: number | null, devices: unknown, first: unknown, last: unknown): VendorCoverage {
  const firstYear = Number(first), lastYear = Number(last);
  const deviceCount = Number(devices);
  return count !== null && count > 0 && firstYear > 0 && lastYear >= firstYear
    ? { count, devices: deviceCount > 0 ? deviceCount : fallbackVendorCoverage.devices, first: firstYear, last: lastYear }
    : fallbackVendorCoverage;
}
