import { describe, expect, it } from 'vitest';
import { parseInput, teamLedger, type ClaimInputs } from '@/lib/team';

const none: ClaimInputs = {cases: null, implantNow: null, implantNew: null, losDays: null, costPerDay: null, readmitPts: null, readmitPay: null, postAcutePts: null, postAcutePay: null};
describe('TEAM arithmetic', () => {
  it('keeps blank inputs as not entered, never zero', () => {
    expect(parseInput('')).toBeNull();
    const l = teamLedger(none, 18000);
    expect(l.net).toBeNull(); expect(l.breakEven).toBeNull(); expect(l.implantDiff).toBeNull();
  });
  it('computes the ledgers, net, per year and break-even', () => {
    const l = teamLedger({...none, cases: 100, implantNow: 4000, implantNew: 5000, losDays: -0.5, costPerDay: 2000, readmitPts: -2, readmitPay: 15000, postAcutePts: -5, postAcutePay: 10000}, 20000);
    expect(l.implantDiff).toBe(1000); expect(l.losCost).toBe(-1000);
    expect(l.readmit).toBe(-300); expect(l.postAcute).toBe(-500);
    expect(l.episode).toBe(-800); expect(l.episodePct).toBeCloseTo(-4);
    expect(l.net).toBe(-800); expect(l.perYear).toBe(-80000); expect(l.breakEven).toBe(1800);
  });
  it('scales claimed effects but not the implant difference in sensitivity', () => {
    const i = {...none, implantNow: 4000, implantNew: 5000, losDays: -1, costPerDay: 2000};
    expect(teamLedger(i, null, 0.5).net).toBe(0);
    expect(teamLedger(i, null, 1.5).net).toBe(-2000);
  });
});
