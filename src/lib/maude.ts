export type MaudeCounts = {
  reports: number | null;
  deaths: number | null;
  injuries: number | null;
  malfunctions: number | null;
  other: number | null;
};

export type DeviceMaude = MaudeCounts & {
  knumber: string;
  has_reports: boolean;
  last5: MaudeCounts & { since: string | null };
  first_year: number | null;
  last_year: number | null;
  by_year: { year: number | null; reports: number | null }[];
  category: {
    product_code: string | null;
    clearances: number | null;
    with_reports: number | null;
    reports_last5: number | null;
    median_last5_with_reports: number | null;
  } | null;
  data_through: string | null;
  source: string;
  maude_url: string;
  tplc_url: string | null;
  notes: string[];
};

export function maudeNumber(value: number | null) {
  return value === null ? 'NOT FOUND' : value.toLocaleString('en-US');
}

export type VendorMaude = MaudeCounts & {
  vendor_id: string;
  products: number | null;
  products_with_reports: number | null;
  last5: MaudeCounts & { since: string | null };
  by_year: DeviceMaude['by_year'];
  top_products: {
    knumber: string;
    device_name: string | null;
    product_code: string | null;
    reports: number | null;
    reports_last5: number | null;
    deaths_last5: number | null;
    injuries_last5: number | null;
    malfunctions_last5: number | null;
  }[];
  data_through: string | null;
  source: string;
  maude_url: string;
  notes: string[];
};

export function maudeDate(value: string | null, monthOnly = false) {
  if (!value) return 'NOT FOUND';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'NOT FOUND';
  return date.toLocaleDateString('en-US', {
    month: 'short', year: 'numeric', timeZone: 'UTC',
    ...(monthOnly ? {} : { day: 'numeric' }),
  });
}