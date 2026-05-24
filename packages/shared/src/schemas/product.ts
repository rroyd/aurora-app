import { z } from 'zod';
import { paginationSchema } from './common.js';

export const categorySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
});
export type Category = z.infer<typeof categorySchema>;

export const productSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  priceCents: z.number().int().nonnegative(),
  currency: z.string().length(3),
  imageUrl: z.string().url(),
  stock: z.number().int().nonnegative(),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int().nonnegative(),
  category: categorySchema,
  createdAt: z.string(),
});
export type Product = z.infer<typeof productSchema>;

export const sortSchema = z.enum(['price-asc', 'price-desc', 'popular', 'newest']);
export type Sort = z.infer<typeof sortSchema>;

export const listProductsQuerySchema = paginationSchema.extend({
  q: z.string().trim().min(1).max(100).optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  sort: sortSchema.optional(),
});
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;

export const productListResponseSchema = z.object({
  items: z.array(productSchema),
  nextCursor: z.string().nullable(),
});
export type ProductListResponse = z.infer<typeof productListResponseSchema>;
