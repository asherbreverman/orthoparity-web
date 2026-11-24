import { describe, expect, it } from 'vitest';
import { normalizeNct, packetQuestions, parseCtGov, type Trial } from '@/lib/trials';

const blank = {outcome: '', comparator: '', timeframe: '', nct: ''};
describe('packet check questions', () => {
  it('asks for a registered trial when no NCT number is entered', () => {
    expect(packetQuestions(blank, null, [])).toEqual(['Which registered trial supports this claim, and what is its NCT number?']);
  });
  it('asks about missing results on a completed trial', () => {
    const t = {status: 'COMPLETED', has_results: false} as Trial;
    expect(packetQuestions({...blank, nct: 'NCT04280887'}, t, [])).toContain('This trial is completed with no results posted on ClinicalTrials.gov. When will results be posted?');
  });
  it('quotes the typed outcome and comparator', () => {
    const q = packetQuestions({...blank, nct: 'x', outcome: 'KSS at 2 years', comparator: 'Legacy'}, null, ['Vendor Q']);
    expect(q[0]).toBe('Vendor Q');
    expect(q).toContain("Is 'KSS at 2 years' the trial's registered primary outcome, a secondary outcome or an outcome measured afterward?");
    expect(q).toContain("Which product, generation or treatment is 'Legacy', and is it what our surgeons use today?");
  });
  it('validates NCT numbers and reads ClinicalTrials.gov fields', () => {
    expect(normalizeNct(' nct04280887 ')).toBe('NCT04280887'); expect(normalizeNct('NCT123')).toBeNull();
    const t = parseCtGov('NCT1', {hasResults: false, protocolSection: {identificationModule: {briefTitle: 'T'}, statusModule: {overallStatus: 'COMPLETED'}, outcomesModule: {primaryOutcomes: [{measure: 'M', timeFrame: '1 year'}]}, designModule: {designInfo: {allocation: 'RANDOMIZED'}}, sponsorCollaboratorsModule: {leadSponsor: {name: 'S'}}}});
    expect([t.title, t.status, t.primary_outcome, t.primary_timeframe, t.allocation, t.sponsor, t.has_results]).toEqual(['T', 'COMPLETED', 'M', '1 year', 'RANDOMIZED', 'S', false]);
  });
});
