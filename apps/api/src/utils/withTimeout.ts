import { AppError } from './AppError.js';

export class TimeoutError extends Error {
  constructor(public readonly operation: string, public readonly ms: number) {
    super(`Operation "${operation}" timed out after ${ms}ms`);
    this.name = 'TimeoutError';
  }
}

/**
 * Race a promise against a timer. If the timer wins, the returned promise rejects
 * with TimeoutError. The underlying promise is NOT cancelled — wrap I/O in an
 * AbortController if you need actual cancellation.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  operation = 'operation',
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new TimeoutError(operation, ms)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Convert a TimeoutError to an AppError (502 Bad Gateway feels closer than 500 here). */
export function timeoutToAppError(err: unknown, operation: string): never {
  if (err instanceof TimeoutError) {
    throw new AppError('INTERNAL', 504, `Upstream timeout (${operation})`);
  }
  throw err;
}
