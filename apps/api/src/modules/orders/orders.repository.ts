import type { Prisma, PrismaClient } from '@prisma/client';
import type { CreateOrderInput } from '@shared/contracts';

export type OrderWithItems = Prisma.OrderGetPayload<{
  include: { items: true };
}>;

export interface OrdersRepository {
  findByIdempotencyKey(key: string, userId: string): Promise<OrderWithItems | null>;
  createOrder(input: {
    userId: string;
    cartId: string;
    shippingAddress: CreateOrderInput['shippingAddress'];
    totals: {
      subtotalCents: number;
      shippingCents: number;
      taxCents: number;
      totalCents: number;
    };
    paymentLast4: string;
    paymentChargeId: string;
    idempotencyKey: string;
  }): Promise<OrderWithItems>;
  listByUser(
    userId: string,
    args: { cursor?: string; limit: number },
  ): Promise<{ items: OrderWithItems[]; nextCursor: string | null }>;
  findById(orderId: string, userId: string): Promise<OrderWithItems | null>;
}

export function createOrdersRepository(prisma: PrismaClient): OrdersRepository {
  return {
    findByIdempotencyKey: (key, userId) =>
      prisma.order.findFirst({
        where: { idempotencyKey: key, userId },
        include: { items: true },
      }),

    createOrder: async ({ userId, cartId, shippingAddress, totals, paymentLast4, paymentChargeId, idempotencyKey }) => {
      return prisma.$transaction(
        async (tx) => {
          const cartItems = await tx.cartItem.findMany({
            where: { cartId },
            include: { product: true },
          });
          if (cartItems.length === 0) {
            throw new Error('Cart is empty');
          }
          for (const ci of cartItems) {
            if (ci.product.stock < ci.quantity) {
              throw new Error(`Insufficient stock for ${ci.product.name}`);
            }
          }
          for (const ci of cartItems) {
            await tx.product.update({
              where: { id: ci.productId },
              data: { stock: { decrement: ci.quantity } },
            });
          }
          const order = await tx.order.create({
            data: {
              userId,
              status: 'PAID',
              subtotalCents: totals.subtotalCents,
              shippingCents: totals.shippingCents,
              taxCents: totals.taxCents,
              totalCents: totals.totalCents,
              currency: cartItems[0]?.product.currency ?? 'USD',
              shippingAddress: shippingAddress as unknown as Prisma.InputJsonValue,
              paymentLast4,
              paymentChargeId,
              idempotencyKey,
              items: {
                create: cartItems.map((ci) => ({
                  productId: ci.productId,
                  nameSnapshot: ci.product.name,
                  priceCentsSnapshot: ci.product.priceCents,
                  imageUrlSnapshot: ci.product.imageUrl,
                  quantity: ci.quantity,
                })),
              },
            },
            include: { items: true },
          });
          await tx.cartItem.deleteMany({ where: { cartId } });
          return order;
        },
        { isolationLevel: 'Serializable' },
      );
    },

    listByUser: async (userId, { cursor, limit }) => {
      const take = limit + 1;
      const items = await prisma.order.findMany({
        where: { userId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: { items: true },
        take,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });
      const hasMore = items.length > limit;
      const trimmed = hasMore ? items.slice(0, limit) : items;
      const nextCursor = hasMore ? (trimmed.at(-1)?.id ?? null) : null;
      return { items: trimmed, nextCursor };
    },

    findById: (orderId, userId) =>
      prisma.order.findFirst({
        where: { id: orderId, userId },
        include: { items: true },
      }),
  };
}
