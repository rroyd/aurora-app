import { describe, expect, it } from 'vitest';
import { calculateTotals } from '@/modules/orders/orders.totals.js';

describe('calculateTotals', () => {
  it('returns zeroes for empty cart', () => {
    expect(calculateTotals([])).toEqual({
      subtotalCents: 0,
      shippingCents: 0,
      taxCents: 0,
      totalCents: 0,
    });
  });

  it('charges flat shipping below threshold and applies tax', () => {
    const totals = calculateTotals([{ priceCents: 1500, quantity: 2 }]);
    expect(totals.subtotalCents).toBe(3000);
    expect(totals.shippingCents).toBe(799);
    expect(totals.taxCents).toBe(Math.round(3000 * 0.08));
    expect(totals.totalCents).toBe(totals.subtotalCents + totals.shippingCents + totals.taxCents);
  });

  it('grants free shipping at or above threshold', () => {
    const totals = calculateTotals([{ priceCents: 5000, quantity: 1 }]);
    expect(totals.shippingCents).toBe(0);
  });

  it('aggregates multiple line items', () => {
    const totals = calculateTotals([
      { priceCents: 1000, quantity: 3 },
      { priceCents: 2500, quantity: 1 },
    ]);
    expect(totals.subtotalCents).toBe(5500);
    expect(totals.shippingCents).toBe(0);
  });
});
