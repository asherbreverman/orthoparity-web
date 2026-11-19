import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProcedureSupplyRange } from '@/components/procedure-shared';
import { ProcedureEvidence } from '@/components/procedure-evidence';
import type { ProcedureDetail } from '@/lib/procedure-data';

vi.mock('@tanstack/react-router', () => ({useRouter: vi.fn()}));
vi.mock('@/components/reviewer-shared', () => ({Status: () => null}));
afterEach(cleanup);

const spreadNote = 'Too few hospitals report this DRG to show a spread.';
const supplyNote = 'Published implant cost studies do not cover this procedure.';
function detail(): ProcedureDetail {
  return {
    found:true,
    family:{family_id:'example', name:'Example', description:'Example procedure', drgs:['001'], flagship:false, data_year:2024, discharges:120, hospitals:3},
    payment:{medicare_pays:10000, patient_other_pays:2000, total_payment:12000, patient_other_share:1/6},
    supply_range:{note:null, shares:[.3,.4,.5], on_medicare:[3000,4000,5000], on_total:[3600,4800,6000]},
    drgs:[{drg:'001', description:'Example DRG', discharges:120, hospitals:3, medicare_pays:10000, patient_other_pays:2000, total_payment:12000, share_of_family:1, hospital_medicare_spread:null, note:null, spread_note:spreadNote}],
    outpatient:[], devices:[], evidence:[], worksheet:[], vendor_window:{from:'2021-01-01', to:'2026-01-01'}, notes:{source:'Public data', definitions:[], limitations:[]},
  };
}
function evidence(data: ProcedureDetail) {
  return render(<ProcedureEvidence detail={data} isOpen={() => true} toggle={vi.fn()} />);
}
describe('Procedure missing-data rules', () => {
  it('hides the range and its controls when the source supplies a note', () => {
    const data = detail(); data.supply_range.note = supplyNote;
    const view = render(<ProcedureSupplyRange detail={data} />);
    expect(view.queryByRole('table')).toBeNull();
    expect(view.queryByRole('group')).toBeNull();
    expect(view.container.textContent).toContain(supplyNote);
    expect(view.container.textContent).not.toContain('$3,000');
  });
  it('preserves both supplied ranges and base selection when the note is null', () => {
    const view = render(<ProcedureSupplyRange detail={detail()} />);
    expect(within(view.getByRole('table')).getByText('$3,000')).toBeInTheDocument();
    const total = view.getByRole('button', {name:'Base: Total payment'});
    fireEvent.click(total);
    expect(total).toHaveAttribute('aria-pressed','true');
    expect(view.getByRole('table').textContent).toContain('$6,000');
  });
  it('shows a missing spread note without suppressing other reportable DRG values', () => {
    const view = evidence(detail());
    const section = view.container.querySelector('#evidence-drgs');
    if (!section) throw new Error('DRG evidence missing');
    const cells = section.querySelectorAll('tbody tr td');
    expect(Array.from(cells).slice(2,7).map(cell => cell.textContent)).toEqual(['120','3','$10,000','$2,000','$12,000']);
    expect(cells[7]?.textContent).toBe(`NOT FOUND${spreadNote}`);
  });
  it('keeps suppressed DRGs suppressed even when they have a spread note', () => {
    const data = detail(); const row = data.drgs[0];
    if (!row) throw new Error('Missing test DRG');
    row.note = 'Every hospital row suppressed by CMS (fewer than 11 discharges)';
    const view = evidence(data);
    const section = view.container.querySelector('#evidence-drgs');
    expect(section?.textContent).toContain(row.note);
    expect(section?.textContent).not.toContain('$10,000');
    expect(section?.textContent).not.toContain(spreadNote);
  });
  it('omits an outpatient table when no sourced procedure codes exist', () => {
    const view = evidence(detail());
    const section = view.container.querySelector('#evidence-outpatient');
    expect(section).not.toBeNull();
    expect(section?.querySelector('table')).toBeNull();
    expect(section?.textContent).toContain('NOT FOUND');
  });
  it('omits device tables and vendor-window figures when no categories are linked', () => {
    const view = evidence(detail());
    const section = view.container.querySelector('#evidence-devices');
    expect(section).not.toBeNull();
    expect(section?.querySelector('table')).toBeNull();
    expect(section?.textContent).toContain('NOT FOUND');
    expect(section?.textContent).not.toContain('2021-01-01');
  });
});