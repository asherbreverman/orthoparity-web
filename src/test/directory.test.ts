import { describe, expect, it } from 'vitest';
import { deviceClassLabel, directoryCsv, directoryCsvName, distributionText, filterRows, ownerDiffers, pageOf, sortRows, type DirectoryRow } from '@/lib/directory';

const row = (over: Partial<DirectoryRow>): DirectoryRow => ({ number: 'K1', pathway: '510(k)', product: 'A', device_name: 'A full', filer: 'Zimmer', owner_id: 'zimmer_biomet', owner_name: 'Zimmer Biomet', decision_date: '2024-01-01', gudid_brand: null, gudid_devices: 0, gudid_in_distribution: 0, ...over });

describe('category directory rules', () => {
  it('paginates at 100 rows', () => {
    const rows = Array.from({ length: 1336 }, (_, i) => i);
    expect(pageOf(rows, 1).pages).toBe(14);
    expect(pageOf(rows, 14).rows).toHaveLength(36);
  });
  it('sorts by decision date newest first', () => {
    const rows = [row({ number: 'K1', decision_date: '2020-01-01' }), row({ number: 'K2', decision_date: '2025-01-01' })];
    expect(sortRows(rows, { col: 'date', dir: -1 }, r => r.decision_date).map(r => r.number)).toEqual(['K2', 'K1']);
  });
  it('filters by brand', () => {
    expect(filterRows([row({ gudid_brand: 'Veritas' }), row({ number: 'K9' })], 'veritas')).toHaveLength(1);
  });
  it('shows the owner once when it is the same company as the filer', () => {
    expect(ownerDiffers(row({ filer: 'restor3d', owner_name: 'restor3d' }))).toBe(false);
    expect(ownerDiffers(row({ filer: 'Encore Medical L.P.', owner_name: 'Enovis (DJO)' }))).toBe(true);
  });
  it('writes distribution counts', () => {
    expect(distributionText(row({ gudid_devices: 12, gudid_in_distribution: 12 }))).toBe('12 of 12 device IDs');
    expect(distributionText(row({}))).toBe('None listed');
  });
  it('labels device class only when FDA prints a number', () => {
    expect(deviceClassLabel(2)).toBe('Class 2');
    expect(deviceClassLabel('3')).toBe('Class 3');
    expect(deviceClassLabel('HDE')).toBe('HDE');
    expect(deviceClassLabel('Unclassified')).toBe('Unclassified');
    expect(deviceClassLabel(null)).toBe('NOT FOUND');
  });
  it('writes the CSV header, columns and file name', () => {
    const csv = directoryCsv('PHX', 'Shoulder', [row({})], 'Nov 24, 2026').split('\n');
    expect(csv[0]).toBe('OrthoParity category directory, PHX Shoulder, generated Nov 24, 2026 from public FDA data. A listing is a regulatory fact, not a ranking.');
    expect(csv[1]).toBe('number,pathway,product,device_name,filer,owner,decision_date,gudid_brand,gudid_devices,gudid_in_distribution');
    expect(directoryCsvName('PHX', new Date('2026-11-24T12:00:00Z'))).toBe('orthoparity-PHX-2026-11-24.csv');
  });
});
