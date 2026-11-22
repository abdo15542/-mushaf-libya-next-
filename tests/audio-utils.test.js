import { describe, expect, it } from 'vitest';
import { isValidMp3Blob } from '../src/audio-utils.js';

describe('isValidMp3Blob', () => {
  it('accepts an MPEG audio frame even when the MIME type is audio/mpeg', async () => {
    const blob = new Blob([new Uint8Array([0xff, 0xfb, 0x90, 0x64, 0, 0, 0, 0])], {
      type: 'audio/mpeg'
    });
    await expect(isValidMp3Blob(blob)).resolves.toBe(true);
  });

  it('accepts an MPEG frame after an ID3v2 header with octet-stream MIME', async () => {
    // ID3v2 tag size = 0; the MPEG frame follows the 10-byte ID3 header.
    const blob = new Blob([
      new Uint8Array([0x49, 0x44, 0x33, 0x04, 0, 0, 0, 0, 0, 0]),
      new Uint8Array([0xff, 0xfb, 0x90, 0x64, 0, 0, 0, 0])
    ], { type: 'application/octet-stream' });
    await expect(isValidMp3Blob(blob)).resolves.toBe(true);
  });

  it('rejects an HTML error page returned with a non-audio MIME type', async () => {
    const blob = new Blob(['<html>Not found</html>'], { type: 'text/html' });
    await expect(isValidMp3Blob(blob)).resolves.toBe(false);
  });

  it('rejects arbitrary bytes even when the server labels them audio/mpeg', async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])], {
      type: 'audio/mpeg'
    });
    await expect(isValidMp3Blob(blob)).resolves.toBe(false);
  });

  it('rejects invalid MPEG header fields', async () => {
    const blob = new Blob([new Uint8Array([0xff, 0xff, 0xff, 0xff])]);
    await expect(isValidMp3Blob(blob)).resolves.toBe(false);
  });

  it('rejects empty and missing values', async () => {
    await expect(isValidMp3Blob(new Blob([]))).resolves.toBe(false);
    await expect(isValidMp3Blob(null)).resolves.toBe(false);
  });
});
