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

export interface PaymentProvider {
  charge(input: ChargeInput): Promise<ChargeResult>;
}

function brandFromNumber(num: string): ChargeResult['brand'] {
  if (num.startsWith('4')) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(num)) return 'mastercard';
  if (/^3[47]/.test(num)) return 'amex';
  return 'other';
}

export function createMockPaymentProvider(): PaymentProvider {
  return {
    async charge(input) {
      await new Promise((r) => setTimeout(r, 200));
      const cleaned = input.card.number.replace(/\s+/g, '');
      const last4 = cleaned.slice(-4);
      const brand = brandFromNumber(cleaned);
      const expired =
        input.card.expYear < new Date().getFullYear() ||
        (input.card.expYear === new Date().getFullYear() &&
          input.card.expMonth < new Date().getMonth() + 1);
      if (expired) {
        return {
          providerChargeId: `mock_failed_${Date.now()}`,
          status: 'failed',
          last4,
          brand,
          failureCode: 'expired_card',
        };
      }
      if (cleaned === '4000000000000002') {
        return {
          providerChargeId: `mock_declined_${Date.now()}`,
          status: 'declined',
          last4,
          brand,
          failureCode: 'card_declined',
        };
      }
      return {
        providerChargeId: `mock_ch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        status: 'succeeded',
        last4,
        brand,
      };
    },
  };
}
