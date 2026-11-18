import {csvCell} from './reviewer-export';
import {logoDataUrl} from './benchmark-brand';
import {emptyProfile,dollars,natureColor,natureLabel,percent,ratio,type PortfolioRow,type VendorBrief,type ProductPayments} from './vendor-data';
import type {Meta} from './predicate-chain';
export interface SelectedBenchmark {row:PortfolioRow;pattern:string;plain_name:string;payments:ProductPayments}
const portfolioFields=['knumber','device_name','applicant','plain_name','fda_name','product_code','anatomy','kind','device_class','decision_date','gudid_brand','gudid_devices','gudid_in_distribution'] as const;
export function portfolioCsv(rows:PortfolioRow[]) {return [portfolioFields.join(','),...rows.map(r=>portfolioFields.map(k=>csvCell(r[k])).join(','))].join('\r\n');}
export function selectedCsv(rows:SelectedBenchmark[]) {return ['510k,category,pattern,device_id_payments,brand_match_payments,royalty',...rows.map(r=>[r.row.knumber,r.plain_name,r.pattern,r.payments.exact.total,r.payments.brand_match.total,r.payments.royalty].map(csvCell).join(','))].join('\r\n');}
export function downloadCsv(text:string,name:string) {const url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`Open_Ortho_Benchmark_${name}.csv`;a.click();URL.revokeObjectURL(url);}
export async function exportVendorPdf(brief:VendorBrief,meta:Meta) {
 const {jsPDF}=await import('jspdf');const doc=new jsPDF({unit:'pt',format:'letter'});let y=85;
 const image=new Image();image.src=logoDataUrl;await image.decode();const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('PDF logo unavailable.');ctx.drawImage(image,0,0,128,128);doc.addImage(canvas.toDataURL('image/png'),'PNG',48,30,28,28);doc.setFontSize(17);doc.text('Open Ortho Benchmark',85,50);
 function lines(text:string,size=9) {doc.setFont('helvetica','normal');doc.setFontSize(size);for(const line of doc.splitTextToSize(text,516) as string[]){if(y>705){doc.addPage();y=48;}doc.text(line,48,y);y+=size*1.4;}y+=7;}
 function heading(text:string){if(y>680){doc.addPage();y=48;}doc.setFont('helvetica','bold');doc.setFontSize(11);doc.text(text,48,y);y+=18;}
 heading(brief.vendor.display_name);lines(`${brief.vendor.current_parent ?? ''} | ${brief.vendor.segment ?? ''}\n${brief.mode==='current'?"Current owner, with acquired companies' history":'As owned at the time'}`);
 heading('AT A GLANCE & PORTFOLIO');lines(`${brief.portfolio.clearances} orthopedic 510(k)s | ${brief.portfolio.product_codes} product codes | ${brief.portfolio.gudid.brands} GUDID brands\n${brief.portfolio.gudid.devices} GUDID devices (${brief.portfolio.gudid.in_distribution} in distribution) | ${brief.portfolio.first_year}–${brief.portfolio.last_year}`);
 lines(brief.categories.slice(0,15).map(c=>`${c.product_code}: ${c.plain_name ?? c.fda_name} — ${c.clearances} clearances`).join('\n'));
 heading(`INDUSTRY PAYMENTS · ${brief.payments.latest_year ?? 'No matched records'}`);const p=brief.payments.profile_latest ?? emptyProfile;lines(`${dollars(p.total)} to ${p.recipients} recipients; ${p.royalty_r} royalty recipients`);
 // Resolve the shared CSS palette at download time, keeping the PDF in sync with on-page mixes.
 const mix=brief.payments.mix_latest;const sum=mix.reduce((s,r)=>s+r.amount,0);let x=48;if(y>675){doc.addPage();y=48;}
 const probe=document.createElement('span');document.body.appendChild(probe);
 for(const r of mix){if(r.amount<=0||sum<=0)continue;probe.style.color=natureColor(r.nature_group);const color=getComputedStyle(probe).color;const c=document.createElement('canvas');c.width=1;c.height=1;const cx=c.getContext('2d');if(cx){cx.fillStyle=color;cx.fillRect(0,0,1,1);const rgb=cx.getImageData(0,0,1,1).data;doc.setFillColor(rgb[0] ?? 0,rgb[1] ?? 0,rgb[2] ?? 0);}const w=516*r.amount/sum;doc.rect(x,y,w,14,'F');x+=w;}probe.remove();y+=27;
 lines(mix.map(r=>`${natureLabel(r.nature_group)}: ${dollars(r.amount)} (${percent(ratio(r.amount,sum))})`).join('\n'));
 heading('REPORTING ENTITIES · 2019 TO LATEST');for(const e of brief.payments.entities)lines(`${e.payer_name} | ${dollars(e.amount)} | Royalty ${e.royalty_pct}% | Food ${e.food_pct}% | ${e.profile} | ${e.first_year}–${e.last_year}`);
 heading('QUESTIONS TO ASK THE VENDOR');brief.questions.forEach((q,i)=>lines(`${i+1}. ${q}`));heading('SOURCES');lines('CMS Open Payments 2019–2025, published June 30, 2026. FDA GUDID November 2026. FDA 510(k) public data. Ownership source links:');brief.family.filter(f=>f.source_url).forEach(f=>lines(`${f.display_name} | since ${f.since ?? '—'} | ${f.source_url}`,8));
 for(let page=1;page<=doc.getNumberOfPages();page++){doc.setPage(page);doc.setFontSize(7);doc.setTextColor(80);doc.text(`Data as of ${meta.exported_utc ?? '—'} | CMS 2019–2025 | GUDID November 2026 | Page ${page}`,48,742);doc.text('Independent research. Not affiliated with FDA or CMS. Not regulatory advice. A payment is not a judgment.',48,755);}
 doc.save(`Open_Ortho_Benchmark_${brief.vendor.vendor_id}_Vendor.pdf`);
}
