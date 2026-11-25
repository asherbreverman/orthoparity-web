import { describe, expect, it } from 'vitest';
import { chapterBeforeOffset } from '@/components/story-shared';

describe('record chapter offset', () => {
  it('uses the measured sticky header and rail boundary', () => {
    const sections = [{ id: 'chapter-recalls', top: 121 }, { id: 'chapter-maude', top: 240 }];
    expect(chapterBeforeOffset(sections, 120)).toBe('');
    expect(chapterBeforeOffset(sections, 121)).toBe('chapter-recalls');
    expect(chapterBeforeOffset(sections, 240)).toBe('chapter-maude');
  });
});
