import { Router } from 'express';
import { z } from 'zod';
import { addItemSchema, updateItemSchema } from '@shared/contracts';
import { requireAuth } from '@/middleware/auth.js';
import { asyncHandler } from '@/utils/asyncHandler.js';
import type { CartService } from './cart.service.js';

const productIdParam = z.object({ productId: z.string().min(1) });
const mergeBody = z.object({
  items: z
    .array(z.object({ productId: z.string().min(1), quantity: z.number().int().min(1).max(99) }))
    .max(100),
});

export function createCartRouter(svc: CartService): Router {
  const router = Router();
  router.use(requireAuth);

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      res.json(await svc.get(req.user!.id));
    }),
  );

  router.post(
    '/items',
    asyncHandler(async (req, res) => {
      const input = addItemSchema.parse(req.body);
      const cart = await svc.addItem(req.user!.id, input.productId, input.quantity);
      res.status(201).json(cart);
    }),
  );

  router.patch(
    '/items/:productId',
    asyncHandler(async (req, res) => {
      const { productId } = productIdParam.parse(req.params);
      const input = updateItemSchema.parse(req.body);
      const cart = await svc.updateItem(req.user!.id, productId, input.quantity);
      res.json(cart);
    }),
  );

  router.delete(
    '/items/:productId',
    asyncHandler(async (req, res) => {
      const { productId } = productIdParam.parse(req.params);
      const cart = await svc.removeItem(req.user!.id, productId);
      res.json(cart);
    }),
  );

  router.delete(
    '/',
    asyncHandler(async (req, res) => {
      const cart = await svc.clear(req.user!.id);
      res.json(cart);
    }),
  );

  router.post(
    '/merge',
    asyncHandler(async (req, res) => {
      const input = mergeBody.parse(req.body);
      const cart = await svc.merge(req.user!.id, input.items);
      res.json(cart);
    }),
  );

  return router;
}
