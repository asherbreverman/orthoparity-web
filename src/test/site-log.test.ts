import { describe, expect, it } from 'vitest';
import { releaseRss } from '@/lib/site-log';
import { fdaRecordNote } from '@/lib/fda-device';

describe('release notes feed', () => {
  it('lists items newest first with anchor links and RFC 822 dates', () => {
    const xml = releaseRss('https://www.orthoparity.com', [
      {id: 'a', released_on: '2026-01-02', title: 'Old & small', summary: 'x', data_release: null, url: null},
      {id: 'b', released_on: '2026-11-20', title: 'New', summary: 'y', data_release: null, url: null}]);
    expect(xml).toContain('<rss version="2.0"');
    expect(xml.indexOf('updates#b')).toBeLessThan(xml.indexOf('updates#a'));
    expect(xml).toContain('<pubDate>Fri, 20 Nov 2026 00:00:00 GMT</pubDate>');
    expect(xml).toContain('Old &amp; small');
  });
});
describe('FDA record note', () => {
  it('words each pathway', () => {
    expect(fdaRecordNote('510(k)')).toMatch(/^An FDA 510\(k\) clearance means FDA found the device substantially equivalent/);
    expect(fdaRecordNote('De Novo')).toMatch(/^A De Novo grant classifies .* It is not a finding that the device is better/);
    expect(fdaRecordNote('PMA')).toContain('It is not a comparison with other devices.');
    expect(fdaRecordNote('HDE')).toBe('A humanitarian device exemption allows a device for a rare condition based on probable benefit, without proof of effectiveness.');
  });
});
