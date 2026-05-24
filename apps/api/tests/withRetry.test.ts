import { describe, expect, it, vi } from 'vitest';
import { withRetry } from '@/utils/withRetry.js';

describe('withRetry', () => {
  it('returns the first successful result without retrying', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(fn, { attempts: 3, baseDelayMs: 1, maxDelayMs: 5 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries until success up to the attempt limit', async () => {
    let calls = 0;
    const fn = vi.fn(async () => {
      calls += 1;
      if (calls < 3) throw new Error('transient');
      return 'recovered';
    });
    const result = await withRetry(fn, { attempts: 5, baseDelayMs: 1, maxDelayMs: 5 });
    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws the last error when all attempts fail', async () => {
    const fn = vi.fn(async () => {
      throw new Error('always-fails');
    });
    await expect(
      withRetry(fn, { attempts: 3, baseDelayMs: 1, maxDelayMs: 5 }),
    ).rejects.toThrow('always-fails');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('honors shouldRetry to bail out early on non-retryable errors', async () => {
    const fn = vi.fn(async () => {
      throw Object.assign(new Error('fatal'), { fatal: true });
    });
    await expect(
      withRetry(fn, {
        attempts: 5,
        baseDelayMs: 1,
        maxDelayMs: 5,
        shouldRetry: (err) => !(err as { fatal?: boolean }).fatal,
      }),
    ).rejects.toThrow('fatal');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('invokes onRetry hook with attempt and delay before the next try', async () => {
    const onRetry = vi.fn();
    let n = 0;
    const fn = async () => {
      n += 1;
      if (n < 2) throw new Error('flaky');
      return 'done';
    };
    await withRetry(fn, { attempts: 3, baseDelayMs: 1, maxDelayMs: 5, onRetry });
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry.mock.calls[0]?.[1]).toBe(1);
  });
});
