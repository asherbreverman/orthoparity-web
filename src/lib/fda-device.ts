export type DevicePathway = '510(k)' | 'De Novo' | 'PMA' | 'HDE';

/** Normalize FDA identifiers only; names and other search text stay untouched. */
export function normalizeDeviceNumber(value: string): string | null {
  const number = value.replace(/[\s-]+/g, '').toUpperCase();
  return /^(?:K\d{6}|DEN\d{6}|P\d{6}|H\d{6}|N\d{4,5})$/.test(number) ? number : null;
}

export function devicePathway(number: string, supplied?: DevicePathway | null): DevicePathway {
  if (supplied) return supplied;
  const normalized = normalizeDeviceNumber(number) ?? '';
  if (normalized.startsWith('DEN')) return 'De Novo';
  if (/^[PN]/.test(normalized)) return 'PMA';
  if (normalized.startsWith('H')) return 'HDE';
  return '510(k)';
}

export function hasPredicateChain(pathway: DevicePathway): boolean {
  return pathway === '510(k)' || pathway === 'De Novo';
}

export function decisionDateLabel(pathway: DevicePathway): 'Cleared' | 'Approved' {
  return hasPredicateChain(pathway) ? 'Cleared' : 'Approved';
}

export function approvalExplanation(pathway: DevicePathway): string {
  if (pathway === 'PMA') return 'A PMA device is approved on its own clinical evidence, so it has no predicate chain. The supplement history below shows how it has changed since approval.';
  if (pathway === 'HDE') return 'A humanitarian device (HDE) is approved on safety and probable benefit for a rare condition, so it has no predicate chain. The supplement history below shows how it has changed since approval.';
  return '';
}

export interface ApprovalSupplement {
  decision_date: string | null;
  supplement_number: string;
  category: string | null;
  change: string | null;
  type: string | null;
}

export interface DeviceApproval {
  definition: string;
  url: string | null;
  decision_date: string | null;
  original_on_file: boolean;
  note?: string | null;
  applicant: string | null;
  supplements: number;
  supplements_shown: number;
  not_listed: number;
  new_indications: number;
  design_changes: number;
  labeling_changes: number;
  study_changes: number;
  supplements_listed: ApprovalSupplement[];
}