import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GuestCartItem {
  productId: string;
  slug: string;
  name: string;
  imageUrl: string;
  priceCents: number;
  currency: string;
  quantity: number;
}

interface GuestCartStore {
  items: GuestCartItem[];
  add(item: Omit<GuestCartItem, 'quantity'> & { quantity?: number }): void;
  update(productId: string, quantity: number): void;
  remove(productId: string): void;
  clear(): void;
}

export const useGuestCart = create<GuestCartStore>()(
  persist(
    (set) => ({
      items: [],
      add: (item) =>
        set((s) => {
          const qty = item.quantity ?? 1;
          const existing = s.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: Math.min(99, i.quantity + qty) }
                  : i,
              ),
            };
          }
          return { items: [...s.items, { ...item, quantity: qty }] };
        }),
      update: (productId, quantity) =>
        set((s) => ({
          items:
            quantity <= 0
              ? s.items.filter((i) => i.productId !== productId)
              : s.items.map((i) =>
                  i.productId === productId ? { ...i, quantity: Math.min(99, quantity) } : i,
                ),
        })),
      remove: (productId) =>
        set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'guest-cart', version: 1 },
  ),
);

export function guestCartSubtotal(items: GuestCartItem[]): number {
  return items.reduce((acc, i) => acc + i.priceCents * i.quantity, 0);
}
