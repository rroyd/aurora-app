import type { Prisma, PrismaClient } from '@prisma/client';

export type CartWithItems = Prisma.CartGetPayload<{
  include: { items: { include: { product: { include: { category: true } } } } };
}>;

export interface CartRepository {
  getOrCreateForUser(userId: string): Promise<CartWithItems>;
  upsertItem(cartId: string, productId: string, quantityDelta: number): Promise<void>;
  setItemQuantity(cartId: string, productId: string, quantity: number): Promise<void>;
  removeItem(cartId: string, productId: string): Promise<void>;
  clear(cartId: string): Promise<void>;
}

export function createCartRepository(prisma: PrismaClient): CartRepository {
  async function getOrCreate(userId: string): Promise<CartWithItems> {
    const existing = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: { include: { category: true } } } } },
    });
    if (existing) return existing;
    return prisma.cart.create({
      data: { userId },
      include: { items: { include: { product: { include: { category: true } } } } },
    });
  }

  return {
    getOrCreateForUser: getOrCreate,

    upsertItem: async (cartId, productId, quantityDelta) => {
      await prisma.$transaction(async (tx) => {
        const existing = await tx.cartItem.findUnique({
          where: { cartId_productId: { cartId, productId } },
        });
        const next = (existing?.quantity ?? 0) + quantityDelta;
        if (next <= 0) {
          if (existing) {
            await tx.cartItem.delete({ where: { id: existing.id } });
          }
          return;
        }
        const product = await tx.product.findUnique({
          where: { id: productId },
          select: { stock: true },
        });
        const clamped = product ? Math.min(next, product.stock) : next;
        if (existing) {
          await tx.cartItem.update({ where: { id: existing.id }, data: { quantity: clamped } });
        } else {
          await tx.cartItem.create({ data: { cartId, productId, quantity: clamped } });
        }
      });
    },

    setItemQuantity: async (cartId, productId, quantity) => {
      if (quantity <= 0) {
        await prisma.cartItem
          .delete({ where: { cartId_productId: { cartId, productId } } })
          .catch(() => undefined);
        return;
      }
      await prisma.cartItem.upsert({
        where: { cartId_productId: { cartId, productId } },
        update: { quantity },
        create: { cartId, productId, quantity },
      });
    },

    removeItem: async (cartId, productId) => {
      await prisma.cartItem
        .delete({ where: { cartId_productId: { cartId, productId } } })
        .catch(() => undefined);
    },

    clear: async (cartId) => {
      await prisma.cartItem.deleteMany({ where: { cartId } });
    },
  };
}
