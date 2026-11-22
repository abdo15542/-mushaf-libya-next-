import { surahMetadata, QALUN_TOTAL_AYAHS } from './surah-metadata.js';

// Qalun structural boundaries sourced from quran-meta QalunLists.
// IDs are one-based linear ayah IDs; 0 and 6215 are boundary sentinels.
export const QALUN_JUZ_STARTS = [0,1,148,258,383,516,639,751,901,1043,1203,1332,1483,1651,1808,2035,2218,2483,2670,2871,3211,3382,3558,3727,4081,4252,4491,4686,5083,5219,5649,6215];
export const QALUN_HIZB_STARTS = [0,1,82,148,208,258,307,383,463,516,578,639,692,751,826,901,957,1043,1127,1203,1272,1332,1394,1483,1560,1651,1730,1808,1957,2035,2133,2218,2349,2483,2594,2670,2809,2871,3038,3211,3299,3382,3485,3558,3624,3727,3927,4081,4163,4252,4332,4491,4581,4686,4879,5083,5155,5219,5428,5649,5924,6215];
export const QALUN_RUB_STARTS = [0,1,32,50,66,82,98,112,130,148,164,183,195,208,224,238,248,258,269,278,289,307,325,343,366,383,405,425,445,463,478,498,505,516,528,549,565,578,591,605,621,639,657,671,680,692,710,718,736,751,766,780,803,826,849,870,885,901,917,931,941,957,984,1002,1020,1043,1072,1098,1112,1127,1144,1167,1184,1203,1223,1243,1257,1272,1284,1299,1314,1332,1350,1362,1379,1394,1417,1439,1461,1483,1501,1518,1538,1560,1582,1608,1631,1651,1675,1699,1714,1730,1745,1766,1783,1808,1856,1907,1936,1957,1977,1996,2017,2035,2057,2084,2104,2133,2161,2176,2197,2218,2239,2270,2308,2349,2402,2429,2456,2483,2512,2533,2568,2594,2612,2629,2651,2670,2705,2745,2785,2809,2823,2839,2849,2871,2895,2928,2977,3038,3108,3159,3180,3211,3237,3259,3277,3299,3324,3343,3361,3382,3413,3435,3458,3485,3508,3533,3547,3558,3578,3587,3607,3624,3646,3669,3694,3727,3759,3804,3865,3927,3984,4015,4059,4081,4100,4123,4143,4163,4188,4214,4231,4252,4270,4290,4307,4332,4372,4422,4464,4491,4510,4535,4558,4581,4593,4606,4637,4686,4737,4788,4841,4879,4937,5033,5069,5083,5096,5114,5134,5155,5174,5190,5206,5219,5268,5339,5393,5428,5473,5529,5586,5649,5729,5790,5875,5924,6001,6068,6134,6215];

const cumulativeEnds = [];
let total = 0;
for (const surah of surahMetadata) {
  total += surah.ayahCount;
  cumulativeEnds.push(total);
}

export function locateQalunAyahId(ayahId) {
  const id = Number(ayahId);
  if (!Number.isInteger(id) || id < 1 || id > QALUN_TOTAL_AYAHS) return null;
  let low = 0;
  let high = cumulativeEnds.length - 1;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (id <= cumulativeEnds[mid]) high = mid;
    else low = mid + 1;
  }
  const previousEnd = low === 0 ? 0 : cumulativeEnds[low - 1];
  return { surahNumber: low + 1, surahName: surahMetadata[low].name, ayahNumber: id - previousEnd, ayahId: id };
}

const SECTION_CONFIG = {
  juz: { starts: QALUN_JUZ_STARTS, count: 30, label: 'الجزء' },
  hizb: { starts: QALUN_HIZB_STARTS, count: 60, label: 'الحزب' },
  rub: { starts: QALUN_RUB_STARTS, count: 240, label: 'ربع الحزب' }
};

export function getQalunSectionRange(type, number) {
  const config = SECTION_CONFIG[type];
  const n = Number(number);
  if (!config || !Number.isInteger(n) || n < 1 || n > config.count) return null;
  const firstAyahId = config.starts[n];
  const lastAyahId = config.starts[n + 1] - 1;
  const first = locateQalunAyahId(firstAyahId);
  const last = locateQalunAyahId(lastAyahId);
  if (!first || !last) return null;
  return { type, number: n, label: config.label, firstAyahId, lastAyahId, first, last };
}
