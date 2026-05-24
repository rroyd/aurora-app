import { Router } from 'express';
import { z } from 'zod';
import { addressSchema, changePasswordSchema, updateProfileSchema } from '@shared/contracts';
import { requireAuth } from '@/middleware/auth.js';
import { asyncHandler } from '@/utils/asyncHandler.js';
import type { UsersService } from './users.service.js';

const addressIdParam = z.object({ addressId: z.string().min(1) });
const createAddressBody = addressSchema.extend({ isDefault: z.boolean().optional() });

export function createUsersRouter(svc: UsersService): Router {
  const router = Router();
  router.use(requireAuth);

  router.patch(
    '/me',
    asyncHandler(async (req, res) => {
      const input = updateProfileSchema.parse(req.body);
      await svc.updateProfile(req.user!.id, input);
      res.status(204).end();
    }),
  );

  router.post(
    '/me/password',
    asyncHandler(async (req, res) => {
      const input = changePasswordSchema.parse(req.body);
      await svc.changePassword(req.user!.id, input);
      res.status(204).end();
    }),
  );

  router.get(
    '/me/addresses',
    asyncHandler(async (req, res) => {
      const items = await svc.listAddresses(req.user!.id);
      res.json({ items });
    }),
  );

  router.post(
    '/me/addresses',
    asyncHandler(async (req, res) => {
      const input = createAddressBody.parse(req.body);
      const created = await svc.createAddress(req.user!.id, input);
      res.status(201).json(created);
    }),
  );

  router.delete(
    '/me/addresses/:addressId',
    asyncHandler(async (req, res) => {
      const { addressId } = addressIdParam.parse(req.params);
      await svc.deleteAddress(req.user!.id, addressId);
      res.status(204).end();
    }),
  );

  router.post(
    '/me/addresses/:addressId/default',
    asyncHandler(async (req, res) => {
      const { addressId } = addressIdParam.parse(req.params);
      await svc.setDefaultAddress(req.user!.id, addressId);
      res.status(204).end();
    }),
  );

  return router;
}
