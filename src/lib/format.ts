const uppercaseNameTokens = new Set('CR PS PS2 HA PEEK MIS ALIF LLIF TLIF PLIF XLIF ACL PCL PK UHMWPE TKA THA UKA SI USA US II III IV 3D AR MR CT NTAP SI-BONE'.split(' '));
const smallNameWords = new Set('and or of for the with to in'.split(' '));

/** Presentation only: preserve filed spelling, punctuation and mixed-case names. */
export function displayName(text: string): string {
  const letters = text.match(/\p{L}/gu) ?? [];
  const uppercase = letters.filter(letter => letter === letter.toUpperCase() && letter !== letter.toLowerCase()).length;
  if (letters.length <= 4 || uppercase / letters.length < 0.8) return text;
  let firstWord = true;
  return text.replace(/[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*/gu, word => {
    const isFirst = firstWord;
    firstWord = false;
    const upper = word.toUpperCase();
    if (uppercaseNameTokens.has(upper) || /\p{N}/u.test(word)) return upper;
    return word.split('-').map((part, index) => {
      const token = part.toUpperCase();
      if (uppercaseNameTokens.has(token)) return token;
      const lower = part.toLowerCase();
      if (smallNameWords.has(lower) && !(isFirst && index === 0)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    }).join('-');
  });
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