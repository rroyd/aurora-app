import { Router } from 'express';
import { z } from 'zod';
import { listProductsQuerySchema } from '@shared/contracts';
import { asyncHandler } from '@/utils/asyncHandler.js';
import type { ProductsService } from './products.service.js';

const slugParam = z.object({ slug: z.string().min(1).max(160) });

export function createProductsRouter(svc: ProductsService): Router {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const query = listProductsQuerySchema.parse(req.query);
      const result = await svc.list(query);
      res.json(result);
    }),
  );

  router.get(
    '/categories',
    asyncHandler(async (_req, res) => {
      const cats = await svc.categories();
      res.json({ items: cats });
    }),
  );

  router.get(
    '/:slug',
    asyncHandler(async (req, res) => {
      const { slug } = slugParam.parse(req.params);
      const product = await svc.getBySlug(slug);
      res.json(product);
    }),
  );

  return router;
}
