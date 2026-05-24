import type { Cart, CartItem } from '@shared/contracts';
import { AppError } from '@/utils/AppError.js';
import type { CartRepository, CartWithItems } from './cart.repository.js';

function toCart(c: CartWithItems): Cart {
  const items: CartItem[] = c.items.map((i) => ({
    id: i.id,
    productId: i.productId,
    quantity: i.quantity,
    product: {
      id: i.product.id,
      slug: i.product.slug,
      name: i.product.name,
      description: i.product.description,
      priceCents: i.product.priceCents,
      currency: i.product.currency,
      imageUrl: i.product.imageUrl,
      stock: i.product.stock,
      rating: i.product.rating,
      reviewCount: i.product.reviewCount,
      category: {
        id: i.product.category.id,
        slug: i.product.category.slug,
        name: i.product.category.name,
      },
      createdAt: i.product.createdAt.toISOString(),
    },
  }));
  const subtotalCents = items.reduce((acc, i) => acc + i.product.priceCents * i.quantity, 0);
  return {
    id: c.id,
    items,
    subtotalCents,
    currency: items[0]?.product.currency ?? 'USD',
    updatedAt: c.updatedAt.toISOString(),
  };
}

export interface CartService {
  get(userId: string): Promise<Cart>;
  addItem(userId: string, productId: string, quantity: number): Promise<Cart>;
  updateItem(userId: string, productId: string, quantity: number): Promise<Cart>;
  removeItem(userId: string, productId: string): Promise<Cart>;
  clear(userId: string): Promise<Cart>;
  merge(userId: string, items: { productId: string; quantity: number }[]): Promise<Cart>;
}

export function createCartService(repo: CartRepository): CartService {
  async function refreshed(userId: string): Promise<Cart> {
    const cart = await repo.getOrCreateForUser(userId);
    return toCart(cart);
  }
  return {
    async get(userId) {
      return refreshed(userId);
    },
    async addItem(userId, productId, quantity) {
      if (quantity < 1) throw AppError.validation('Quantity must be at least 1');
      const cart = await repo.getOrCreateForUser(userId);
      await repo.upsertItem(cart.id, productId, quantity);
      return refreshed(userId);
    },
    async updateItem(userId, productId, quantity) {
      const cart = await repo.getOrCreateForUser(userId);
      await repo.setItemQuantity(cart.id, productId, quantity);
      return refreshed(userId);
    },
    async removeItem(userId, productId) {
      const cart = await repo.getOrCreateForUser(userId);
      await repo.removeItem(cart.id, productId);
      return refreshed(userId);
    },
    async clear(userId) {
      const cart = await repo.getOrCreateForUser(userId);
      await repo.clear(cart.id);
      return refreshed(userId);
    },
    async merge(userId, items) {
      const cart = await repo.getOrCreateForUser(userId);
      for (const { productId, quantity } of items) {
        if (quantity > 0) {
          await repo.upsertItem(cart.id, productId, quantity);
        }
      }
      return refreshed(userId);
    },
  };
}

export { toCart };
