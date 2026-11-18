import {describe,it,expect} from 'vitest';
import {money,natureLabel,paymentSeries,filterPortfolio,studyNumbers,ratio,emptyProfile,withPaymentQuestions} from '@/lib/vendor-data';
import {portfolioCsv} from '@/lib/vendor-export';
describe('Vendor and payment rules',()=>{
 it('formats compact dollars as requested',()=>{expect(money(1200000)).toBe('$1.2M');expect(money(45000)).toBe('$45K');});
 it('preserves cent-sized positive payments instead of displaying zero',()=>{expect(money(0.01)).toBe('$0.01');expect(money(0.49)).toBe('$0.49');expect(money(0.99)).toBe('$0.99');expect(money(0)).toBe('None');});
 it('keeps billion-dollar payments finite in compact and exact displays',()=>{expect(money(1234567890.12)).toBe('$1234.6M');});
 it('keeps the fixed payment labels consistent',()=>{expect(natureLabel('royalty')).toBe('Royalties');expect(natureLabel('services')).toBe('Services (non-consulting)');expect(natureLabel('debt_forgiveness')).toBe('Debt forgiveness');});
 it('separates device-ID and brand amounts and includes 2019 through 2025',()=>{const rows=paymentSeries([{year:2021,nature_group:'royalty',amount:120}],2019,2025,[{year:2021,nature_group:'royalty',amount:45}]);expect(rows).toHaveLength(7);expect(rows[0]?.['year']).toBe(2019);expect(rows[6]?.['year']).toBe(2025);expect(rows[2]?.['royalty']).toBe(120);expect(rows[2]?.['royalty_brand']).toBe(45);});
 it('applies anatomy kind and product-code filters together',()=>{const rows=[{knumber:'K253876',device_name:'HEDRON',product_code:'MAX',decision_date:null,anatomy:'Spine',kind:'implant'},{knumber:'K110694',device_name:'CONCORDE',product_code:'MAX',decision_date:null,anatomy:'Spine',kind:'instrument'}];expect(filterPortfolio(rows,'Spine','implant','MAX','hedron').map(r=>r.knumber)).toEqual(['K253876']);expect(filterPortfolio(rows,'Hip','','','')).toEqual([]);});
 it('opens only valid clearance numbers from pipe-separated studies',()=>{expect(studyNumbers({study_name:'Study',amount:0,first_year:2019,last_year:2025,knumbers:'K110694|K253876|bad'})).toEqual(['K110694','K253876']);});
 it('adds payment questions to device-specific questions',()=>{expect(withPaymentQuestions({questions:['FDA question']},{questions:['Payments question']} as Parameters<typeof withPaymentQuestions>[1]).questions).toEqual(['FDA question','Payments question']);});
 it('uses zero aggregates for vendors with no matched payments',()=>{expect(emptyProfile.total).toBe(0);expect(emptyProfile.recipients).toBe(0);expect(emptyProfile.bucket_json).toEqual([]);});
 it('handles empty conversion denominators without infinity',()=>{expect(ratio(10,0)).toBe(0);expect(ratio(25,100)).toBe(0.25);});
 it('exports only portfolio fields, excluding any unexpected recipient identifiers',()=>{const csv=portfolioCsv([{knumber:'K253876',device_name:'=TEST',product_code:'MAX',decision_date:null,recipient_name:'PRIVATE',npi:'1234567890'} as Parameters<typeof portfolioCsv>[0][number]]);expect(csv).not.toContain('PRIVATE');expect(csv).not.toContain('1234567890');expect(csv).toContain('"\'=TEST"');});
});
