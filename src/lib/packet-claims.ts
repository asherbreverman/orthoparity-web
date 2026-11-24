/** Packet check claims live only in React state and the URL fragment; they are never sent anywhere. */
export interface PacketHospital { ccn: string; hospital: string; participation: string | null; start_date: string | null; region_name: string | null }
export interface PacketClaim { k: string; claim: string; outcome: string; comparator: string; timeframe: string; nct: string; code: string; hospitalQ: string; hospital: PacketHospital | null }
export interface PacketState { preparedBy: string; claims: PacketClaim[] }

export const MAX_CLAIMS = 10;
export const emptyClaim = (k = ''): PacketClaim => ({ k, claim: '', outcome: '', comparator: '', timeframe: '', nct: '', code: '', hospitalQ: '', hospital: null });
const TEXT_KEYS = ['k', 'claim', 'outcome', 'comparator', 'timeframe', 'nct', 'code', 'hospitalQ'] as const;
const str = (v: unknown) => typeof v === 'string' ? v.slice(0, 4000) : '';
const PREFIX = 'packet=';

function cleanHospital(v: unknown): PacketHospital | null {
  if (!v || typeof v !== 'object') return null;
  const h = v as Record<string, unknown>;
  if (typeof h['ccn'] !== 'string' || typeof h['hospital'] !== 'string') return null;
  const opt = (x: unknown) => typeof x === 'string' ? x : null;
  return { ccn: h['ccn'], hospital: h['hospital'], participation: opt(h['participation']), start_date: opt(h['start_date']), region_name: opt(h['region_name']) };
}
function cleanClaim(v: unknown): PacketClaim {
  const c = emptyClaim();
  if (!v || typeof v !== 'object') return c;
  const o = v as Record<string, unknown>;
  for (const key of TEXT_KEYS) c[key] = str(o[key]);
  c.hospital = cleanHospital(o['hospital']);
  return c;
}

/** Reads `#packet=…`; anything malformed falls back to one blank claim. */
export function parsePacketHash(hash: string, initialK = ''): PacketState {
  const fallback = { preparedBy: '', claims: [emptyClaim(initialK)] };
  const raw = hash.replace(/^#/, '');
  if (!raw.startsWith(PREFIX)) return fallback;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw.slice(PREFIX.length))) as unknown;
    if (!parsed || typeof parsed !== 'object') return fallback;
    const o = parsed as Record<string, unknown>;
    const claims = Array.isArray(o['claims']) ? o['claims'].slice(0, MAX_CLAIMS).map(cleanClaim) : [];
    return { preparedBy: str(o['preparedBy']), claims: claims.length ? claims : fallback.claims };
  } catch { return fallback; }
}

const isBlank = (c: PacketClaim) => TEXT_KEYS.every(key => !c[key].trim()) && !c.hospital;
/** Empty string when nothing was typed, so a fresh page keeps a clean address. */
export function serializePacket(state: PacketState): string {
  if (!state.preparedBy.trim() && state.claims.every(isBlank)) return '';
  const claims = state.claims.map(c => {
    const out: Record<string, unknown> = {};
    for (const key of TEXT_KEYS) if (c[key]) out[key] = c[key];
    if (c.hospital) out['hospital'] = c.hospital;
    return out;
  });
  return PREFIX + encodeURIComponent(JSON.stringify(state.preparedBy ? { preparedBy: state.preparedBy, claims } : { claims }));
}
