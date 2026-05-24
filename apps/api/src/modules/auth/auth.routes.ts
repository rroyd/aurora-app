import { Router } from 'express';
import { loginSchema, registerSchema } from '@shared/contracts';
import { requireAuth } from '@/middleware/auth.js';
import { authLimiter } from '@/middleware/rateLimit.js';
import { asyncHandler } from '@/utils/asyncHandler.js';
import { clearAuthCookies, setAccessCookie, setRefreshCookie } from './auth.cookies.js';
import type { AuthService } from './auth.service.js';

export function createAuthRouter(svc: AuthService): Router {
  const router = Router();

  router.post(
    '/register',
    authLimiter,
    asyncHandler(async (req, res) => {
      const input = registerSchema.parse(req.body);
      const { session, refreshToken } = await svc.register(input);
      setAccessCookie(res, session.accessToken);
      setRefreshCookie(res, refreshToken);
      res.status(201).json(session);
    }),
  );

  router.post(
    '/login',
    authLimiter,
    asyncHandler(async (req, res) => {
      const input = loginSchema.parse(req.body);
      const { session, refreshToken } = await svc.login(input);
      setAccessCookie(res, session.accessToken);
      setRefreshCookie(res, refreshToken);
      res.status(200).json(session);
    }),
  );

  router.post(
    '/refresh',
    authLimiter,
    asyncHandler(async (req, res) => {
      const cookies = (req as typeof req & { cookies?: Record<string, string> }).cookies ?? {};
      const refreshToken = cookies.refresh_token ?? '';
      const { session, refreshToken: newRefresh } = await svc.refresh(refreshToken);
      setAccessCookie(res, session.accessToken);
      setRefreshCookie(res, newRefresh);
      res.status(200).json(session);
    }),
  );

  router.post(
    '/logout',
    asyncHandler(async (req, res) => {
      const cookies = (req as typeof req & { cookies?: Record<string, string> }).cookies ?? {};
      const refreshToken = cookies.refresh_token ?? '';
      await svc.logout(refreshToken);
      clearAuthCookies(res);
      res.status(204).end();
    }),
  );

  router.get(
    '/me',
    requireAuth,
    asyncHandler(async (req, res) => {
      const user = await svc.me(req.user!.id);
      res.status(200).json(user);
    }),
  );

  return router;
}
