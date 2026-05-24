import type { Product } from '@shared/contracts';
import { useCartDrawer } from '@/stores/cart-drawer.store';
import { useUnifiedCart } from './useUnifiedCart';

export type AddableProduct = Pick<
  Product,
  'id' | 'slug' | 'name' | 'imageUrl' | 'priceCents' | 'currency'
>;

export function useAddProductToCart() {
  const cart = useUnifiedCart();
  const openCart = useCartDrawer((s) => s.open);

  return function addToCart(product: AddableProduct, quantity: number = 1) {
    cart.add({
      product: {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        imageUrl: product.imageUrl,
        priceCents: product.priceCents,
        currency: product.currency,
      },
      quantity,
    });
    openCart();
  };
}
