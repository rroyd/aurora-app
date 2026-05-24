export interface RetryOptions {
  attempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  /** Return true to retry. Default: retry every error. */
  shouldRetry?: (err: unknown, attempt: number) => boolean;
  /** Notified on each failed attempt before the delay. */
  onRetry?: (err: unknown, attempt: number, delayMs: number) => void;
}

const DEFAULTS = {
  baseDelayMs: 100,
  maxDelayMs: 2_000,
  shouldRetry: () => true,
} satisfies Partial<RetryOptions>;

/**
 * Exponential backoff with full jitter.
 *
 * Use only for idempotent operations. Do NOT use to retry a charge/order — the
 * upstream may have succeeded and a retry would double-charge. For
 * non-idempotent calls, use withTimeout + an Idempotency-Key on the upstream.
 */
export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  opts: RetryOptions,
): Promise<T> {
  const { attempts, baseDelayMs, maxDelayMs } = { ...DEFAULTS, ...opts };
  const shouldRetry = opts.shouldRetry ?? DEFAULTS.shouldRetry;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastErr = err;
      const lastAttempt = attempt === attempts;
      if (lastAttempt || !shouldRetry(err, attempt)) throw err;
      const exp = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
      const delay = Math.floor(Math.random() * exp);
      opts.onRetry?.(err, attempt, delay);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}
