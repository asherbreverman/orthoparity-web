// One mark, three renderings, all from the same contents: currentColor inline (header, About,
// PDF header), explicit near-black ink when rasterized for PDFs, and white on a black tile for
// the favicon, apple-touch icon and Open Graph image.
export const logoContents = '<circle cx="32" cy="27" r="12" fill="currentColor"/><path d="M13.29 23.70 A19 19 0 1 0 50.71 23.70" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>';
const svgWith = (contents: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="OrthoParity">${contents}</svg>`;
export const logoSvg = svgWith(logoContents);
// A rasterized data URL cannot resolve currentColor, so the PDF mark carries explicit ink.
export const logoDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgWith(logoContents.replace(/currentColor/g, '#0A0A0A')))}`;
export const faviconSvg = svgWith(`<rect width="64" height="64" rx="14" fill="#0A0A0A"/><g transform="translate(32 32) scale(0.78) translate(-32 -32)">${logoContents.replace(/currentColor/g, '#FFFFFF')}</g>`);
// One tab-title shape everywhere: page name, separator, brand. Matches the procedure pages.
export const pageTitle = (name: string) => `${name} | OrthoParity`;
export const benchmarkTitle = pageTitle('Know what the vendor knows: free orthopedic device and vendor benchmarks');
export const benchmarkDescription = 'Their public record plus your private pricing. Benchmark any new orthopedic product or vendor yourself, without a GPO. Free, open-source briefs built from public FDA and CMS data. OrthoParity never asks for your pricing.';
export const benchmarkOrigin = 'https://www.orthoparity.com';
