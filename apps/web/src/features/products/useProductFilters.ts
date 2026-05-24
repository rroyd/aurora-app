import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ListProductsQuery, Sort } from '@shared/contracts';

const DEFAULT_LIMIT = 20;

export type ProductFilterKey = 'q' | 'category' | 'sort' | 'minPrice' | 'maxPrice';

export function useProductFilters(limit: number = DEFAULT_LIMIT) {
  const [params, setParams] = useSearchParams();

  const filters = useMemo<Partial<ListProductsQuery>>(() => {
    const minPriceRaw = params.get('minPrice');
    const maxPriceRaw = params.get('maxPrice');
    return {
      q: params.get('q') ?? undefined,
      category: params.get('category') ?? undefined,
      sort: (params.get('sort') as Sort) ?? undefined,
      minPrice: minPriceRaw ? Number(minPriceRaw) : undefined,
      maxPrice: maxPriceRaw ? Number(maxPriceRaw) : undefined,
      limit,
    };
  }, [params, limit]);

  const setFilter = useCallback(
    (key: ProductFilterKey, value: string | undefined) => {
      setParams((prev) => {
        if (value === undefined || value === '') prev.delete(key);
        else prev.set(key, value);
        return prev;
      });
    },
    [setParams],
  );

  return { filters, setFilter };
}
