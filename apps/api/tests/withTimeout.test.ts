import { describe, expect, it } from 'vitest';
import { TimeoutError, withTimeout } from '@/utils/withTimeout.js';

describe('withTimeout', () => {
  it('resolves with the value when the promise settles in time', async () => {
    const result = await withTimeout(Promise.resolve(42), 1000);
    expect(result).toBe(42);
  });

  it('rejects with TimeoutError when the promise is slower than the deadline', async () => {
    const slow = new Promise<string>((resolve) => setTimeout(() => resolve('late'), 100));
    await expect(withTimeout(slow, 20, 'slow.op')).rejects.toThrow(TimeoutError);
  });

  it('exposes the operation name on the timeout error', async () => {
    const slow = new Promise<string>((resolve) => setTimeout(() => resolve('late'), 100));
    await expect(withTimeout(slow, 20, 'slow.op')).rejects.toMatchObject({
      operation: 'slow.op',
      ms: 20,
    });
  });

  it('propagates the original rejection, not a timeout, when the promise fails fast', async () => {
    const failing = Promise.reject(new Error('boom'));
    await expect(withTimeout(failing, 100)).rejects.toThrow('boom');
  });

  it('clears its timer so a Node process can exit cleanly after success', async () => {
    const before = process.getActiveResourcesInfo?.().filter((r) => r === 'Timeout').length ?? 0;
    await withTimeout(Promise.resolve(true), 1000);
    const after = process.getActiveResourcesInfo?.().filter((r) => r === 'Timeout').length ?? 0;
    expect(after).toBeLessThanOrEqual(before);
  });
});
