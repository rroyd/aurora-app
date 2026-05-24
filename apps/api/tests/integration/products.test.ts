import { beforeEach, describe, expect, it } from 'vitest';
import { agent } from './helpers/agent.js';
import { seedCatalog, truncateAll } from './helpers/db.js';

describe('GET /v1/products', () => {
  beforeEach(truncateAll);

  it('returns the full catalog when no filters are supplied', async () => {
    await seedCatalog();
    const res = await agent().get('/v1/products').expect(200);
    expect(res.body.items).toHaveLength(3);
    expect(res.body.nextCursor).toBeNull();
  });

  it('filters by category slug', async () => {
    await seedCatalog();
    const res = await agent().get('/v1/products?category=fixtures').expect(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    for (const p of res.body.items) expect(p.category.slug).toBe('fixtures');
  });

  it('paginates with a stable cursor', async () => {
    await seedCatalog();
    const page1 = await agent().get('/v1/products?limit=2').expect(200);
    expect(page1.body.items).toHaveLength(2);
    expect(page1.body.nextCursor).toEqual(expect.any(String));

    const page2 = await agent()
      .get(`/v1/products?limit=2&cursor=${encodeURIComponent(page1.body.nextCursor)}`)
      .expect(200);
    expect(page2.body.items).toHaveLength(1);
    const seen = new Set([...page1.body.items, ...page2.body.items].map((p) => p.id));
    expect(seen.size).toBe(3);
  });

  it('returns 404 when fetching an unknown slug', async () => {
    await seedCatalog();
    const res = await agent().get('/v1/products/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
