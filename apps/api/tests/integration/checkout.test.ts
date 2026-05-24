import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '@/db/prisma.js';
import { agent } from './helpers/agent.js';
import { seedCatalog, truncateAll } from './helpers/db.js';

const VALID_CARD = {
  number: '4242424242424242',
  expMonth: 12,
  expYear: new Date().getFullYear() + 2,
  cvc: '123',
  holderName: 'Test Holder',
};
const DECLINED_CARD = { ...VALID_CARD, number: '4000000000000002' };

const ADDRESS = {
  firstName: 'Test',
  lastName: 'Customer',
  line1: '1 Main St',
  city: 'Tel Aviv',
  region: 'TA',
  postalCode: '6100000',
  country: 'IL',
  phone: '+972-50-0000000',
};

async function registerCustomer() {
  const a = agent();
  await a
    .post('/v1/auth/register')
    .send({
      email: `buyer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`,
      password: 'BuyerPass123!',
      firstName: 'Buyer',
      lastName: 'One',
    })
    .expect(201);
  return a;
}

describe('checkout — happy path', () => {
  beforeEach(truncateAll);
  afterAll(() => prisma.$disconnect());

  it('lets a new user register, add to cart, and place an order', async () => {
    const { products } = await seedCatalog();
    const a = await registerCustomer();
    const book = products.find((p) => p.slug === 'fx-book')!;
    const mug = products.find((p) => p.slug === 'fx-mug')!;

    await a.post('/v1/cart/items').send({ productId: book.id, quantity: 2 }).expect(201);
    await a.post('/v1/cart/items').send({ productId: mug.id, quantity: 1 }).expect(201);

    const cart = await a.get('/v1/cart').expect(200);
    expect(cart.body.items).toHaveLength(2);
    expect(cart.body.subtotalCents).toBe(book.priceCents * 2 + mug.priceCents * 1);

    const order = await a
      .post('/v1/orders')
      .set('Idempotency-Key', 'happy-path-key-1')
      .send({ shippingAddress: ADDRESS, card: VALID_CARD });
    expect(order.status).toBe(201);
    expect(order.body.status).toBe('PAID');
    expect(order.body.items).toHaveLength(2);
    expect(order.body.paymentLast4).toBe('4242');

    const list = await a.get('/v1/orders').expect(200);
    expect(list.body.items).toHaveLength(1);
  });
});

describe('checkout — edge cases', () => {
  beforeEach(truncateAll);

  it('returns 400 with cart-is-empty when no items', async () => {
    await seedCatalog();
    const a = await registerCustomer();
    const res = await a
      .post('/v1/orders')
      .set('Idempotency-Key', 'empty-1')
      .send({ shippingAddress: ADDRESS, card: VALID_CARD });
    expect(res.status).toBe(400);
  });

  it('returns 400 when the payment provider declines the card', async () => {
    const { products } = await seedCatalog();
    const a = await registerCustomer();
    const book = products.find((p) => p.slug === 'fx-book')!;
    await a.post('/v1/cart/items').send({ productId: book.id, quantity: 1 }).expect(201);
    const res = await a
      .post('/v1/orders')
      .set('Idempotency-Key', 'declined-1')
      .send({ shippingAddress: ADDRESS, card: DECLINED_CARD });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/declined/i);
  });

  it('returns the existing order when the same idempotency key is replayed', async () => {
    const { products } = await seedCatalog();
    const a = await registerCustomer();
    const book = products.find((p) => p.slug === 'fx-book')!;
    await a.post('/v1/cart/items').send({ productId: book.id, quantity: 1 }).expect(201);

    const first = await a
      .post('/v1/orders')
      .set('Idempotency-Key', 'replay-1')
      .send({ shippingAddress: ADDRESS, card: VALID_CARD })
      .expect(201);

    // Add another item AFTER the first order — server should ignore it on replay.
    await a.post('/v1/cart/items').send({ productId: book.id, quantity: 5 });

    const second = await a
      .post('/v1/orders')
      .set('Idempotency-Key', 'replay-1')
      .send({ shippingAddress: ADDRESS, card: VALID_CARD })
      .expect(201);
    expect(second.body.id).toBe(first.body.id);
  });

  it('decrements product stock atomically when the order succeeds', async () => {
    const { products } = await seedCatalog();
    const a = await registerCustomer();
    const mug = products.find((p) => p.slug === 'fx-mug')!;
    const beforeStock = mug.stock;
    await a.post('/v1/cart/items').send({ productId: mug.id, quantity: 2 }).expect(201);
    await a
      .post('/v1/orders')
      .set('Idempotency-Key', 'stock-1')
      .send({ shippingAddress: ADDRESS, card: VALID_CARD })
      .expect(201);
    const after = await prisma.product.findUnique({ where: { id: mug.id } });
    expect(after?.stock).toBe(beforeStock - 2);
  });
});
