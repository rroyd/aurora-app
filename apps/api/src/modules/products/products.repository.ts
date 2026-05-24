import type { Prisma, PrismaClient } from '@prisma/client';
import type { ListProductsQuery } from '@shared/contracts';

export interface ProductsRepository {
  findBySlug(slug: string): Promise<ProductWithCategory | null>;
  findById(id: string): Promise<ProductWithCategory | null>;
  list(query: ListProductsQuery): Promise<{
    items: ProductWithCategory[];
    nextCursor: string | null;
  }>;
  listCategories(): Promise<{ id: string; slug: string; name: string }[]>;
}

export type ProductWithCategory = Prisma.ProductGetPayload<{
  include: { category: true };
}>;

export function createProductsRepository(prisma: PrismaClient): ProductsRepository {
  return {
    findBySlug: (slug) =>
      prisma.product.findUnique({ where: { slug }, include: { category: true } }),
    findById: (id) =>
      prisma.product.findUnique({ where: { id }, include: { category: true } }),
    listCategories: () =>
      prisma.category.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, slug: true, name: true },
      }),
    list: async (query) => {
      const where: Prisma.ProductWhereInput = {};

      if (query.q) {
        where.OR = [
          { name: { contains: query.q } },
          { description: { contains: query.q } },
        ];
      }
      if (query.category) {
        where.category = { slug: query.category };
      }
      if (query.minPrice !== undefined || query.maxPrice !== undefined) {
        where.priceCents = {
          ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
          ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
        };
      }

      const orderBy: Prisma.ProductOrderByWithRelationInput[] =
        query.sort === 'price-asc'
          ? [{ priceCents: 'asc' }, { id: 'asc' }]
          : query.sort === 'price-desc'
            ? [{ priceCents: 'desc' }, { id: 'asc' }]
            : query.sort === 'popular'
              ? [{ reviewCount: 'desc' }, { id: 'asc' }]
              : [{ createdAt: 'desc' }, { id: 'asc' }];

      const take = query.limit + 1;
      const items = await prisma.product.findMany({
        where,
        orderBy,
        include: { category: true },
        take,
        ...(query.cursor
          ? { cursor: { id: query.cursor }, skip: 1 }
          : {}),
      });

      const hasMore = items.length > query.limit;
      const trimmed = hasMore ? items.slice(0, query.limit) : items;
      const nextCursor = hasMore ? (trimmed.at(-1)?.id ?? null) : null;
      return { items: trimmed, nextCursor };
    },
  };
}
