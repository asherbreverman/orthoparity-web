import { describe, expect, it } from 'vitest';
import { batchAllowed, parseBatch, filterPeers, unreviewedLow, type Peer, questionGroups, questionsText } from '@/lib/reviewer-data';
import { csvCell } from '@/lib/reviewer-export';
describe('Reviewer data rules', () => {
  it('parses K and DEN numbers using any separator and removes duplicates', () => {
    expect(parseBatch('k110694; DEN170001\nK241487 / K110694')).toEqual(['K110694', 'DEN170001', 'K241487']);
    expect(parseBatch('K12345 K1234567 P960025')).toEqual([]);
  });
  it('accepts 50 clearance numbers and rejects 51 without silent truncation', () => {
    expect(batchAllowed(Array.from({length:50}, (_,i) => `K${String(i).padStart(6,'0')}`))).toBe(true);
    expect(batchAllowed(Array.from({length:51}, (_,i) => `K${String(i).padStart(6,'0')}`))).toBe(false);
  });
  it('marks LOW confidence only when review source is parser', () => {
    expect(unreviewedLow({confidence:'LOW',review_source:'parser'})).toBe(true);
    expect(unreviewedLow({confidence:'LOW',review_source:'Claude review'})).toBe(false);
    expect(unreviewedLow({confidence:'MEDIUM',review_source:'parser'})).toBe(false);
  });
  const peer = (k: string, same_company: boolean, same_code: boolean): Peer => ({knumber:k,same_company,same_code,device_name:'Device',applicant:'Printed applicant',decision_year:2024,product_code:'MAX',shared:['K110694'],n_shared:1});
  const peers = [peer('K000001',true,true),peer('K000002',false,true),peer('K000003',false,false)];
  it('other-companies filter excludes same-company peers', () => { expect(filterPeers(peers,true,false).map(p=>p.knumber)).toEqual(['K000002','K000003']); });
  it('same-product-code filter excludes different-code peers', () => { expect(filterPeers(peers,false,true).map(p=>p.knumber)).toEqual(['K000001','K000002']); });
  it('combined peer filters apply both requirements', () => { expect(filterPeers(peers,true,true).map(p=>p.knumber)).toEqual(['K000002']); });
  it('escapes CSV cells and prevents formula interpretation', () => { expect(csvCell('a,"b"')).toBe('"a,""b"""'); expect(csvCell('=1+1')).toBe('"\'=1+1"'); });
});
describe('VAC question selection', () => {
  const brief = { questions: ['Device question A', 'Device question B'], vac_questions: [{topic:'Coding and reimbursement',question:'Coding question'}, {topic:'Coding and reimbursement',question:'Payment question'}, {topic:'Clinical value',question:'Clinical question'}] };
  it('keeps topics in returned order and numbering continues from device questions', () => {
    const groups = questionGroups(brief);
    expect(groups.map(g=>g.topic)).toEqual(['Specific to this device','Coding and reimbursement','Clinical value']);
    expect(groups.flatMap(g=>g.items.map(q=>q.id))).toEqual([0,1,2,3,4]);
  });
  it('copy all includes both question types', () => {
    expect(questionsText(questionGroups(brief))).toBe('Specific to this device\n1. Device question A\n2. Device question B\n\nCoding and reimbursement\n3. Coding question\n4. Payment question\n\nClinical value\n5. Clinical question');
  });
  it('copy selected contains only checked questions with their topic headings', () => {
    expect(questionsText(questionGroups(brief), new Set([1,4]))).toBe('Specific to this device\n2. Device question B\n\nClinical value\n5. Clinical question');
    expect(questionsText(questionGroups(brief), new Set())).toBe('');
  });
});
