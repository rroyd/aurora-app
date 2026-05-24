import type { CreateOrderInput, Order, OrderListResponse } from '@shared/contracts';
import { AppError } from '@/utils/AppError.js';
import { TimeoutError, withTimeout } from '@/utils/withTimeout.js';
import type { CartService } from '../cart/cart.service.js';
import type { OrderWithItems, OrdersRepository } from './orders.repository.js';
import { calculateTotals } from './orders.totals.js';
import type { PaymentProvider } from './payment.provider.js';

const PAYMENT_TIMEOUT_MS = 8_000;
const ORDER_TX_TIMEOUT_MS = 10_000;

function toOrder(o: OrderWithItems): Order {
  return {
    id: o.id,
    status: o.status,
    items: o.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      nameSnapshot: i.nameSnapshot,
      priceCentsSnapshot: i.priceCentsSnapshot,
      quantity: i.quantity,
      imageUrl: i.imageUrlSnapshot,
    })),
    subtotalCents: o.subtotalCents,
    shippingCents: o.shippingCents,
    taxCents: o.taxCents,
    totalCents: o.totalCents,
    currency: o.currency,
    shippingAddress: o.shippingAddress as unknown as Order['shippingAddress'],
    paymentLast4: o.paymentLast4 ?? null,
    createdAt: o.createdAt.toISOString(),
  };
}

export interface OrdersService {
  create(input: {
    userId: string;
    userEmail: string;
    body: CreateOrderInput;
    idempotencyKey: string;
  }): Promise<Order>;
  list(userId: string, args: { cursor?: string; limit: number }): Promise<OrderListResponse>;
  getById(userId: string, orderId: string): Promise<Order>;
}

export function createOrdersService(deps: {
  orders: OrdersRepository;
  cart: CartService;
  payment: PaymentProvider;
}): OrdersService {
  return {
    async create({ userId, userEmail, body, idempotencyKey }) {
      const existing = await deps.orders.findByIdempotencyKey(idempotencyKey, userId);
      if (existing) return toOrder(existing);

      const cart = await deps.cart.get(userId);
      if (cart.items.length === 0) throw AppError.validation('Cart is empty');

      const totals = calculateTotals(
        cart.items.map((i) => ({ priceCents: i.product.priceCents, quantity: i.quantity })),
      );

      let charge;
      try {
        charge = await withTimeout(
          deps.payment.charge({
            amountCents: totals.totalCents,
            currency: cart.currency,
            idempotencyKey,
            card: {
              number: body.card.number.replace(/\s+/g, ''),
              expMonth: body.card.expMonth,
              expYear: body.card.expYear,
              cvc: body.card.cvc,
            },
            customer: { id: userId, email: userEmail },
          }),
          PAYMENT_TIMEOUT_MS,
          'payment.charge',
        );
      } catch (err) {
        if (err instanceof TimeoutError) {
          throw new AppError('INTERNAL', 504, 'Payment provider timeout');
        }
        throw err;
      }

      if (charge.status !== 'succeeded') {
        const message =
          charge.failureCode === 'card_declined'
            ? 'Card declined'
            : charge.failureCode === 'expired_card'
              ? 'Card is expired'
              : 'Payment failed';
        throw AppError.validation(message, { field: 'card.number', code: charge.failureCode });
      }

      let order;
      try {
        order = await withTimeout(
          deps.orders.createOrder({
            userId,
            cartId: cart.id,
            shippingAddress: body.shippingAddress,
            totals,
            paymentLast4: charge.last4,
            paymentChargeId: charge.providerChargeId,
            idempotencyKey,
          }),
          ORDER_TX_TIMEOUT_MS,
          'orders.createOrder',
        );
      } catch (err) {
        if (err instanceof TimeoutError) {
          throw new AppError('INTERNAL', 504, 'Order persistence timeout');
        }
        throw err;
      }
      return toOrder(order);
    },

    async list(userId, args) {
      const { items, nextCursor } = await deps.orders.listByUser(userId, args);
      return { items: items.map(toOrder), nextCursor };
    },

    async getById(userId, orderId) {
      const order = await deps.orders.findById(orderId, userId);
      if (!order) throw AppError.notFound('Order');
      return toOrder(order);
    },
  };
}
