import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { createOrderSchema, listOrdersQuerySchema } from '@shared/contracts';
import { requireAuth } from '@/middleware/auth.js';
import { AppError } from '@/utils/AppError.js';
import { asyncHandler } from '@/utils/asyncHandler.js';
import type { OrdersService } from './orders.service.js';

const orderIdParam = z.object({ orderId: z.string().min(1) });

export function createOrdersRouter(
  svc: OrdersService,
  getUserEmail: (userId: string) => Promise<string>,
): Router {
  const router = Router();
  router.use(requireAuth);

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const idempotencyKey = req.header('idempotency-key')?.trim() || randomUUID();
      if (idempotencyKey.length > 128) {
        throw AppError.validation('Idempotency-Key too long');
      }
      const body = createOrderSchema.parse(req.body);
      const userEmail = await getUserEmail(req.user!.id);
      const order = await svc.create({
        userId: req.user!.id,
        userEmail,
        body,
        idempotencyKey,
      });
      res.status(201).json(order);
    }),
  );

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const query = listOrdersQuerySchema.parse(req.query);
      const result = await svc.list(req.user!.id, query);
      res.json(result);
    }),
  );

  router.get(
    '/:orderId',
    asyncHandler(async (req, res) => {
      const { orderId } = orderIdParam.parse(req.params);
      const order = await svc.getById(req.user!.id, orderId);
      res.json(order);
    }),
  );

  return router;
}
