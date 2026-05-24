import { config } from './config';

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;
  readonly requestId?: string;

  constructor(status: number, code: string, message: string, details?: unknown, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Don't attempt the silent refresh on a 401. Used by the refresh endpoint itself. */
  skipRefresh?: boolean;
}

let refreshInFlight: Promise<boolean> | null = null;

async function trySilentRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${config.apiBaseUrl}/v1/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export async function apiRequest<T>(path: string, opts: ApiRequestOptions = {}): Promise<T> {
  const url = `${config.apiBaseUrl}${path}`;
  const init: RequestInit = {
    method: opts.method ?? 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...opts.headers,
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  };

  let res = await fetch(url, init);

  if (res.status === 401 && !opts.skipRefresh) {
    const refreshed = await trySilentRefresh();
    if (refreshed) {
      res = await fetch(url, init);
    }
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const json = text ? (JSON.parse(text) as unknown) : undefined;

  if (!res.ok) {
    const body = (json ?? {}) as { error?: { code?: string; message?: string; details?: unknown; requestId?: string } };
    throw new ApiError(
      res.status,
      body.error?.code ?? 'INTERNAL',
      body.error?.message ?? res.statusText,
      body.error?.details,
      body.error?.requestId,
    );
  }
  return json as T;
}
