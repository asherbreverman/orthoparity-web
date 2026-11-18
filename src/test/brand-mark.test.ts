import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { faviconSvg, logoContents, logoDataUrl } from '@/lib/benchmark-brand';

describe('OrthoParity mark', () => {
  it('uses currentColor for the inline mark and carries no tile', () => {
    expect(logoContents).toContain('currentColor');
    expect(logoContents).not.toContain('<rect');
  });

  it('hands exports a raster mark in near-black ink, never currentColor', () => {
    const svg = decodeURIComponent(logoDataUrl.replace('data:image/svg+xml;charset=utf-8,', ''));
    expect(svg).not.toContain('currentColor');
    expect(svg).toContain('#0A0A0A');
  });

  it('ships the served favicon as the white-on-tile version of the same mark', () => {
    const served = readFileSync(path.resolve(process.cwd(), 'public/favicon.svg'), 'utf8').trim();
    expect(served).toBe(faviconSvg);
  });
});
