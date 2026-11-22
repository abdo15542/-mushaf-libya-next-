import { describe, expect, it } from 'vitest';
import { connectionStatusText } from '../src/offline-status.js';

describe('connectionStatusText', () => {
  it('explains that cached files remain available while online', () => {
    expect(connectionStatusText(true)).toContain('متصل بالإنترنت');
  });

  it('explains offline availability without promising uncached files', () => {
    const message = connectionStatusText(false);
    expect(message).toContain('غير متصل');
    expect(message).toContain('سبق حفظها');
  });
});
