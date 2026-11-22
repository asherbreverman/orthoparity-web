const uppercaseNameTokens = new Set('CR PS PS2 HA PEEK MIS ALIF LLIF TLIF PLIF XLIF ACL PCL PK UHMWPE TKA THA UKA SI USA US II III IV 3D AR MR CT NTAP SI-BONE PFN PFNA DBM PMMA CMF TMJ VBR IBF PSI ACDF OLIF MP EBI MRI GPS CD LCP TSRH LDR TCP DHS DCP SMR GMK CMC MTP DBX NCB LPS PSS FMS BSM'.split(' '));
const smallNameWords = new Set('and or of for the with to in'.split(' '));

/** Presentation only: preserve filed spelling, punctuation and mixed-case names. */
export function displayName(text: string): string {
  const normalized = text.replace(/\(R\)/gi, '®').replace(/\(TM\)/gi, '™').replace(/\(([a-z]{2,4})\)/gi, (_, word: string) => `(${word.toUpperCase()})`);
  const letters = normalized.match(/\p{L}/gu) ?? [];
  const uppercase = letters.filter(letter => letter === letter.toUpperCase() && letter !== letter.toLowerCase()).length;
  if (letters.length <= 4 || uppercase / letters.length < 0.8) return normalized;
  let firstWord = true;
  return normalized.replace(/[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*/gu, (word, offset: number) => {
    const isFirst = firstWord;
    firstWord = false;
    const upper = word.toUpperCase();
    if (/^(MM|CM|KG|ML)$/.test(upper)) return word.toLowerCase();
    if (/^[B-DF-HJ-NP-TVWXZ]{2,4}$/.test(upper)) return upper;
    if (uppercaseNameTokens.has(upper) || /\p{N}/u.test(word) || (word.length >= 2 && word.length <= 4 && normalized[offset - 1] === '(' && normalized[offset + word.length] === ')')) return upper;
    return word.split('-').map((part, index) => {
      const token = part.toUpperCase();
      if (/^(MM|CM|KG|ML)$/.test(token)) return part.toLowerCase();
      if (/^[B-DF-HJ-NP-TVWXZ]{2,4}$/.test(token)) return token;
      if (uppercaseNameTokens.has(token)) return token;
      const lower = part.toLowerCase();
      if (smallNameWords.has(lower) && !(isFirst && index === 0)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    }).join('-');
  });
}

const legalSuffixes = [
  'GmbH & Co. KG', 'Private Limited', 'S.A. de C.V.', 'Co., Ltd', 'Co. Ltd', 'Co Ltd',
  'Pvt. Ltd', 'Pty Ltd', 'Incorporated', 'Corporation', 'Limited', 'L.L.C.', 'S.A.S.',
  'S.R.L.', 'S.p.A.', 'GmbH', 'Corp', 'Inc', 'LLC', 'Ltd', 'S.A.', 'B.V.', 'N.V.',
  'L.P.', 'PLC', 'SAS', 'Pty', 'ULC', 'UC', 'NV', 'AG', 'LP', 'SE',
];
const legalSuffixPattern = new RegExp(`(?:\\s*,\\s*|\\s+)(?:${legalSuffixes.map(suffix => suffix.replace(/\./g, '\\.?' ).replace(/ /g, '\\s+')).join('|')})\\.?\\s*$`, 'i');

/** Strip terminal legal forms only; leave source records and internal spelling intact. */
export function companyName(text: string): string {
  let name = text.replace(/,(?=\S)/g, ', ').trim();
  while (true) {
    const next = name.replace(legalSuffixPattern, '').trim();
    if (next === name) return displayName(name);
    name = next;
  }
}

export function shortDeviceName(name: string, max = 70): string {
  let text = name.replace(/\s+/g, ' ').trim().replace(/[,;]+$/, '').trim();
  if (text.length <= max) return text;
  const first = text.split(/[,;]/, 1)[0] ?? text;
  if (first.length >= 15 && first.trim().split(/\s+/).length >= 2) text = first.trim();
  if (text.length <= max) return text;
  const space = text.lastIndexOf(' ', max);
  text = text.slice(0, space > 0 ? space : max).replace(/[ ,;\-&(/]+$/, '');
  const opening = text.lastIndexOf('(');
  if (opening > text.lastIndexOf(')')) text = text.slice(0, opening).trim();
  return text.replace(/[ ,;\-&(/]+$/, '') + '…';
}

/** Long clearance titles retain the complete filed name separately in the view. */
export function productDisplayTitle(name: string): string {
  return displayName(name.length > 120 ? shortDeviceName(name, 90) : name);
}

export function productSentence(description: string, procedures?: string | string[] | null): string {
  const base = description.trim().replace(/\.+$/, '');
  const names = (Array.isArray(procedures) ? procedures : (procedures ?? '').split(/;|,|\s+and\s+/)).map(name => {
    const text = name.trim();
    const first = text.split(/\s+/, 1)[0] ?? '';
    return first && /[A-Z]/.test(first) && first === first.toUpperCase() ? text : text.charAt(0).toLowerCase() + text.slice(1);
  }).filter(Boolean);
  const joined = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0];
  return `${base}${joined ? `, used in ${joined}` : ''}.`;
}