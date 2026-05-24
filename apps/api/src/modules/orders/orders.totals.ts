const TAX_RATE = 0.08;
const FREE_SHIPPING_THRESHOLD_CENTS = 5_000;
const FLAT_SHIPPING_CENTS = 799;

export interface LineItem {
  priceCents: number;
  quantity: number;
}

export interface OrderTotals {
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
}

export function calculateTotals(items: LineItem[]): OrderTotals {
  const subtotalCents = items.reduce((acc, i) => acc + i.priceCents * i.quantity, 0);
  const shippingCents =
    items.length === 0 ? 0 : subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_CENTS;
  const taxCents = Math.round(subtotalCents * TAX_RATE);
  const totalCents = subtotalCents + shippingCents + taxCents;
  return { subtotalCents, shippingCents, taxCents, totalCents };
}
