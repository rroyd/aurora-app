import type { CookieOptions, Response } from 'express';
import { env } from '@/config/env.js';

const baseCookie: CookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: 'lax',
  domain: env.COOKIE_DOMAIN,
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
