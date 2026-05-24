import { prisma } from '@/db/prisma.js';

/**
 * Truncate every table except Prisma's migration metadata.
 * Used in beforeEach so each test starts from a clean slate.
 */
export async function truncateAll(): Promise<void> {
  await prisma.$transaction([
    prisma.cartItem.deleteMany(),
    prisma.cart.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.address.deleteMany(),
    prisma.user.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
  ]);
}

export async function seedCatalog(): Promise<{
  categoryId: string;
  products: { id: string; slug: string; priceCents: number; stock: number }[];
}> {
  const category = await prisma.category.create({
    data: { slug: 'fixtures', name: 'Fixtures' },
  });
  const created = await prisma.$transaction([
    prisma.product.create({
      data: {
        slug: 'fx-book',
        name: 'Fixture Book',
        description: 'Test product A.',
        priceCents: 1500,
        imageUrl: 'https://example.com/a.jpg',
        stock: 10,
        categoryId: category.id,
      },
    }),
    prisma.product.create({
      data: {
        slug: 'fx-mug',
        name: 'Fixture Mug',
        description: 'Test product B.',
        priceCents: 2500,
        imageUrl: 'https://example.com/b.jpg',
        stock: 4,
        categoryId: category.id,
      },
    }),
    prisma.product.create({
      data: {
        slug: 'fx-pen',
        name: 'Fixture Pen',
        description: 'Test product C.',
        priceCents: 600,
        imageUrl: 'https://example.com/c.jpg',
        stock: 0,
        categoryId: category.id,
      },
    }),
  ]);
  return {
    categoryId: category.id,
    products: created.map((p) => ({
      id: p.id,
      slug: p.slug,
      priceCents: p.priceCents,
      stock: p.stock,
    })),
  };
}
