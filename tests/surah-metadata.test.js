import { describe, expect, it } from 'vitest';
import { getSurahMetadata, surahMetadata } from '../src/surah-metadata.js';

describe('surah metadata index', () => {
  it('contains all 114 surahs in canonical order', () => {
    expect(surahMetadata).toHaveLength(114);
    expect(surahMetadata[0]).toMatchObject({ number: 1, name: 'الفاتحة', ayahCount: 7 });
    expect(surahMetadata[113]).toMatchObject({ number: 114, name: 'الناس', ayahCount: 6 });
  });

  it('has the standard total of 6236 verses', () => {
    expect(surahMetadata.reduce((sum, surah) => sum + surah.ayahCount, 0)).toBe(6236);
  });

  it('returns null for invalid surah numbers', () => {
    expect(getSurahMetadata(0)).toBeNull();
    expect(getSurahMetadata(115)).toBeNull();
    expect(getSurahMetadata('abc')).toBeNull();
  });
});
