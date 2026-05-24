import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { Category, ListProductsQuery, Product, ProductListResponse } from '@shared/contracts';
import { apiRequest } from '@/lib/api';

export const productKeys = {
  all: ['products'] as const,
  list: (filters: Partial<ListProductsQuery>) => [...productKeys.all, 'list', filters] as const,
  detail: (slug: string) => [...productKeys.all, 'detail', slug] as const,
  categories: () => [...productKeys.all, 'categories'] as const,
};

function buildQs(filters: Partial<ListProductsQuery>, cursor?: string): string {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.category) params.set('category', filters.category);
  if (filters.minPrice !== undefined) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.limit) params.set('limit', String(filters.limit));
  if (cursor) params.set('cursor', cursor);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function useProducts(filters: Partial<ListProductsQuery>) {
  return useInfiniteQuery({
    queryKey: productKeys.list(filters),
    queryFn: ({ pageParam }) =>
      apiRequest<ProductListResponse>(`/v1/products${buildQs(filters, pageParam)}`),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: productKeys.detail(slug),
    queryFn: () => apiRequest<Product>(`/v1/products/${slug}`),
    enabled: !!slug,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: productKeys.categories(),
    queryFn: () => apiRequest<{ items: Category[] }>(`/v1/products/categories`),
    staleTime: 5 * 60 * 1000,
  });
}
