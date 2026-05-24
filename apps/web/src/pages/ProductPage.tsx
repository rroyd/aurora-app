import { motion } from 'framer-motion';
import { ArrowLeft, Minus, Plus, ShieldCheck, Star, Truck } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProductImage } from '@/components/ui/ProductImage';
import { Skeleton } from '@/components/ui/Skeleton';
import { PageTransition } from '@/components/layout/PageTransition';
import { useUnifiedCart } from '@/features/cart/useUnifiedCart';
import { useProduct } from '@/features/products/api';
import { useCartDrawer } from '@/stores/cart-drawer.store';
import { formatMoney } from '@/lib/format';

export function ProductPage() {
  const { slug = '' } = useParams();
  const product = useProduct(slug);
  const cart = useUnifiedCart();
  const openCart = useCartDrawer((s) => s.open);
  const [qty, setQty] = useState(1);

  if (product.isLoading) {
    return (
      <PageTransition>
        <div className="grid gap-8 md:grid-cols-2">
          <Skeleton className="aspect-square w-full" />
          <div className="space-y-3">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-9 w-2/3" />
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-24" />
          </div>
        </div>
      </PageTransition>
    );
  }
  if (product.isError || !product.data) {
    return (
      <PageTransition>
        <p className="text-center text-ink-muted">Product not found.</p>
        <div className="mt-4 text-center">
          <Link to="/" className="text-brand-600 hover:underline">
            Back to shop
          </Link>
        </div>
      </PageTransition>
    );
  }

  const p = product.data;
  const outOfStock = p.stock <= 0;

  return (
    <PageTransition>
      <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Back to shop
      </Link>
      <div className="grid gap-10 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden rounded-2xl bg-surface-muted"
        >
          <ProductImage src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
        </motion.div>

        <div className="space-y-5">
          <div>
            <Badge tone="brand">{p.category.name}</Badge>
            <h1 className="mt-2 text-3xl font-bold text-ink md:text-4xl">{p.name}</h1>
            <div className="mt-2 flex items-center gap-2 text-sm text-ink-muted">
              <Star className="h-4 w-4 fill-amber-400 stroke-amber-400" />
              {p.rating.toFixed(1)} · {p.reviewCount} reviews
            </div>
          </div>

          <p className="text-3xl font-semibold text-ink">
            {formatMoney(p.priceCents, p.currency)}
          </p>

          <p className="text-ink-muted">{p.description}</p>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-md border border-slate-200">
              <button
                aria-label="Decrease quantity"
                className="p-2 hover:bg-surface-muted disabled:opacity-50"
                disabled={qty <= 1}
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center text-sm tabular-nums">{qty}</span>
              <button
                aria-label="Increase quantity"
                className="p-2 hover:bg-surface-muted disabled:opacity-50"
                disabled={qty >= Math.min(99, p.stock)}
                onClick={() => setQty((q) => Math.min(99, q + 1))}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button
              size="lg"
              disabled={outOfStock}
              onClick={() => {
                cart.add({
                  product: {
                    productId: p.id,
                    slug: p.slug,
                    name: p.name,
                    imageUrl: p.imageUrl,
                    priceCents: p.priceCents,
                    currency: p.currency,
                  },
                  quantity: qty,
                });
                openCart();
              }}
            >
              {outOfStock ? 'Out of stock' : 'Add to cart'}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-start gap-2 rounded-lg bg-surface-muted p-3 text-sm">
              <Truck className="mt-0.5 h-4 w-4 text-brand-600" />
              <div>
                <p className="font-medium text-ink">Free shipping</p>
                <p className="text-xs text-ink-muted">On orders over $50</p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-surface-muted p-3 text-sm">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-brand-600" />
              <div>
                <p className="font-medium text-ink">30-day returns</p>
                <p className="text-xs text-ink-muted">No questions asked</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
