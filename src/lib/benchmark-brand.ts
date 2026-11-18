// The provided mark is intentionally unchanged, shared by the page, favicon, and PDF.
export const logoContents = '<rect width="64" height="64" rx="15" fill="#0A0A0A"/><g fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"><circle cx="17" cy="26" r="8"/><circle cx="45" cy="26" r="8"/><line x1="37" y1="18" x2="37" y2="47"/></g>';
export const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="OrthoParity">${logoContents}</svg>`;
export const logoDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(logoSvg)}`;
export const benchmarkTitle = 'OrthoParity: orthopedic device and vendor benchmarks';
export const benchmarkDescription = 'OrthoParity offers free, open-source orthopedic device and vendor benchmarks, built from public FDA and CMS data.';
export const benchmarkOrigin = 'https://open-ortho-benchmark.lovable.app';