import { describe, expect, it } from 'vitest';
import { isValidMp3Blob } from '../src/audio-utils.js';

describe('isValidMp3Blob', () => {
  it('accepts a non-empty MP3 with an audio MIME type', async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'audio/mpeg' });
    await expect(isValidMp3Blob(blob)).resolves.toBe(true);
  });

  it('accepts an MP3 with an ID3 header when the server uses octet-stream', async () => {
    const blob = new Blob([new Uint8Array([0x49, 0x44, 0x33, 0x04, 0, 0, 0, 0])], {
      type: 'application/octet-stream'
    });
    await expect(isValidMp3Blob(blob)).resolves.toBe(true);
  });

  it('accepts an MPEG audio frame when no audio MIME type is provided', async () => {
    const blob = new Blob([new Uint8Array([0xff, 0xfb, 0x90, 0x64])]);
    await expect(isValidMp3Blob(blob)).resolves.toBe(true);
  });

  it('rejects an HTML error page returned with a non-audio MIME type', async () => {
    const blob = new Blob(['<html>Not found</html>'], { type: 'text/html' });
    await expect(isValidMp3Blob(blob)).resolves.toBe(false);
  });

  it('rejects empty and missing values', async () => {
    await expect(isValidMp3Blob(new Blob([]))).resolves.toBe(false);
    await expect(isValidMp3Blob(null)).resolves.toBe(false);
  });
});
