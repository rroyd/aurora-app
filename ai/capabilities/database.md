# Capability — Database (MySQL via Prisma)

## Why Prisma

- Type-safe queries (auto-generated client from `schema.prisma`).
- Declarative migrations (`prisma migrate dev` / `prisma migrate deploy`).
- Single source of truth for schema; TS types flow into services + into `@shared` where applicable.

## Schema Highlights

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  firstName     String
  lastName      String
  role          Role     @default(CUSTOMER)
  addresses     Address[]
  orders        Order[]
  refreshTokens RefreshToken[]
  cart          Cart?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  @@map("users")
}

enum Role { CUSTOMER ADMIN }

model Product {
  id           String   @id @default(cuid())
  slug         String   @unique
  name         String
  description  String   @db.Text
  priceCents   Int
  currency     String   @default("USD")
  imageUrl     String
  stock        Int      @default(0)
  category     Category @relation(fields: [categoryId], references: [id])
  categoryId   String
  rating       Float    @default(0)
  reviewCount  Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  cartItems    CartItem[]
  orderItems   OrderItem[]
  @@index([categoryId])
  @@map("products")
}

model Category {
  id        String    @id @default(cuid())
  slug      String    @unique
  name      String
  products  Product[]
  createdAt DateTime  @default(now())
  @@map("categories")
}

model Cart {
  id        String     @id @default(cuid())
  user      User       @relation(fields: [userId], references: [id])
  userId    String     @unique
  items     CartItem[]
  updatedAt DateTime   @updatedAt
  createdAt DateTime   @default(now())
  @@map("carts")
}

model CartItem {
  id         String  @id @default(cuid())
  cart       Cart    @relation(fields: [cartId], references: [id], onDelete: Cascade)
  cartId     String
  product    Product @relation(fields: [productId], references: [id])
  productId  String
  quantity   Int
  @@unique([cartId, productId])
  @@map("cart_items")
}

model Order {
  id              String      @id @default(cuid())
  user            User        @relation(fields: [userId], references: [id])
  userId          String
  status          OrderStatus @default(PENDING)
  items           OrderItem[]
  subtotalCents   Int
  shippingCents   Int
  taxCents        Int
  totalCents      Int
  currency        String      @default("USD")
  shippingAddress Json
  paymentLast4    String?
  idempotencyKey  String?     @unique
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  @@index([userId, createdAt])
  @@map("orders")
}

model OrderItem {
  id              String  @id @default(cuid())
  order           Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  orderId         String
  productId       String
  nameSnapshot    String
  priceCentsSnapshot Int
  quantity        Int
  @@map("order_items")
}

enum OrderStatus { PENDING PAID SHIPPED DELIVERED CANCELLED }

model Address {
  id         String  @id @default(cuid())
  user       User    @relation(fields: [userId], references: [id])
  userId     String
  label      String
  line1      String
  line2      String?
  city       String
  region     String
  postalCode String
  country    String
  isDefault  Boolean @default(false)
  @@map("addresses")
}

model RefreshToken {
  id        String   @id @default(cuid())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  tokenHash String   @unique
  familyId  String
  revokedAt DateTime?
  expiresAt DateTime
  createdAt DateTime @default(now())
  @@index([familyId])
  @@map("refresh_tokens")
}
```

## Repository Pattern

Each module has a `<domain>.repository.ts` that wraps Prisma. Services depend on the repository's **interface**, not on Prisma directly. This lets tests pass a fake without `vi.mock`.

```ts
// products.repository.ts
export interface ProductRepository {
  findById(id: string): Promise<Product | null>;
  findBySlug(slug: string): Promise<Product | null>;
  search(args: SearchArgs): Promise<{ items: Product[]; nextCursor: string | null }>;
}
```

## Transactions

- Order creation MUST be a single Prisma transaction: validate stock → decrement stock → create order rows → mark cart cleared.
- Use `$transaction(async (tx) => { ... })` (interactive). Set the transaction isolation level explicitly for the order flow: `Serializable`.

## Seed Data

`apps/api/prisma/seed.ts` populates:

- 6 categories (Electronics, Apparel, Home, Books, Sports, Beauty).
- ~40 products with realistic images (Unsplash URLs), names, descriptions, prices.
- 2 demo users: `demo@shop.dev` / `Password123!` (customer), `admin@shop.dev` / `Password123!` (admin).
