import type { ListProductsQuery, Product, ProductListResponse } from '@shared/contracts';
import { AppError } from '@/utils/AppError.js';
import type { ProductsRepository, ProductWithCategory } from './products.repository.js';

function toProduct(p: ProductWithCategory): Product {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    priceCents: p.priceCents,
    currency: p.currency,
    imageUrl: p.imageUrl,
    stock: p.stock,
    rating: p.rating,
    reviewCount: p.reviewCount,
    category: { id: p.category.id, slug: p.category.slug, name: p.category.name },
    createdAt: p.createdAt.toISOString(),
  };
}

export interface ProductsService {
  list(q: ListProductsQuery): Promise<ProductListResponse>;
  getBySlug(slug: string): Promise<Product>;
  getById(id: string): Promise<Product>;
  categories(): Promise<{ id: string; slug: string; name: string }[]>;
}

export function createProductsService(repo: ProductsRepository): ProductsService {
  return {
    async list(query) {
      const { items, nextCursor } = await repo.list(query);
      return { items: items.map(toProduct), nextCursor };
    },
    async getBySlug(slug) {
      const p = await repo.findBySlug(slug);
      if (!p) throw AppError.notFound('Product');
      return toProduct(p);
    },
    async getById(id) {
      const p = await repo.findById(id);
      if (!p) throw AppError.notFound('Product');
      return toProduct(p);
    },
    categories: () => repo.listCategories(),
  };
}
