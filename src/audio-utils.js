/**
 * فحص محافظ لملفات MP3 قبل تخزينها محليًا.
 * يقبل MIME الصوتي المعروف، أو ترويسة ID3 / إطار MPEG عند غياب MIME موثوق.
 */
export async function isValidMp3Blob(blob) {
  if (!blob || typeof blob.size !== 'number' || blob.size < 4 ||
      typeof blob.slice !== 'function') return false;

  const mime = String(blob.type || '').toLowerCase().split(';')[0].trim();
  if (mime.startsWith('audio/')) {
    return mime === 'audio/mpeg' || mime === 'audio/mp3' ||
      mime === 'audio/x-mpeg' || mime === 'audio/mpg';
  }

  // بعض خوادم الملفات ترسل MP3 بنوع application/octet-stream.
  // في هذه الحالة نتحقق من ترويسة الملف بدل رفضه بسبب MIME.
  const bytes = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
  const hasId3 = bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33;
  const hasMpegFrame = bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
  return hasId3 || hasMpegFrame;
}
