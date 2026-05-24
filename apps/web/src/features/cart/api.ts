import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AddItemInput, Cart, UpdateItemInput } from '@shared/contracts';
import { ApiError, apiRequest } from '@/lib/api';

export const cartKeys = {
  detail: ['cart'] as const,
};

export function useCart(enabled: boolean) {
  return useQuery<Cart | null>({
    queryKey: cartKeys.detail,
    queryFn: async () => {
      try {
        return await apiRequest<Cart>('/v1/cart');
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null;
        throw e;
      }
    },
    enabled,
  });
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddItemInput) =>
      apiRequest<Cart>('/v1/cart/items', { method: 'POST', body: input }),
    onSuccess: (cart) => qc.setQueryData(cartKeys.detail, cart),
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, ...input }: { productId: string } & UpdateItemInput) =>
      apiRequest<Cart>(`/v1/cart/items/${productId}`, { method: 'PATCH', body: input }),
    onSuccess: (cart) => qc.setQueryData(cartKeys.detail, cart),
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) =>
      apiRequest<Cart>(`/v1/cart/items/${productId}`, { method: 'DELETE' }),
    onSuccess: (cart) => qc.setQueryData(cartKeys.detail, cart),
  });
}

export function useMergeGuestCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: { productId: string; quantity: number }[]) =>
      apiRequest<Cart>('/v1/cart/merge', { method: 'POST', body: { items } }),
    onSuccess: (cart) => qc.setQueryData(cartKeys.detail, cart),
  });
}
