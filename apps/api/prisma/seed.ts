import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

const CATEGORIES = [
  { slug: 'electronics', name: 'Electronics' },
  { slug: 'apparel', name: 'Apparel' },
  { slug: 'home', name: 'Home & Living' },
  { slug: 'books', name: 'Books' },
  { slug: 'sports', name: 'Sports & Outdoors' },
  { slug: 'beauty', name: 'Beauty' },
];

type SeedProduct = {
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string;
  stock: number;
  rating: number;
  reviewCount: number;
  categorySlug: string;
};

const PRODUCTS: SeedProduct[] = [
  // Electronics
  { slug: 'aurora-wireless-headphones', name: 'Aurora Wireless Headphones', description: 'Studio-quality over-ear headphones with active noise cancellation and 40-hour battery.', priceCents: 24900, imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', stock: 35, rating: 4.7, reviewCount: 312, categorySlug: 'electronics' },
  { slug: 'nimbus-laptop-stand', name: 'Nimbus Aluminum Laptop Stand', description: 'Ergonomic, adjustable stand crafted from a single block of aluminum.', priceCents: 7900, imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800', stock: 120, rating: 4.5, reviewCount: 88, categorySlug: 'electronics' },
  { slug: 'orbit-smart-watch', name: 'Orbit Smart Watch', description: 'Heart-rate, SpO2, and sleep tracking with a 7-day battery and AMOLED display.', priceCents: 19900, imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800', stock: 50, rating: 4.6, reviewCount: 504, categorySlug: 'electronics' },
  { slug: 'pulse-bluetooth-speaker', name: 'Pulse Bluetooth Speaker', description: 'IP67 waterproof speaker with 24-hour playback and stereo pairing.', priceCents: 8900, imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800', stock: 80, rating: 4.4, reviewCount: 219, categorySlug: 'electronics' },
  { slug: 'echo-mechanical-keyboard', name: 'Echo Mechanical Keyboard', description: 'Hot-swap switches, RGB per-key lighting, and a CNC aluminum body.', priceCents: 15900, imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800', stock: 28, rating: 4.8, reviewCount: 145, categorySlug: 'electronics' },
  { slug: 'lumen-desk-lamp', name: 'Lumen LED Desk Lamp', description: 'Dimmable, color-temperature adjustable, with wireless charging base.', priceCents: 6900, imageUrl: 'https://images.unsplash.com/photo-1565374395542-0ce18882c857?w=800', stock: 95, rating: 4.3, reviewCount: 67, categorySlug: 'electronics' },
  { slug: 'horizon-4k-monitor', name: 'Horizon 27" 4K Monitor', description: '27-inch IPS, 144 Hz, HDR400, USB-C with 90W power delivery.', priceCents: 49900, imageUrl: 'https://images.unsplash.com/photo-1547119957-637f8679db1e?w=800', stock: 18, rating: 4.7, reviewCount: 92, categorySlug: 'electronics' },

  // Apparel
  { slug: 'classic-oxford-shirt', name: 'Classic Oxford Shirt', description: '100% combed cotton, tailored fit, mother-of-pearl buttons.', priceCents: 6900, imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800', stock: 200, rating: 4.5, reviewCount: 412, categorySlug: 'apparel' },
  { slug: 'merino-crewneck-sweater', name: 'Merino Crewneck Sweater', description: 'Lightweight 100% Australian merino wool, machine-washable.', priceCents: 9900, imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800', stock: 150, rating: 4.6, reviewCount: 256, categorySlug: 'apparel' },
  { slug: 'selvedge-denim-jeans', name: 'Selvedge Denim Jeans', description: 'Japanese 14oz selvedge denim, raw and unsanforized.', priceCents: 14900, imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800', stock: 80, rating: 4.7, reviewCount: 178, categorySlug: 'apparel' },
  { slug: 'rain-shell-jacket', name: 'Rain Shell Jacket', description: 'Three-layer waterproof breathable membrane, taped seams.', priceCents: 17900, imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800', stock: 60, rating: 4.4, reviewCount: 98, categorySlug: 'apparel' },
  { slug: 'cashmere-beanie', name: 'Cashmere Beanie', description: 'Soft 100% Mongolian cashmere, ribbed cuff.', priceCents: 4900, imageUrl: 'https://images.unsplash.com/photo-1542596594-649edbc13630?w=800', stock: 110, rating: 4.5, reviewCount: 73, categorySlug: 'apparel' },
  { slug: 'leather-sneakers', name: 'Italian Leather Sneakers', description: 'Hand-finished in Italy, full-grain leather, Margom soles.', priceCents: 19900, imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', stock: 70, rating: 4.8, reviewCount: 311, categorySlug: 'apparel' },

  // Home
  { slug: 'linen-bedding-set', name: 'Stonewashed Linen Bedding', description: 'European flax linen, prewashed for softness. Queen size.', priceCents: 16900, imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800', stock: 40, rating: 4.7, reviewCount: 142, categorySlug: 'home' },
  { slug: 'ceramic-pour-over', name: 'Ceramic Pour-Over Set', description: 'Hand-thrown ceramic dripper with bamboo stand and server.', priceCents: 5900, imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800', stock: 130, rating: 4.4, reviewCount: 88, categorySlug: 'home' },
  { slug: 'cast-iron-skillet', name: 'Cast Iron Skillet 10"', description: 'Pre-seasoned, made in the USA, lifetime warranty.', priceCents: 3900, imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', stock: 220, rating: 4.8, reviewCount: 1023, categorySlug: 'home' },
  { slug: 'walnut-cutting-board', name: 'Walnut Cutting Board', description: 'End-grain walnut, oiled finish, juice channel.', priceCents: 7900, imageUrl: 'https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=800', stock: 75, rating: 4.6, reviewCount: 156, categorySlug: 'home' },
  { slug: 'soy-candle-set', name: 'Soy Candle Trio', description: 'Hand-poured soy wax candles in cedar, fig, and bergamot.', priceCents: 4500, imageUrl: 'https://images.unsplash.com/photo-1602874801007-37cf4dd61dca?w=800', stock: 180, rating: 4.5, reviewCount: 211, categorySlug: 'home' },
  { slug: 'wool-throw-blanket', name: 'Wool Throw Blanket', description: 'Heavyweight herringbone weave, fringed edges.', priceCents: 11900, imageUrl: 'https://images.unsplash.com/photo-1522444195799-478538b28823?w=800', stock: 90, rating: 4.6, reviewCount: 102, categorySlug: 'home' },

  // Books
  { slug: 'the-pragmatic-programmer', name: 'The Pragmatic Programmer', description: 'Classic on software craftsmanship — 20th anniversary edition.', priceCents: 3500, imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800', stock: 250, rating: 4.9, reviewCount: 1872, categorySlug: 'books' },
  { slug: 'designing-data-intensive-applications', name: 'Designing Data-Intensive Applications', description: 'The reference text on modern data systems.', priceCents: 4900, imageUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800', stock: 180, rating: 4.9, reviewCount: 2304, categorySlug: 'books' },
  { slug: 'atomic-habits', name: 'Atomic Habits', description: 'A practical framework for building good habits and breaking bad ones.', priceCents: 2400, imageUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800', stock: 320, rating: 4.8, reviewCount: 5432, categorySlug: 'books' },
  { slug: 'sapiens', name: 'Sapiens: A Brief History of Humankind', description: 'Yuval Noah Harari\'s sweeping account of human history.', priceCents: 2200, imageUrl: 'https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=800', stock: 410, rating: 4.7, reviewCount: 8910, categorySlug: 'books' },
  { slug: 'project-hail-mary', name: 'Project Hail Mary', description: 'A lone astronaut must save humanity in this hard-SF page-turner.', priceCents: 1800, imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800', stock: 290, rating: 4.8, reviewCount: 3201, categorySlug: 'books' },

  // Sports
  { slug: 'all-court-tennis-racket', name: 'All-Court Tennis Racket', description: 'Graphite frame, 100 sq in head, strung tension 55 lbs.', priceCents: 18900, imageUrl: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800', stock: 60, rating: 4.5, reviewCount: 78, categorySlug: 'sports' },
  { slug: 'trail-running-shoes', name: 'Trail Running Shoes', description: 'Aggressive lug pattern, rock plate, Gore-Tex upper.', priceCents: 13900, imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', stock: 110, rating: 4.6, reviewCount: 234, categorySlug: 'sports' },
  { slug: 'yoga-mat-pro', name: 'Yoga Mat Pro 6mm', description: 'Closed-cell PVC, lifetime alignment lines, carry strap.', priceCents: 6900, imageUrl: 'https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=800', stock: 140, rating: 4.7, reviewCount: 412, categorySlug: 'sports' },
  { slug: 'climbing-chalk-bag', name: 'Climbing Chalk Bag', description: 'Fleece-lined, drawcord closure, brush holder.', priceCents: 2900, imageUrl: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800', stock: 200, rating: 4.4, reviewCount: 56, categorySlug: 'sports' },
  { slug: 'carbon-bike-pedals', name: 'Carbon Clipless Pedals', description: 'Titanium spindle, carbon body, dual-sided entry.', priceCents: 22900, imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800', stock: 40, rating: 4.7, reviewCount: 89, categorySlug: 'sports' },

  // Beauty
  { slug: 'vitamin-c-serum', name: 'Vitamin C Serum 15%', description: 'L-ascorbic acid, ferulic acid, vitamin E. 30 ml.', priceCents: 5900, imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800', stock: 220, rating: 4.6, reviewCount: 1432, categorySlug: 'beauty' },
  { slug: 'hyaluronic-moisturizer', name: 'Hyaluronic Moisturizer', description: 'Triple-weight hyaluronic acid + ceramides. Fragrance-free.', priceCents: 4900, imageUrl: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800', stock: 260, rating: 4.7, reviewCount: 987, categorySlug: 'beauty' },
  { slug: 'mineral-sunscreen-spf50', name: 'Mineral Sunscreen SPF 50', description: 'Zinc oxide + niacinamide. Reef-safe, no white cast.', priceCents: 3500, imageUrl: 'https://images.unsplash.com/photo-1556228724-4b4f57e1dcdf?w=800', stock: 340, rating: 4.5, reviewCount: 612, categorySlug: 'beauty' },
  { slug: 'gentle-cleansing-balm', name: 'Gentle Cleansing Balm', description: 'Removes makeup and SPF without stripping. Squalane base.', priceCents: 3900, imageUrl: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=800', stock: 180, rating: 4.6, reviewCount: 423, categorySlug: 'beauty' },
  { slug: 'silk-pillowcase', name: 'Mulberry Silk Pillowcase', description: '22-momme 100% mulberry silk, hidden zipper.', priceCents: 7900, imageUrl: 'https://images.unsplash.com/photo-1631046263484-91d6dadbd24c?w=800', stock: 90, rating: 4.7, reviewCount: 332, categorySlug: 'beauty' },
];

async function main() {
  console.log('Seeding…');

  // Categories
  const catIdBySlug = new Map<string, string>();
  for (const c of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: c,
    });
    catIdBySlug.set(c.slug, cat.id);
  }

  // Products
  for (const p of PRODUCTS) {
    const categoryId = catIdBySlug.get(p.categorySlug);
    if (!categoryId) continue;
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        priceCents: p.priceCents,
        imageUrl: p.imageUrl,
        stock: p.stock,
        rating: p.rating,
        reviewCount: p.reviewCount,
        categoryId,
      },
      create: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        priceCents: p.priceCents,
        imageUrl: p.imageUrl,
        stock: p.stock,
        rating: p.rating,
        reviewCount: p.reviewCount,
        categoryId,
      },
    });
  }

  // Demo users
  const customerHash = await argon2.hash('Password123!', { type: argon2.argon2id });
  const adminHash = await argon2.hash('Password123!', { type: argon2.argon2id });

  await prisma.user.upsert({
    where: { email: 'demo@shop.dev' },
    update: {},
    create: {
      email: 'demo@shop.dev',
      passwordHash: customerHash,
      firstName: 'Demo',
      lastName: 'Customer',
      role: 'CUSTOMER',
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@shop.dev' },
    update: {},
    create: {
      email: 'admin@shop.dev',
      passwordHash: adminHash,
      firstName: 'Admin',
      lastName: 'Account',
      role: 'ADMIN',
    },
  });

  console.log(`Seeded ${CATEGORIES.length} categories, ${PRODUCTS.length} products, 2 users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
