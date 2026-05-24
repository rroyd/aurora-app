import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ListProductsQuery, Sort } from '@shared/contracts';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useCategories, useProducts } from '@/features/products/api';
import { ProductCard } from '@/features/products/components/ProductCard';
import { useUnifiedCart } from '@/features/cart/useUnifiedCart';
import { useCartDrawer } from '@/stores/cart-drawer.store';
import { PageTransition } from '@/components/layout/PageTransition';

const SORTS: { value: Sort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Popular' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
];

export function HomePage() {
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
      limit: 20,
    };
  }, [params]);

  const products = useProducts(filters);
  const categories = useCategories();
  const cart = useUnifiedCart();
  const openCart = useCartDrawer((s) => s.open);

  function updateParam(key: string, value: string | undefined) {
    setParams((prev) => {
      if (value === undefined || value === '') prev.delete(key);
      else prev.set(key, value);
      return prev;
    });
  }

  return (
    <PageTransition>
      <Hero />

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => updateParam('category', undefined)}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              !filters.category ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 bg-surface text-ink-muted hover:bg-surface-muted'
            }`}
          >
            All
          </button>
          {categories.data?.items.map((c) => (
            <button
              key={c.id}
              onClick={() => updateParam('category', c.slug)}
              className={`rounded-full border px-3 py-1 text-sm transition ${
                filters.category === c.slug
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-slate-200 bg-surface text-ink-muted hover:bg-surface-muted'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-ink-muted">Sort:</span>
          <select
            value={filters.sort ?? ''}
            onChange={(e) => updateParam('sort', e.target.value || undefined)}
            className="h-9 rounded-md border border-slate-200 bg-surface px-2 text-sm focus:border-brand-500 focus:outline-none"
          >
            <option value="">Default</option>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filters.q ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-ink-muted">
          Results for <Badge tone="brand">{filters.q}</Badge>
          <button
            onClick={() => updateParam('q', undefined)}
            className="text-brand-600 hover:underline"
          >
            Clear
          </button>
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card-surface overflow-hidden">
                <Skeleton className="aspect-square w-full rounded-none" />
                <div className="space-y-2 p-4">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </div>
            ))
          : products.data?.pages.flatMap((p, pi) =>
              p.items.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(0.02 * (pi * 20 + idx), 0.5) }}
                >
                  <ProductCard
                    product={product}
                    onAddToCart={(p) => {
                      cart.add({
                        product: {
                          productId: p.id,
                          slug: p.slug,
                          name: p.name,
                          imageUrl: p.imageUrl,
                          priceCents: p.priceCents,
                          currency: p.currency,
                        },
                      });
                      openCart();
                    }}
                  />
                </motion.div>
              )),
            )}
      </div>

      {products.data && products.data.pages.at(-1)?.nextCursor && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="secondary"
            loading={products.isFetchingNextPage}
            onClick={() => products.fetchNextPage()}
          >
            Load more
          </Button>
        </div>
      )}

      {!products.isLoading && (products.data?.pages.flatMap((p) => p.items).length ?? 0) === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-lg font-semibold">No products match those filters.</p>
          <p className="mt-1 text-sm text-ink-muted">Try clearing some filters or searching for something else.</p>
        </div>
      ) : null}
    </PageTransition>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-100 via-brand-50 to-surface px-6 py-12 md:px-12 md:py-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl"
      >
        <Badge tone="brand" className="mb-4">
          New Season • 2026
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight text-ink md:text-5xl">
          Premium goods, thoughtfully curated.
        </h1>
        <p className="mt-3 max-w-lg text-base text-ink-muted">
          Discover beautifully made products from the best independent makers in the world.
          Free shipping over $50 — every order, every time.
        </p>
        <div className="mt-6 flex gap-3">
          <a href="#products">
            <Button size="lg">Shop now</Button>
          </a>
          <a href="?sort=popular">
            <Button size="lg" variant="secondary">
              Popular
            </Button>
          </a>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, rotate: -8 }}
        animate={{ opacity: 1, scale: 1, rotate: -6 }}
        transition={{ duration: 0.7 }}
        className="pointer-events-none absolute -right-12 -top-8 hidden h-72 w-72 rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 opacity-90 shadow-2xl md:block"
      />
    </section>
  );
}
