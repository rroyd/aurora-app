import type { CookieOptions, Response } from 'express';
import { env } from '@/config/env.js';

const baseCookie: CookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: 'lax',
  // Only set the domain attribute when explicitly configured. Omitting it
  // makes the cookie default to the request host, which is what we want for
  // localhost dev and for integration tests served by supertest on 127.0.0.1.
  ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
};

export function setAccessCookie(res: Response, token: string): void {
  res.cookie('access_token', token, {
    ...baseCookie,
    path: '/',
    maxAge: env.ACCESS_TOKEN_TTL * 1000,
  });
}

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie('refresh_token', token, {
    ...baseCookie,
    path: '/v1/auth',
    maxAge: env.REFRESH_TOKEN_TTL * 1000,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie('access_token', { ...baseCookie, path: '/' });
  res.clearCookie('refresh_token', { ...baseCookie, path: '/v1/auth' });
}
