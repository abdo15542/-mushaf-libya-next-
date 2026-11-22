import { describe, expect, it } from 'vitest';
import { getSurahMetadata, QALUN_TOTAL_AYAHS, surahMetadata } from '../src/surah-metadata.js';

describe('Qalun surah metadata index', () => {
  it('contains all 114 surahs in canonical order', () => {
    expect(surahMetadata).toHaveLength(114);
    expect(surahMetadata[0]).toMatchObject({ number: 1, name: 'الفاتحة', ayahCount: 7 });
    expect(surahMetadata[1]).toMatchObject({ number: 2, ayahCount: 285 });
    expect(surahMetadata[113]).toMatchObject({ number: 114, name: 'الناس', ayahCount: 6 });
  });

  it('uses the last Madani numbering total for Qalun', () => {
    expect(QALUN_TOTAL_AYAHS).toBe(6214);
    expect(surahMetadata.reduce((sum, surah) => sum + surah.ayahCount, 0)).toBe(QALUN_TOTAL_AYAHS);
    expect(surahMetadata.every(surah => surah.numbering === 'العد المدني الأخير')).toBe(true);
  });

  it('returns null for invalid surah numbers', () => {
    expect(getSurahMetadata(0)).toBeNull();
    expect(getSurahMetadata(115)).toBeNull();
    expect(getSurahMetadata('abc')).toBeNull();
  });
});
