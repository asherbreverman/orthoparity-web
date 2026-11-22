import { useState } from 'react';
import { Button } from './ui/button';
import { EvidenceSection } from './decision-shared';
import { longDate } from '@/lib/signals';
import { approvalExplanation, type DeviceApproval, type DevicePathway } from '@/lib/fda-device';

function SupplementChange({ text }: { text: string | null }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return <>NOT FOUND</>;
  return <><p className={`approval-change ${expanded ? '' : 'approval-change-clamped'}`}>{text}</p><Button variant="link" size="sm" className="px-0 no-print" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{expanded ? 'less' : 'more'}</Button></>;
}

export function ApprovalContent({ approval }: { approval: DeviceApproval }) {
  const counts = [
    ['New indications', approval.new_indications],
    ['Design changes', approval.design_changes],
    ['Labeling changes', approval.labeling_changes],
    ['Post-approval study changes', approval.study_changes],
  ] as const;
  return <>
    <p className="section-caption">{approval.definition}</p>
    <dl className="device-facts">
      <div><dt>Approved</dt><dd>{approval.original_on_file ? longDate(approval.decision_date) : <>NOT FOUND: the original approval is not on file{approval.note && <p className="section-caption">{approval.note}</p>}</>}</dd></div>
      <div><dt>Applicant</dt><dd>{approval.applicant ?? 'NOT FOUND'}</dd></div>
      <div><dt>Supplements approved</dt><dd>{approval.supplements}</dd></div>
      <div><dt>Listed below</dt><dd>{approval.supplements_shown}</dd></div>
      <div><dt>Manufacturing and site notices</dt><dd>{approval.not_listed} <span className="section-caption">counted, not listed</span></dd></div>
    </dl>
    <div className="cell-tags approval-counts">{counts.map(([label, count]) => <span className="data-tag" key={label}>{label}: {count}</span>)}</div>
    {approval.supplements_listed.length ? <div className="brief-table-scroll" tabIndex={0} role="region" aria-label="Approval supplements"><table className="brief-table approval-table"><thead><tr><th>Date</th><th>Supplement</th><th>Category</th><th>What changed</th><th>Review type</th></tr></thead><tbody>{approval.supplements_listed.map(row => <tr key={row.supplement_number}><td>{longDate(row.decision_date)}</td><td className="font-mono">{row.supplement_number}</td><td>{row.category ?? 'NOT FOUND'}</td><td><SupplementChange text={row.change} /></td><td>{row.type ?? 'NOT FOUND'}</td></tr>)}</tbody></table></div> : <p className="section-caption">No design, labeling, indication or study supplements on file.</p>}
    <p className="section-caption">Manufacturing, process and site notices are counted, not listed. Every supplement is in the data release (pc_approval_supplements.csv). Source: {approval.url && /^https:\/\//.test(approval.url) ? <a className="brief-link" href={approval.url} target="_blank" rel="noopener noreferrer">FDA's</a> : "FDA's"} PMA or HDE database.</p>
  </>;
}

/** Reuses the signal card's evidence id without changing its payload. */
export function ApprovalEvidence({ id, pathway, approval, open, onToggle }: { id: string; pathway: DevicePathway; approval: DeviceApproval | null | undefined; open: boolean; onToggle: () => void }) {
  return <div className="approval-evidence"><p className="section-caption">{approvalExplanation(pathway)}</p>{approval && <EvidenceSection id={id} title="Approval and supplements" summary={`${approval.supplements} supplements approved · ${approval.supplements_shown} listed below`} open={open} onToggle={onToggle}><ApprovalContent approval={approval} /></EvidenceSection>}</div>;
}