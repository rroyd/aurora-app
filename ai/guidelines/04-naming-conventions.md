# 04 — Naming Conventions

## Identifiers

| Construct                | Style                  | Example                            |
| ------------------------ | ---------------------- | ---------------------------------- |
| Variables / functions    | `camelCase`            | `getCurrentUser`, `cartTotal`      |
| React components         | `PascalCase`           | `ProductCard`, `CheckoutStepper`   |
| Types / interfaces       | `PascalCase`           | `OrderLineItem`                    |
| Enums                    | `PascalCase` + members `PascalCase` | `OrderStatus.Paid`     |
| Constants (true consts)  | `SCREAMING_SNAKE_CASE` | `MAX_CART_ITEMS`                   |
| React hooks              | `useXxx`               | `useCart`, `useDebounce`           |
| Booleans                 | `is/has/can/should`    | `isAuthenticated`, `hasInventory`  |
| Event handlers (prop)    | `onXxx`                | `onSubmit`, `onAdjustQuantity`     |
| Event handlers (impl)    | `handleXxx`            | `handleSubmit`                     |
| Zod schemas              | `xxxSchema`            | `loginSchema`                      |
| Zod types                | `XxxInput` / `Xxx`     | `LoginInput`, `Product`            |

## API Naming

- **HTTP verbs match intent:** `GET` (read), `POST` (create / non-idempotent), `PUT` (full replace), `PATCH` (partial update), `DELETE` (remove).
- **Routes are resource-oriented, plural nouns:** `/products`, `/orders/:orderId/items`.
- **Sub-resources reflect ownership:** `/users/me/orders` (current user's orders).
- **Query strings for filtering / pagination:** `?category=electronics&minPrice=100&cursor=abc&limit=20`.
- **Avoid verbs in paths.** Exception: state transitions — `POST /orders/:id/cancel`.

## Database (Prisma) Naming

- **Models:** `PascalCase` singular — `Product`, `OrderItem`.
- **Fields:** `camelCase` — `createdAt`, `priceCents`.
- **Tables (`@@map`):** `snake_case` plural — `@@map("order_items")`.
- **Columns (`@map`):** `snake_case` — `@map("created_at")`.
- **Money:** integers in the smallest unit (cents) — never floats. Field name ends in `Cents` (`priceCents`).
- **Timestamps:** every row has `createdAt` (`@default(now())`) and `updatedAt` (`@updatedAt`).
- **Soft delete:** when needed, add `deletedAt DateTime?`. Repository must filter `deletedAt: null` by default.

## CSS / Tailwind

- Compose utilities directly. No bespoke CSS files except `index.css` (Tailwind layers).
- Extract a component when the same utility string appears ≥3 times.
- Tailwind theme tokens live in `tailwind.config.ts` — never hard-code brand colors.

## Comments

- Default: write no comment. Names should do the work.
- Write a comment only when *why* is non-obvious (a constraint, a workaround, a tricky invariant).
- Never restate *what* the code does.
