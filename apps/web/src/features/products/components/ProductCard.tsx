import { motion } from 'framer-motion';
import { ShoppingBag, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Product } from '@shared/contracts';
import { Button } from '@/components/ui/Button';
import { ProductImage } from '@/components/ui/ProductImage';
import { formatMoney } from '@/lib/format';

export interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const outOfStock = product.stock <= 0;
  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className="card-surface group overflow-hidden"
    >
      <Link to={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-surface-sunken">
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {outOfStock ? (
            <div className="absolute left-3 top-3 rounded-full bg-ink/80 px-2.5 py-0.5 text-xs font-medium text-white">
              Out of stock
            </div>
          ) : null}
        </div>
      </Link>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-ink-subtle">
              {product.category.name}
            </p>
            <Link to={`/products/${product.slug}`} className="line-clamp-1">
              <h3 className="font-semibold text-ink">{product.name}</h3>
            </Link>
          </div>
          <div className="flex items-center gap-1 text-xs text-ink-muted">
            <Star className="h-3.5 w-3.5 fill-amber-400 stroke-amber-400" />
            {product.rating.toFixed(1)}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold text-ink">
            {formatMoney(product.priceCents, product.currency)}
          </p>
          <Button
            size="sm"
            variant="primary"
            disabled={outOfStock}
            onClick={(e) => {
              e.preventDefault();
              onAddToCart?.(product);
            }}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingBag className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
