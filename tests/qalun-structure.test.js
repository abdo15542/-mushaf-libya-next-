import { describe, expect, it } from 'vitest';
import { getQalunSectionRange, locateQalunAyahId, QALUN_HIZB_STARTS, QALUN_JUZ_STARTS, QALUN_RUB_STARTS } from '../src/qalun-structure.js';

describe('Qalun structural index', () => {
  it('contains all juz, hizb and rub boundaries', () => {
    expect(QALUN_JUZ_STARTS).toHaveLength(32);
    expect(QALUN_HIZB_STARTS).toHaveLength(62);
    expect(QALUN_RUB_STARTS).toHaveLength(242);
    for (const list of [QALUN_JUZ_STARTS, QALUN_HIZB_STARTS, QALUN_RUB_STARTS]) {
      expect(list[0]).toBe(0);
      expect(list.at(-1)).toBe(6215);
      expect(list.every((value, index) => index === 0 || value > list[index - 1])).toBe(true);
    }
  });

  it('maps linear Qalun ayah IDs to surah and ayah coordinates', () => {
    expect(locateQalunAyahId(1)).toMatchObject({ surahNumber: 1, ayahNumber: 1 });
    expect(locateQalunAyahId(8)).toMatchObject({ surahNumber: 2, ayahNumber: 1 });
    expect(locateQalunAyahId(293)).toMatchObject({ surahNumber: 3, ayahNumber: 1 });
    expect(locateQalunAyahId(6214)).toMatchObject({ surahNumber: 114, ayahNumber: 6 });
    expect(locateQalunAyahId(0)).toBeNull();
    expect(locateQalunAyahId(6215)).toBeNull();
  });

  it('returns accurate first and last coordinates for sections', () => {
    expect(getQalunSectionRange('juz', 1)).toMatchObject({ first: { surahNumber: 1, ayahNumber: 1 }, last: { surahNumber: 2, ayahNumber: 140 } });
    expect(getQalunSectionRange('juz', 30)).toMatchObject({ first: { surahNumber: 78, ayahNumber: 1 }, last: { surahNumber: 114, ayahNumber: 6 } });
    expect(getQalunSectionRange('hizb', 0)).toBeNull();
    expect(getQalunSectionRange('rub', 240)).not.toBeNull();
    expect(getQalunSectionRange('rub', 240)).toMatchObject({ first: { surahNumber: 100, ayahNumber: 9 }, last: { surahNumber: 114, ayahNumber: 6 } });
  });
});
