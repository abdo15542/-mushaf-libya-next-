/**
 * فحص محافظ لملفات MP3 قبل تخزينها محليًا.
 * لا نعتمد على Content-Type وحده؛ فقد يرسل الخادم صفحة خطأ مع MIME مضلل.
 * نقبل إطار MPEG Audio صالحًا بعد التحقق من حقول الرأس الأساسية.
 */
export async function isValidMp3Blob(blob) {
  if (!blob || typeof blob.size !== 'number' || blob.size < 4 ||
      typeof blob.slice !== 'function') return false;

  // يكفي عادةً العثور على أول إطار خلال أول 64 كيلوبايت،
  // حتى عند وجود وسم ID3v2 أو بيانات وصفية قبله.
  const bytes = new Uint8Array(await blob.slice(0, Math.min(blob.size, 65536)).arrayBuffer());

  for (let i = 0; i <= bytes.length - 4; i++) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    const b3 = bytes[i + 3];

    // 11 بت تزامن، إصدار MPEG صالح، طبقة صوت صالحة.
    if (b0 !== 0xff || (b1 & 0xe0) !== 0xe0) continue;
    const version = (b1 >> 3) & 0x03;
    const layer = (b1 >> 1) & 0x03;
    const bitrateIndex = (b2 >> 4) & 0x0f;
    const sampleRateIndex = (b2 >> 2) & 0x03;

    if (version === 0x01 || layer === 0x00 ||
        bitrateIndex === 0x00 || bitrateIndex === 0x0f ||
        sampleRateIndex === 0x03) continue;

    // حقل emphasis لا يجوز أن يكون القيمة المحجوزة 2.
    if ((b3 & 0x03) === 0x02) continue;

    return true;
  }

  return false;
}
