import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateOrderInput, Order, OrderListResponse } from '@shared/contracts';
import { apiRequest } from '@/lib/api';

export const orderKeys = {
  all: ['orders'] as const,
  list: () => [...orderKeys.all, 'list'] as const,
  detail: (id: string) => [...orderKeys.all, 'detail', id] as const,
};

function getIdempotencyKey(): string {
  const key = sessionStorage.getItem('idempotency-key');
  if (key) return key;
  const fresh =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  sessionStorage.setItem('idempotency-key', fresh);
  return fresh;
}

export function useOrders() {
  return useQuery({
    queryKey: orderKeys.list(),
    queryFn: () => apiRequest<OrderListResponse>('/v1/orders?limit=20'),
  });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => apiRequest<Order>(`/v1/orders/${orderId}`),
    enabled: !!orderId,
  });
}

export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrderInput) =>
      apiRequest<Order>('/v1/orders', {
        method: 'POST',
        body: input,
        headers: { 'Idempotency-Key': getIdempotencyKey() },
      }),
    onSuccess: () => {
      sessionStorage.removeItem('idempotency-key');
      qc.invalidateQueries({ queryKey: ['cart'] });
      qc.invalidateQueries({ queryKey: orderKeys.list() });
    },
  });
}
