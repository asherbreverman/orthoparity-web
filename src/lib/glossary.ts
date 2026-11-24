export const glossaryTerms = [
  { id: '510k', term: '510(k)', definition: 'FDA clearance that a device is substantially equivalent to one already on the market. Clearance is not a finding that it is better than others.' },
  { id: 'de-novo', term: 'De Novo', definition: "FDA's path for a new low-to-moderate-risk device with no predicate." },
  { id: 'pma', term: 'PMA', definition: "Premarket approval: FDA's review for Class III devices, based on the company's own clinical evidence." },
  { id: 'hde', term: 'HDE', definition: 'Humanitarian Device Exemption: approval for devices that treat rare conditions.' },
  { id: 'predicate', term: 'Predicate', definition: 'The already-cleared device a 510(k) says it is equivalent to. A chain of predicates shows lineage; the last device found is the earliest predicate on record.' },
  { id: 'product-code', term: 'Product code', definition: "FDA's three-letter code for a device category, such as MBH for porous uncemented total knees." },
  { id: 'gudid', term: 'GUDID', definition: "FDA's Global Unique Device Identification Database, where companies list each catalog item." },
  { id: 'udi-di', term: 'UDI-DI', definition: "The device identifier in a product's barcode; one per catalog item and package level." },
  { id: 'maude', term: 'MAUDE', definition: "FDA's adverse event reports. A report is not proof the device caused the event, and counts are not rates." },
  { id: 'recall-class', term: 'Recall class', definition: 'Class I is the most serious, Class III the least. FDA lists a recall as open until it formally terminates it.' },
  { id: 'oai', term: 'OAI', definition: "Official Action Indicated: FDA's most serious inspection classification. It describes one visit to one site." },
  { id: 'open-payments', term: 'Open Payments', definition: "CMS's public database of industry payments to physicians and teaching hospitals. OrthoParity shows totals, never names." },
  { id: 'ms-drg', term: 'MS-DRG', definition: "Medicare's grouping of inpatient stays that sets one payment per case." },
  { id: 'cpt-hcpcs', term: 'CPT and HCPCS', definition: 'Procedure codes; ASC and outpatient payments are set per code.' },
  { id: 'team', term: 'TEAM', definition: "Transforming Episode Accountability Model: Medicare's mandatory episode model for selected hospitals, 2026 to 2030." },
  { id: 'target-price', term: 'Target price', definition: "CMS's benchmark for all Medicare spending in a TEAM episode; not a device price." },
  { id: 'ntap', term: 'NTAP', definition: 'New Technology Add-on Payment: extra inpatient payment for a qualifying new technology, for a limited time.' },
  { id: 'ccn', term: 'CCN', definition: 'CMS Certification Number, the ID CMS uses for each hospital.' },
] as const;

export type GlossaryTermName = (typeof glossaryTerms)[number]['term'];

export function glossaryEntry(term: GlossaryTermName) {
  return glossaryTerms.find(entry => entry.term === term);
}
