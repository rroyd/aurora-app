import { motion } from 'framer-motion';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ProductImage } from '@/components/ui/ProductImage';
import { Sheet } from '@/components/ui/Sheet';
import { formatMoney } from '@/lib/format';
import { useCartDrawer } from '@/stores/cart-drawer.store';
import { useUnifiedCart } from './useUnifiedCart';

export function CartDrawer() {
  const open = useCartDrawer((s) => s.isOpen);
  const close = useCartDrawer((s) => s.close);
  const navigate = useNavigate();
  const cart = useUnifiedCart();

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => (o ? null : close())}
      title="Your Cart"
      description={cart.itemCount > 0 ? `${cart.itemCount} item${cart.itemCount === 1 ? '' : 's'}` : 'Your cart is empty'}
      footer={
        cart.items.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-muted">Subtotal</span>
              <span className="font-semibold text-ink">
                {formatMoney(cart.subtotalCents, cart.currency)}
              </span>
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                close();
                navigate('/checkout');
              }}
            >
              Checkout
            </Button>
          </div>
        ) : null
      }
    >
      {cart.items.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center">
          <div className="rounded-full bg-surface-muted p-6">
            <span className="text-3xl">🛍️</span>
          </div>
          <p className="text-ink-muted">Your cart is feeling lonely.</p>
          <Button onClick={close} variant="secondary">
            Continue shopping
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {cart.items.map((item) => (
            <motion.li
              key={item.productId}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex gap-3 py-4"
            >
              <Link to={`/products/${item.slug}`} onClick={close}>
                <ProductImage
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-20 w-20 rounded-lg object-cover"
                />
              </Link>
              <div className="flex flex-1 flex-col gap-1">
                <Link
                  to={`/products/${item.slug}`}
                  onClick={close}
                  className="line-clamp-1 text-sm font-medium text-ink hover:text-brand-600"
                >
                  {item.name}
                </Link>
                <p className="text-sm text-ink-muted">
                  {formatMoney(item.priceCents, item.currency)}
                </p>
                <div className="mt-1 flex items-center justify-between">
                  <div className="flex items-center gap-1 rounded border border-slate-200">
                    <button
                      aria-label="Decrease quantity"
                      className="px-2 py-1 hover:bg-surface-muted disabled:opacity-50"
                      disabled={item.quantity <= 1}
                      onClick={() => cart.update(item.productId, item.quantity - 1)}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm tabular-nums">{item.quantity}</span>
                    <button
                      aria-label="Increase quantity"
                      className="px-2 py-1 hover:bg-surface-muted"
                      onClick={() => cart.update(item.productId, item.quantity + 1)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    aria-label={`Remove ${item.name}`}
                    className="rounded p-1 text-ink-subtle hover:bg-surface-muted hover:text-danger"
                    onClick={() => cart.remove(item.productId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
