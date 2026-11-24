// One mark, three renderings, all from the same contents: currentColor inline (header, About,
// PDF header), explicit near-black ink when rasterized for PDFs, and white on a black tile for
// the favicon, apple-touch icon and Open Graph image.
export const logoContents = '<circle class="ring" cx="13" cy="13" r="11" fill="none" stroke="currentColor" stroke-width="2.4"/><path class="bar" d="M5 13h16" stroke="currentColor" stroke-width="2.4"/><circle class="dot" cx="13" cy="13" r="3.2" fill="currentColor"/>';
const svgWith = (contents: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 26" role="img" aria-label="OrthoParity">${contents}</svg>`;
export const logoSvg = svgWith(logoContents);
// A rasterized data URL cannot resolve currentColor, so the PDF mark carries explicit ink.
export const logoDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgWith(logoContents.replace(/currentColor/g, '#0A0A0A')))}`;
export const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="OrthoParity"><rect width="64" height="64" rx="14" fill="#0A0A0A"/><g transform="translate(9 9) scale(1.77)">${logoContents.replace(/currentColor/g, '#FFFFFF')}</g></svg>`;
// One tab-title shape everywhere: page name, separator, brand. Matches the procedure pages.
export const pageTitle = (name: string) => `${name} | OrthoParity`;
export const benchmarkTitle = 'OrthoParity: orthopedic part, product and company benchmarks from public FDA and CMS data';
export const benchmarkDescription = 'Their public record plus your private pricing. Look up any orthopedic part, product or company, or put them side by side. Free and open source, built only from public FDA and CMS data. OrthoParity never asks for your pricing.';
export const benchmarkOrigin = 'https://www.orthoparity.com';
