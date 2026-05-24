import { z } from 'zod';
import { productSchema } from './product';

export const cartItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  quantity: z.number().int().min(1),
  product: productSchema,
});
export type CartItem = z.infer<typeof cartItemSchema>;

export const cartSchema = z.object({
  id: z.string(),
  items: z.array(cartItemSchema),
  subtotalCents: z.number().int().nonnegative(),
  currency: z.string().length(3),
  updatedAt: z.string(),
});
export type Cart = z.infer<typeof cartSchema>;

export const addItemSchema = z
  .object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1).max(99).default(1),
  })
  .strict();
export type AddItemInput = z.infer<typeof addItemSchema>;

export const updateItemSchema = z
  .object({
    quantity: z.number().int().min(0).max(99),
  })
  .strict();
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
