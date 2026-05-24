import type { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '@/config/env.js';

const isTest = env.NODE_ENV === 'test';
const noop: RequestHandler = (_req, _res, next) => next();

export const authLimiter: RequestHandler = isTest
  ? noop
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 10,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts. Try again later.' } },
    });

export const globalLimiter: RequestHandler = isTest
  ? noop
  : rateLimit({
      windowMs: 5 * 60 * 1000,
      limit: 300,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { error: { code: 'RATE_LIMITED', message: 'Too many requests. Slow down.' } },
    });
