import type { BatchRow, Brief } from './reviewer-data';
import { logoDataUrl } from './benchmark-brand';
import { lineageSentence, questionGroups } from './reviewer-data';
import { dateLabel, filename, type Meta } from './predicate-chain';

export async function exportBriefPdf(brief: Brief, meta: Meta) {
  if (!brief.device) return;
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const device = brief.device;
  const width = 516;
  const sections: { title: string; text: string; size: number }[] = [
    { title: 'AT A GLANCE', text: [brief.product_code?.plain_name ?? brief.product_code?.fda_name ?? device.product_code ?? 'FDA category', brief.product_code?.plain_description, `${device.knumber} | ${device.device_name ?? '—'}`, `${device.applicant ?? '—'} | Cleared ${dateLabel(device.decision_date)} | Class ${device.device_class ?? '—'}`, `Product code ${device.product_code ?? '—'} | Regulation ${device.regulation_number ?? '—'} | ${brief.pattern}`].filter(Boolean).join('\n'), size: 9 },
    { title: 'FDA-CLEARED USE', text: brief.ifu?.found && brief.ifu.ifu_text ? `${brief.ifu.ifu_text.slice(0, 600)}${brief.ifu.ifu_text.length > 600 ? '…' : ''}\nFrom the 510(k) Indications for Use, page ${brief.ifu.page ?? '—'}` : 'Indications for Use not found in the summary. See the FDA PDF.', size: 8.5 },
    { title: 'CLEARED AS EQUIVALENT TO — TOP 5', text: (brief.direct_predicates ?? []).slice(0, 5).map(p => `${p.predicate} | ${p.device_name ?? '—'} | ${p.applicant ?? '—'} | ${p.decision_year ?? '—'} | ${p.role === 'primary' ? 'Primary' : 'Additional'}`).join('\n') || 'No numbered predicates on file.', size: 8 },
    { title: 'TECHNOLOGY LINE', text: `${lineageSentence(brief.lineage)} ${brief.lineage.stopped_by_limit ? 'Generation limit reached.' : brief.lineage.ends_at?.stop ? `Record stops here: ${brief.lineage.ends_at.stop}.` : ''}`, size: 8.5 },
    { title: 'PEERS & CATEGORY', text: `${brief.peers.total} peer clearances | ${brief.peers.other_companies} other companies\n${brief.category?.total ?? '—'} category clearances | ${brief.category?.last5_clearances ?? '—'} clearances and ${brief.category?.last5_companies ?? '—'} companies in the last five years`, size: 8.5 },
  ];
  const layouts = sections.map(section => { doc.setFontSize(section.size); return { ...section, lines: doc.splitTextToSize(section.text, width) as string[] }; });
  const naturalHeight = layouts.reduce((sum, section) => sum + 26 + section.lines.length * section.size * 1.2, 0);
  const scale = Math.min(1, 610 / naturalHeight);
  const image = new Image(); image.src = logoDataUrl; await image.decode();
  const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 128;
  const context = canvas.getContext('2d'); if (!context) throw new Error('The PDF logo could not be prepared.');
  context.drawImage(image, 0, 0, 128, 128);
  doc.addImage(canvas.toDataURL('image/png'), 'PNG', 48, 32, 28, 28);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(17); doc.text('Ortho', 85, 51);
  const wordWidth = doc.getTextWidth('Ortho'); doc.setFont('helvetica', 'normal'); doc.text('Parity', 85 + wordWidth, 51);
  let y = 84;
  for (const section of layouts) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9 * scale); doc.text(section.title, 48, y); y += 13 * scale;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(section.size * scale);
    doc.text(section.lines, 48, y, { lineHeightFactor: 1.2 });
    y += (section.lines.length * section.size * 1.2 + 13) * scale;
  }
  // Device-specific questions occupy remaining space on page 1; continuation uses two columns.
  const groups = questionGroups(brief);
  let column = -1;
  let x = 48;
  let questionWidth = 516;
  function nextQuestionColumn() {
    if (column === 0) { column = 1; x = 318; }
    else { doc.addPage(); column = 0; x = 48; }
    questionWidth = 246; y = 46;
  }
  function heading(text: string) {
    if (y > 690) nextQuestionColumn();
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.text(text, x, y); y += 16;
  }
  heading('QUESTIONS TO ASK THE VENDOR');
  for (const [groupIndex, group] of groups.entries()) {
    if (groupIndex === 1) { if (column < 0) nextQuestionColumn(); heading('STANDARD VAC QUESTIONS'); }
    heading(group.topic);
    for (const item of group.items) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      let lines = doc.splitTextToSize(`${item.id + 1}. ${item.question}`, questionWidth) as string[];
      if (y + lines.length * 10 + 8 > 712) {
        nextQuestionColumn(); heading(`${group.topic} (continued)`);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
        lines = doc.splitTextToSize(`${item.id + 1}. ${item.question}`, questionWidth) as string[];
      }
      doc.text(lines, x, y, { lineHeightFactor: 1.25 }); y += lines.length * 10 + 9;
    }
    y += 8;
  }
  for (let page = 1; page <= doc.getNumberOfPages(); page++) {
    doc.setPage(page); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.text(`Data as of ${meta.exported_utc ?? '—'} | Parser ${meta.parser_version ?? '—'} | Page ${page}`, 48, 742);
    doc.text('OrthoParity. Independent research from public FDA data. Not affiliated with FDA. Not regulatory advice.', 48, 755);
  }
  doc.save(`${filename(device.knumber, new Date().toISOString().slice(0, 10))}_Brief.pdf`);
}
const batchFields = ['knumber', 'found', 'plain_name', 'device_name', 'applicant', 'decision_year', 'product_code', 'pattern', 'direct_predicates', 'primary_predicate', 'stop_reason', 'summary_url'] as const;
// Quoting and neutralizing formula prefixes prevents pasted research data becoming spreadsheet formulas.
export function csvCell(value: unknown) { const text = String(value ?? ''); return `"${text.match(/^[=+@\-\t\r]/) ? "'" : ''}${text.replace(/"/g, '""')}"`; }
export function batchCsv(rows: BatchRow[]) { return [batchFields.join(','), ...rows.map(row => batchFields.map(key => csvCell(row[key])).join(','))].join('\r\n'); }
export async function exportBatch(rows: BatchRow[], type: 'csv' | 'xlsx') {
  const name = `OrthoParity_Batch_${new Date().toISOString().slice(0, 10)}`;
  if (type === 'xlsx') {
    const XLSX = await import('xlsx'); const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([Array.from(batchFields), ...rows.map(row => batchFields.map(key => row[key] ?? ''))]), 'Device Briefs');
    XLSX.writeFile(book, `${name}.xlsx`);
  } else {
    const url = URL.createObjectURL(new Blob([batchCsv(rows)], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `${name}.csv`; link.click(); URL.revokeObjectURL(url);
  }
}
