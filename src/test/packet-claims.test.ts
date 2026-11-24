import { describe, expect, it } from 'vitest';
import { emptyClaim, MAX_CLAIMS, parsePacketHash, serializePacket } from '@/lib/packet-claims';

describe('packet check fragment', () => {
  it('round-trips several claims and the preparer', () => {
    const state = { preparedBy: 'VAC', claims: [{ ...emptyClaim('K181947'), claim: 'Improved knee scores at 2 years', nct: 'NCT04821154' }, { ...emptyClaim('K140881'), outcome: 'Revision rate' }] };
    const back = parsePacketHash('#' + serializePacket(state));
    expect(back.claims).toHaveLength(2);
    expect(back.claims[0]?.claim).toBe('Improved knee scores at 2 years');
    expect(back.claims[1]?.k).toBe('K140881');
    expect(back.preparedBy).toBe('VAC');
  });
  it('writes nothing when nothing was typed', () => {
    expect(serializePacket({ preparedBy: '', claims: [emptyClaim(), emptyClaim()] })).toBe('');
  });
  it('falls back to one claim with the page FDA number on a missing or broken fragment', () => {
    expect(parsePacketHash('', 'K181947').claims).toEqual([emptyClaim('K181947')]);
    expect(parsePacketHash('#packet=%7Bbroken', 'K1').claims).toHaveLength(1);
  });
  it('caps claims at the limit', () => {
    const many = { preparedBy: '', claims: Array.from({ length: 15 }, (_, i) => ({ ...emptyClaim(), claim: `c${i}` })) };
    expect(parsePacketHash('#' + serializePacket(many)).claims).toHaveLength(MAX_CLAIMS);
  });
});
