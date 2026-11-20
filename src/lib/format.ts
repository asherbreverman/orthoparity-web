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