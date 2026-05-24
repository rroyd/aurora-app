import { useEffect, useMemo } from 'react';
import { useAuth } from '../auth/useAuth';
import { useAddToCart, useCart, useMergeGuestCart, useRemoveCartItem, useUpdateCartItem } from './api';
import { useGuestCart, guestCartSubtotal, type GuestCartItem } from '@/stores/guest-cart.store';
import { useToast } from '@/components/ui/Toast';
import type { Cart } from '@shared/contracts';

export interface UnifiedCartItem {
  productId: string;
  slug: string;
  name: string;
  imageUrl: string;
  priceCents: number;
  currency: string;
  quantity: number;
}

export function useUnifiedCart() {
  const { isAuthenticated } = useAuth();
  const serverCart = useCart(isAuthenticated);
  const guestItems = useGuestCart((s) => s.items);
  const guestAdd = useGuestCart((s) => s.add);
  const guestUpdate = useGuestCart((s) => s.update);
  const guestRemove = useGuestCart((s) => s.remove);
  const guestClear = useGuestCart((s) => s.clear);
  const mergeGuest = useMergeGuestCart();
  const addToServer = useAddToCart();
  const updateOnServer = useUpdateCartItem();
  const removeFromServer = useRemoveCartItem();
  const toast = useToast();

  useEffect(() => {
    if (!isAuthenticated || guestItems.length === 0) return;
    const items = guestItems.map((i) => ({ productId: i.productId, quantity: i.quantity }));
    mergeGuest.mutate(items, {
      onSuccess: () => guestClear(),
    });
  }, [isAuthenticated]);

  const items: UnifiedCartItem[] = useMemo(() => {
    if (isAuthenticated && serverCart.data) {
      return serverCart.data.items.map((i) => ({
        productId: i.productId,
        slug: i.product.slug,
        name: i.product.name,
        imageUrl: i.product.imageUrl,
        priceCents: i.product.priceCents,
        currency: i.product.currency,
        quantity: i.quantity,
      }));
    }
    return guestItems;
  }, [isAuthenticated, serverCart.data, guestItems]);

  const subtotalCents = isAuthenticated
    ? (serverCart.data?.subtotalCents ?? 0)
    : guestCartSubtotal(guestItems);
  const currency = items[0]?.currency ?? 'USD';
  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);

  return {
    items,
    subtotalCents,
    currency,
    itemCount,
    isLoading: isAuthenticated && serverCart.isLoading,
    serverCart: (serverCart.data as Cart | null | undefined) ?? null,

    add(item: GuestCartItem | { product: Pick<UnifiedCartItem, 'productId' | 'slug' | 'name' | 'imageUrl' | 'priceCents' | 'currency'>; quantity?: number }) {
      const cartItem: GuestCartItem =
        'product' in item
          ? { ...item.product, quantity: item.quantity ?? 1 }
          : item;
      if (isAuthenticated) {
        addToServer.mutate(
          { productId: cartItem.productId, quantity: cartItem.quantity },
          {
            onSuccess: () => toast.success('Added to cart', cartItem.name),
            onError: (e) => toast.error('Could not add to cart', (e as Error).message),
          },
        );
      } else {
        guestAdd(cartItem);
        toast.success('Added to cart', cartItem.name);
      }
    },

    update(productId: string, quantity: number) {
      if (isAuthenticated) {
        if (quantity <= 0) {
          removeFromServer.mutate(productId);
        } else {
          updateOnServer.mutate({ productId, quantity });
        }
      } else {
        guestUpdate(productId, quantity);
      }
    },

    remove(productId: string) {
      if (isAuthenticated) removeFromServer.mutate(productId);
      else guestRemove(productId);
    },
  };
}
