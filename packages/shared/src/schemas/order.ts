import { z } from 'zod';
import { paginationSchema } from './common.js';

export const addressSchema = z
  .object({
    label: z.string().min(1).max(80).optional(),
    firstName: z.string().min(1).max(80),
    lastName: z.string().min(1).max(80),
    line1: z.string().min(1).max(200),
    line2: z.string().max(200).optional(),
    city: z.string().min(1).max(120),
    region: z.string().min(1).max(120),
    postalCode: z.string().min(1).max(20),
    country: z.string().length(2),
    phone: z.string().min(4).max(30),
  })
  .strict();
export type Address = z.infer<typeof addressSchema>;

export const cardSchema = z
  .object({
    number: z.string().regex(/^\d{12,19}$/, 'Card number must be 12-19 digits'),
    expMonth: z.number().int().min(1).max(12),
    expYear: z.number().int().min(new Date().getFullYear()).max(new Date().getFullYear() + 30),
    cvc: z.string().regex(/^\d{3,4}$/),
    holderName: z.string().min(2).max(100),
  })
  .strict();
export type CardInput = z.infer<typeof cardSchema>;

export const createOrderSchema = z
  .object({
    shippingAddress: addressSchema,
    card: cardSchema,
  })
  .strict();
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const orderStatusSchema = z.enum([
  'PENDING',
  'PAID',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
]);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const orderItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  nameSnapshot: z.string(),
  priceCentsSnapshot: z.number().int().nonnegative(),
  quantity: z.number().int().positive(),
  imageUrl: z.string().url().optional(),
});
export type OrderItem = z.infer<typeof orderItemSchema>;

export const orderSchema = z.object({
  id: z.string(),
  status: orderStatusSchema,
  items: z.array(orderItemSchema),
  subtotalCents: z.number().int().nonnegative(),
  shippingCents: z.number().int().nonnegative(),
  taxCents: z.number().int().nonnegative(),
  totalCents: z.number().int().nonnegative(),
  currency: z.string().length(3),
  shippingAddress: addressSchema,
  paymentLast4: z.string().nullable(),
  createdAt: z.string(),
});
export type Order = z.infer<typeof orderSchema>;

export const listOrdersQuerySchema = paginationSchema;
export const orderListResponseSchema = z.object({
  items: z.array(orderSchema),
  nextCursor: z.string().nullable(),
});
export type OrderListResponse = z.infer<typeof orderListResponseSchema>;
