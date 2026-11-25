export interface VendorCoverage { count: number; devices: number; first: number; last: number; data_end: string | null; with_product_code: number }
export const fallbackVendorCoverage: VendorCoverage = { count: 1898, first: 1971, last: 2026, devices: 18355, data_end: null, with_product_code: 18267 };
export function vendorCoverage(count: number | null, devices: unknown, first: unknown, last: unknown, dataEnd?: unknown, withProductCode?: unknown): VendorCoverage {
  const firstYear = Number(first), lastYear = Number(last);
  const deviceCount = Number(devices), codedCount = Number(withProductCode);
  const data_end = typeof dataEnd === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dataEnd) ? dataEnd.slice(0, 10) : null;
  return count !== null && count > 0 && firstYear > 0 && lastYear >= firstYear
    ? { count, devices: deviceCount > 0 ? deviceCount : fallbackVendorCoverage.devices, first: firstYear, last: lastYear, data_end, with_product_code: codedCount > 0 ? codedCount : fallbackVendorCoverage.with_product_code }
    : fallbackVendorCoverage;
}
