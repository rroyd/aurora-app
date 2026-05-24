import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env.js';
import { AppError } from '@/utils/AppError.js';

export interface AuthUser {
  id: string;
  role: 'CUSTOMER' | 'ADMIN';
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

function readAccessToken(req: Request): string | null {
  const header = req.header('authorization');
  if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length).trim();
  const cookieToken = (req as Request & { cookies?: Record<string, string> }).cookies
    ?.access_token;
  return cookieToken ?? null;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = readAccessToken(req);
  if (!token) throw AppError.unauthenticated();
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload & {
      sub: string;
      role: AuthUser['role'];
    };
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    throw AppError.unauthenticated('Invalid or expired token');
  }
}

export const requireRole =
  (role: AuthUser['role']) => (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw AppError.unauthenticated();
    if (req.user.role !== role) throw AppError.forbidden();
    next();
  };

export function attachUserIfPresent(req: Request, _res: Response, next: NextFunction): void {
  const token = readAccessToken(req);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload & {
      sub: string;
      role: AuthUser['role'];
    };
    req.user = { id: payload.sub, role: payload.role };
  } catch {
    /* ignore — anonymous */
  }
  next();
}
