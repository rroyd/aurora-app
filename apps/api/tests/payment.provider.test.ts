import { describe, expect, it } from 'vitest';
import { createMockPaymentProvider } from '@/modules/orders/payment.provider.js';

const provider = createMockPaymentProvider();
const okCard = { number: '4242424242424242', expMonth: 12, expYear: new Date().getFullYear() + 1, cvc: '123' };
const declinedCard = { ...okCard, number: '4000000000000002' };
const expiredCard = { ...okCard, expYear: new Date().getFullYear() - 1 };

describe('mock payment provider', () => {
  it('succeeds for 4242 card', async () => {
    const r = await provider.charge({
      amountCents: 1000,
      currency: 'USD',
      idempotencyKey: 'k1',
      card: okCard,
      customer: { id: 'u', email: 'a@b.c' },
    });
    expect(r.status).toBe('succeeded');
    expect(r.last4).toBe('4242');
    expect(r.brand).toBe('visa');
  });

  it('declines the declined-test card', async () => {
    const r = await provider.charge({
      amountCents: 1000,
      currency: 'USD',
      idempotencyKey: 'k2',
      card: declinedCard,
      customer: { id: 'u', email: 'a@b.c' },
    });
    expect(r.status).toBe('declined');
    expect(r.failureCode).toBe('card_declined');
  });

  it('fails when the card is expired', async () => {
    const r = await provider.charge({
      amountCents: 1000,
      currency: 'USD',
      idempotencyKey: 'k3',
      card: expiredCard,
      customer: { id: 'u', email: 'a@b.c' },
    });
    expect(r.status).toBe('failed');
    expect(r.failureCode).toBe('expired_card');
  });
});
