# Capability — Payments (Mock + Provider Interface)

## Scope

The assignment does not require real payment processing. The blueprint specifies a **mock provider** that is wire-compatible with a real one (Stripe), so swapping is a one-day change.

## Interface

```ts
// apps/api/src/modules/orders/payment-provider.ts
export interface PaymentProvider {
  /** Charge the customer for the given amount in the smallest currency unit. */
  charge(input: ChargeInput): Promise<ChargeResult>;
  /** Issue a refund. */
  refund(input: RefundInput): Promise<RefundResult>;
}

export interface ChargeInput {
  amountCents: number;
  currency: string;
  idempotencyKey: string;
  card: { number: string; expMonth: number; expYear: number; cvc: string };
  customer: { id: string; email: string };
  metadata?: Record<string, string>;
}

export interface ChargeResult {
  providerChargeId: string;
  status: 'succeeded' | 'declined' | 'failed';
  last4: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'other';
  failureCode?: 'card_declined' | 'insufficient_funds' | 'expired_card';
}
```

## Mock Provider Rules

- `card.number === '4242424242424242'` → `succeeded`.
- `card.number === '4000000000000002'` → `declined` (`card_declined`).
- Any expired `expMonth`/`expYear` (past today) → `failed` (`expired_card`).
- Adds an artificial 200ms delay to simulate latency.
- Stores nothing — pure function. The server records the order; never the card data.

## Swap to Stripe

Implement `StripeProvider implements PaymentProvider` using `stripe` Node SDK. Inject via `composition.ts`. No other code changes.

## Frontend

- A `<CardForm>` component (RHF + Zod) collects card details client-side.
- POST to `/orders` with `Idempotency-Key` header (UUID v4 generated client-side and persisted in `sessionStorage` for the duration of the checkout).
- On `card_declined`, show a field-level error on `cardNumber`.
