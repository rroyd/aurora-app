# 02 — Architecture

## High-Level Topology

```
┌────────────┐      HTTPS / JSON      ┌─────────────┐      SQL      ┌──────────┐
│  apps/web  │  ───────────────────▶  │  apps/api   │ ────────────▶ │  MySQL   │
│  (React)   │  ◀───────────────────  │  (Express)  │ ◀──────────── │   8.0    │
└────────────┘                        └─────────────┘               └──────────┘
       │                                     │
       └─────── @shared types (zod) ─────────┘
```

- Single backend (modular monolith). Each domain (`auth`, `products`, `cart`, `orders`, `users`) is a self-contained module.
- Shared package `@shared` holds **types and Zod schemas** that cross the FE/BE boundary. No runtime logic.
- Stateless API: JWT access tokens (15 min) + refresh tokens (30 days) stored as httpOnly cookies.

## Backend Layering (per module)

```
modules/<domain>/
├── <domain>.routes.ts       # Express router, wires HTTP → controller
├── <domain>.controller.ts   # Parses input (Zod), calls service, formats response
├── <domain>.service.ts      # Business rules, orchestrates repository + integrations
├── <domain>.repository.ts   # Data access (Prisma queries only — no business logic)
├── <domain>.schema.ts       # Zod input/output schemas (re-exported from @shared)
└── <domain>.types.ts        # Internal TypeScript types
```

### Dependency Direction (strict)

```
routes  →  controller  →  service  →  repository  →  Prisma
                              ↓
                          integrations (mail, payments, ...)
```

- Lower layers MUST NOT import from upper layers.
- Controllers MUST NOT call Prisma directly.
- Services MUST NOT touch `req`/`res`.

## Frontend Architecture (Feature-Sliced)

```
apps/web/src/
├── routes/            # React Router config (lazy-loaded route modules)
├── pages/             # Page-level components (one per route)
├── features/<domain>/ # Feature slices (UI + hooks + api + state for one domain)
│   ├── api.ts         # TanStack Query hooks calling the API client
│   ├── components/    # Domain-specific components
│   ├── hooks/         # Domain-specific hooks
│   └── types.ts       # Re-exports from @shared
├── components/ui/     # Generic, design-system primitives (Button, Input, ...)
├── components/layout/ # Header, Footer, Container, etc.
├── lib/               # Cross-cutting: config, api client, auth, utils
├── stores/            # Zustand stores (cart UI state, ui modals, ...)
└── hooks/             # Cross-cutting hooks (useDebounce, useMediaQuery, ...)
```

### State Management Rules

| State kind              | Tool                          | Example                                |
| ----------------------- | ----------------------------- | -------------------------------------- |
| Server state            | TanStack Query                | Products list, cart fetched from API   |
| Client UI state (local) | `useState` / `useReducer`     | Form drafts, modal open               |
| Client UI state (cross) | Zustand                       | Cart drawer open, toast queue          |
| URL state               | React Router search params    | Filters, pagination                    |
| Persistent (browser)    | Zustand `persist` middleware  | Guest cart, recently-viewed products   |

**Rule:** never duplicate server state into Zustand. The TanStack Query cache is the source of truth.

## Cross-Cutting Concerns

- **Auth flow:** issued in HTTP-only cookies. Access token in `Authorization: Bearer` header for protected calls is also accepted but not preferred. Refresh endpoint rotates both tokens.
- **Idempotency:** order-creation endpoints accept an `Idempotency-Key` header to prevent double-charges.
- **Pagination:** cursor-based (`?cursor=...&limit=20`) for product/order lists.
- **API errors:** uniform shape (see `05-error-handling.md`).
- **Time:** all timestamps are ISO 8601 strings in UTC over the wire; `Date` objects in DB.

## Extensibility Points

- New domain → drop a folder under `modules/<name>` following the layering. No edits to other modules needed.
- New payment provider → implement `PaymentProvider` interface (see `capabilities/payments.md`).
- New UI component → place under `components/ui/` and export from its `index.ts`.
