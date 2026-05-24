# Aurora — eCommerce Platform

[![CI](https://github.com/rroyd/aurora-app/actions/workflows/ci.yml/badge.svg)](https://github.com/rroyd/aurora-app/actions/workflows/ci.yml)

A production-grade full-stack eCommerce platform — generated from an AI Blueprint (`ai/`) and hardened into a working monorepo. The repo is the deliverable for the *AI-Driven Software Engineering* assignment.

This document is written for engineers who are about to read, run, extend, or operate the system. It is intentionally **opinionated**: every choice is named with a reason, every trade-off is called out, and every "this would need to change for production" item is explicit.

---

## Table of contents

- [What you're looking at](#what-youre-looking-at)
- [Quickstart](#quickstart)
  - [Option A — local dev (host node + dockerized DB)](#option-a--local-dev-host-node--dockerized-db)
  - [Option B — fully dockerized stack](#option-b--fully-dockerized-stack)
  - [Common make targets](#common-make-targets)
- [Repository layout](#repository-layout)
- [Architecture](#architecture)
- [Design patterns in use](#design-patterns-in-use)
- [Resilience, observability, and security](#resilience-observability-and-security)
- [API documentation](#api-documentation)
- [Testing](#testing)
- [Trade-offs we made](#trade-offs-we-made)
- [Path to production](#path-to-production)
- [AI collaboration](#ai-collaboration)
- [Operational runbook](#operational-runbook)
- [Conventional commits + branching](#conventional-commits--branching)

---

## What you're looking at

```
ai-blueprint-ecommerce/
├── ai/                 # The "engine" — guidelines + capabilities + initial.md
├── apps/
│   ├── api/            # Node 20 + Express + TypeScript + Prisma + MySQL
│   └── web/            # React 18 + TypeScript + Vite + Tailwind + Framer Motion
├── packages/
│   └── shared/         # Zod schemas + inferred types (single source of truth)
├── docs/               # openapi.json, Postman collection, ADRs
├── docker-compose.yml  # Production-shape stack (mysql + migrate + api + web)
├── docker-compose.dev.yml  # Source-mounted hot-reload override
├── Makefile            # 28 self-documenting targets — run `make help`
└── .github/workflows/  # CI: lint + typecheck + unit + integration + docker build
```

**Status:**

| Layer            | Capability                                                          | State |
| ---------------- | ------------------------------------------------------------------- | ----- |
| Auth             | Argon2id, JWT access + opaque refresh, rotation, family-revocation  | ✅    |
| Catalog          | Cursor-paginated, search, multi-filter, sort                        | ✅    |
| Cart             | Server cart + guest cart with merge-on-login                        | ✅    |
| Checkout         | Multi-step UI, atomic transaction, idempotency-key replay, mock card| ✅    |
| Account          | Profile, password change, address book, order history               | ✅    |
| Observability    | Structured pino logs, request IDs, per-request duration             | ✅    |
| Resilience       | Timeouts on external I/O, retry helper for idempotent ops           | ✅    |
| Docs             | Swagger UI at `/v1/docs`, OpenAPI export, Postman collection        | ✅    |
| CI               | GitHub Actions: lint, typecheck, unit, integration, docker          | ✅    |
| Tests            | 17 unit + 21 integration                                            | ✅    |

---

## Quickstart

### Prerequisites

- Node.js ≥ 20.11 (the repo pins to 20.18 in CI / Docker)
- pnpm 9 — install with `corepack enable && corepack prepare pnpm@9.0.0 --activate`
- Docker Desktop (or any Docker engine)

### Option A — local dev (host node + dockerized DB)

Fast iteration: tsx-watch for the API, Vite HMR for the web, MySQL in a container.

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Generate JWT secrets and paste into apps/api/.env
openssl rand -base64 32   # → JWT_ACCESS_SECRET
openssl rand -base64 32   # → JWT_REFRESH_SECRET (must differ!)

make db-up                # starts MySQL on :3306
make migrate              # applies Prisma migrations
make seed                 # 6 categories, 34 products, 2 demo users
make dev                  # API → :4000, web → :5173
```

Open <http://localhost:5173>.

### Option B — fully dockerized stack

Everything runs in containers — DB, one-shot migrator, API, web. Closer to production shape.

```bash
make up         # builds + starts mysql + migrate + api + web
make logs       # tail all services
make down       # stop
make nuke       # stop AND drop volumes (deletes DB data)
```

The compose file uses dependency `condition: service_completed_successfully` on the migrate job, so the API only starts after migrations apply.

### Common make targets

```
help          Show this help (auto-generated)
install       Install all workspace dependencies
dev           Run API + web together (tsx watch + vite)
up            Build + start the full dockerized stack
db-up         Start MySQL only
migrate       Apply Prisma migrations
seed          Seed demo data
test          Run unit tests
test-int      Run integration tests
docker-build  Build the production API + web images
ci            Full local CI pipeline (install + typecheck + lint + test)
```

`make help` lists all 28.

### Default credentials & test cards

| What                 | Value                            |
| -------------------- | -------------------------------- |
| Demo customer        | `demo@shop.dev` / `Password123!` |
| Demo admin           | `admin@shop.dev` / `Password123!`|
| Test card — succeeds | `4242 4242 4242 4242`            |
| Test card — declines | `4000 0000 0000 0002`            |

---

## Repository layout

```
apps/api/
├── prisma/                # schema.prisma + migrations + seed.ts
├── src/
│   ├── config/env.ts      # Zod-validated env; reading process.env elsewhere is forbidden
│   ├── db/prisma.ts       # PrismaClient singleton
│   ├── middleware/        # requestId, timing, error, rateLimit, auth
│   ├── modules/           # one folder per domain — auth, products, cart, orders, users
│   │   └── <domain>/
│   │       ├── *.repository.ts   # ONLY layer allowed to call Prisma
│   │       ├── *.service.ts      # Pure business logic; throws AppError
│   │       ├── *.routes.ts       # Wires HTTP to controller
│   │       └── *.controller.ts   # Thin: parse → call service → return
│   ├── docs/              # OpenAPI generation + Swagger UI router
│   ├── utils/             # AppError, asyncHandler, logger, withTimeout, withRetry
│   ├── app.ts             # createApp() — composes the Express app
│   └── server.ts          # bootstraps + listen + graceful shutdown
└── tests/                 # unit tests + tests/integration/

apps/web/
├── src/
│   ├── components/{ui,layout}/   # Generic primitives; never feature-aware
│   ├── features/<domain>/         # Feature slices: api.ts, hooks, components
│   ├── pages/                     # One per route
│   ├── routes/                    # React Router config
│   ├── lib/                       # api client, queryClient, format, config
│   ├── stores/                    # Zustand stores (cart drawer, guest cart)
│   ├── styles/index.css           # Tailwind layers
│   ├── App.tsx
│   └── main.tsx
└── tests/

packages/shared/src/
├── schemas/               # Zod schemas (single source of truth for FE/BE)
└── index.ts               # Re-exports — both apps import @shared/contracts
```

The shape is documented and enforced in `ai/guidelines/03-folder-structure.md`.

---

## Architecture

### High-level

```
┌────────────┐   HTTPS / JSON    ┌─────────────┐   SQL    ┌──────────┐
│  apps/web  │ ────────────────▶ │  apps/api   │ ───────▶ │  MySQL   │
│  React 18  │ ◀──────────────── │  Express    │ ◀─────── │   8.0    │
└────────────┘                   └─────────────┘          └──────────┘
       └────────── @shared/contracts (Zod) ──────────┘
```

- **Modular monolith.** One backend process, five domain modules with hard layering rules. We deliberately avoided microservices — at this scope they add ops cost without solving any real problem.
- **Single source of truth on the wire.** Zod schemas live in `packages/shared`. The API parses with them; the web imports their inferred types and uses them in `react-hook-form`. The OpenAPI spec is generated from the *same* schemas.
- **Stateless API.** JWT access (15 min) + opaque refresh (30 days) stored hashed in DB and rotated on every refresh. No server session store needed.

### Backend layering (strict)

```
routes  →  controller  →  service  →  repository  →  Prisma
                              ↓
                          integrations (payment, mail, ...)
```

- Controllers parse with Zod and never touch Prisma.
- Services throw typed `AppError`; a single middleware formats every error response.
- Repositories are the only layer with Prisma imports. They're easy to fake in tests.
- Dependency direction is enforced by code review and by directory imports.

### Frontend architecture

- **Feature-sliced.** `features/<domain>` owns its API hooks, components, and (if needed) local state.
- **Server state via TanStack Query** with stable hierarchical query keys. Mutations invalidate the keys they affect.
- **Client UI state via Zustand** — only for cross-component, non-server state (cart drawer open, guest cart, toasts).
- **URL state via search params** for filters/pagination so pages are linkable and refresh-safe.
- **Forms via react-hook-form + zodResolver** using the shared schemas.

The rule we never break: *don't duplicate server state into Zustand. TanStack Query's cache is the source of truth.*

---

## Design patterns in use

| Pattern                   | Where                                                   | Why                                                              |
| ------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------- |
| **Modular monolith**      | `apps/api/src/modules/<domain>/`                        | Domain isolation without ops overhead                            |
| **Repository pattern**    | `<domain>.repository.ts`                                | Lets services be unit-tested without Prisma                      |
| **Dependency injection**  | `createApp()` wires repos → services → routers          | Substitute fakes in tests; swap providers (Stripe for mock)      |
| **Result-by-exception**   | `AppError` thrown by services, handled at edge          | Controllers stay thin; one place to format errors                |
| **Factory function**      | `createXRouter(svc)`, `createXService(deps)`            | Avoids module-level side effects; testable                       |
| **Strategy**              | `PaymentProvider` interface + `MockPaymentProvider`     | Swap in Stripe by writing a single class                         |
| **Idempotency key**       | `POST /orders` accepts `Idempotency-Key` header         | Safe to retry on the client without double-charges               |
| **Cursor pagination**     | Products, orders                                        | Stable under concurrent inserts; no offset drift                 |
| **Optimistic-aware merge**| `useUnifiedCart` merges guest+server carts on login     | Guest doesn't lose their cart when signing in                    |
| **Token rotation + families** | `auth.service.ts` `refresh()`                       | Detect reuse; revoke the whole family on suspected theft         |
| **Adapter (logging)**     | `pino` wrapped behind `logger` module                   | Swap to OTLP/Sentry without rewriting call sites                 |

---

## Resilience, observability, and security

### Resilience

- **Timeouts on every external I/O.** `withTimeout(promise, ms, op)` wraps the payment provider and the order-creation Prisma transaction. A stuck upstream cannot pin a request thread.
- **Retry helper** (`withRetry`) for idempotent operations only. We deliberately do **not** retry payment charges — that's idempotency-key territory at the provider.
- **Atomic checkout.** Order creation runs inside `prisma.$transaction(..., { isolationLevel: 'Serializable' })`: validate stock → decrement stock → create order rows → clear cart. Concurrent buyers of the last item see consistent results.
- **Graceful shutdown.** `tini` forwards signals; `server.ts` traps `SIGINT`/`SIGTERM`, drains in-flight requests, then exits.

### Observability

- **Structured logs (pino).** JSON in production, pretty in dev. Sensitive fields (`Cookie`, `Authorization`, `passwordHash`, `card.*`) are redacted at the logger level.
- **Request IDs.** Every request gets a UUID v4 (or the inbound `X-Request-Id` if it matches a safe pattern). Echoed on the response and present in every log line for that request.
- **Per-request timing.** A `timing` middleware logs `{ method, route, status, durationMs }` and adds `Server-Timing: app;dur=<ms>` so the duration shows in browser devtools.
- **Health endpoints.** `/healthz` returns instantly; `/readyz` pings the DB.

### Security baseline

| Concern               | What we do                                                    |
| --------------------- | ------------------------------------------------------------- |
| Password storage      | Argon2id (`t=3, m=64MB, p=1`)                                 |
| Token storage         | Access JWT in httpOnly cookie; refresh stored hashed in DB    |
| Token theft           | Family-revoke on reuse detection                              |
| Auth rate limit       | 10 req / 15 min / IP on `/auth/*`                             |
| Global rate limit     | 300 req / 5 min / IP                                          |
| Validation            | Zod `.strict()` on every body/query/param                     |
| Body size cap         | `express.json({ limit: '100kb' })`                            |
| Headers               | `helmet()` defaults                                           |
| CORS                  | Single configured origin, credentials true                    |
| SQL injection         | Prisma parameterized queries only                             |
| XSS                   | React escapes; `dangerouslySetInnerHTML` is forbidden         |
| Secrets in logs       | Pino redaction allowlist for cookies/auth headers/cards       |

---

## API documentation

- **Swagger UI**: <http://localhost:4000/v1/docs>
- **Raw spec**: <http://localhost:4000/v1/docs/openapi.json>
- **On-disk copy**: `docs/openapi.json` (regenerate with `pnpm --filter @app/api docs:openapi`)
- **Postman collection**: `docs/aurora.postman_collection.json` — import it and run the requests top-to-bottom; scripts capture `{{accessToken}}` and `{{productId}}` automatically.

The spec is *generated from the same Zod schemas* the API uses for validation, so it cannot drift from the implementation.

---

## Testing

```
make test          # all unit tests (fast, no DB)
make test-int      # integration tests (real MySQL via Docker)
make ci            # install + typecheck + lint + test (mirrors CI)
```

| Suite          | Count | Tooling                                  |
| -------------- | ----- | ---------------------------------------- |
| Unit (API)     | 17    | Vitest                                   |
| Integration    | 21    | Vitest + supertest + real MySQL          |
| Frontend       | 3     | Vitest + Testing Library                 |
| **Total**      | **41**|                                          |

Integration tests cover the **auth lifecycle** (register, login, /me, refresh, logout, edge cases), the **checkout happy path** (register → add to cart → place order → see in history), and **edge cases** (declined card, empty cart, idempotency replay returns the original order, atomic stock decrement). They run against a separate `ecommerce_test` database that's schema-pushed before the suite and truncated between tests.

---

## Trade-offs we made

Every choice has a downside. Here are the conscious ones.

1. **Modular monolith over microservices.** Faster to ship and operate at this scale. Down side: a single deploy unit. If domains ever grow independent SLAs or traffic shapes, the seam between modules is already clean enough to split.
2. **Prisma over raw SQL / Kysely.** Generated types and migrations are huge wins. Down side: Prisma's MySQL transactions have ergonomic limits and the query planner is opaque. Acceptable for current load.
3. **JWT access + opaque refresh, not session cookies.** Stateless, scales out easily, no central session store. Down side: revocation is harder than session-bust. We mitigate with refresh-token families and short access TTLs.
4. **Mock payment provider with a real interface.** Lets the assignment be self-contained while keeping the swap to Stripe to a single class. Down side: no real PCI surface area is exercised.
5. **No CSRF token middleware.** `SameSite=Lax` covers the common CSRF surface; bearer token on cross-site calls covers the rest. Down side: if the cookie strategy ever changes to `SameSite=None`, we'll need an explicit CSRF token.
6. **Cursor pagination, not offset.** Stable under concurrent writes. Down side: no "jump to page N" — only forward iteration. Acceptable for catalog/order listings.
7. **Memory rate-limit store.** Simple, zero infra. Down side: doesn't share state across instances. When we scale the API horizontally, swap to a Redis store (the env var `RATE_LIMIT_STORE` exists for this).
8. **Pino over Winston.** Faster, simpler, structured-first. Down side: smaller plugin ecosystem; we'd need to write our own transport if we adopted an unusual sink.
9. **tsup bundle for the API.** Resolves workspace imports and path aliases at build time → no runtime path-alias hacks, smaller image. Down side: source maps point into the bundle, not the original tree; we ship sourcemaps anyway.
10. **Single Express monolith app.** Could be split into `/api` and an admin app; we deferred.

---

## Path to production

What's deliberately **not** yet done, with the next step:

| Gap                                | What "done" looks like                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------- |
| Real payment provider              | `StripeProvider implements PaymentProvider` + webhook handler for async events  |
| Email service                      | `MailProvider` interface + Resend/SES; verification email on register; password-reset flow |
| Distributed rate limit             | Redis store via `express-rate-limit` adapter; controlled by `RATE_LIMIT_STORE`  |
| Observability exporters            | OpenTelemetry SDK + OTLP exporter; Prometheus `/metrics`; Sentry for errors      |
| Image hosting                      | Move from external Unsplash URLs to a CDN with signed uploads                   |
| Inventory reservation              | Hold-then-charge instead of charge-then-decrement (matters at higher concurrency) |
| Database backups                   | `mysqldump`-on-cron or RDS-equivalent automated snapshots                       |
| SLOs + alerts                      | Latency, error-rate, and saturation alerts per route                            |
| Authn 2FA                          | TOTP enrollment + verification on login                                         |
| Audit log of sensitive actions     | Persist a structured event for login, password change, role change             |
| Web build per environment          | Multi-stage Vite build that injects `VITE_API_BASE_URL` from the deploy env     |
| Production-grade deploy            | Container image scanning, signed images, K8s manifests / ECS task definitions    |
| Load testing                       | k6 baseline at 95th-percentile target; tune Prisma connection pool             |

Each of these is achievable in <1 sprint with the current architecture — the seams are already in place.

---

## AI collaboration

This project was generated, hardened, and documented in deliberate collaboration with a large language model (Claude). The collaboration is itself part of the deliverable, so we document it openly.

### What the AI generated

- The entire AI Blueprint under `ai/` (guidelines + capabilities + `initial.md`).
- The first cut of every TypeScript file under `apps/` and `packages/`.
- The Dockerfiles, docker-compose files, Makefile, and CI workflow.
- The OpenAPI generator and the Postman collection.
- The unit and integration tests.

### What the AI did NOT do alone (humans intervened)

| Category                                      | Why human intervention was needed                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Running `prisma migrate dev`                  | Interactive command, requires a live DB; can't run inside the model's sandbox                    |
| Generating JWT secrets                        | The model must never emit real secrets — humans run `openssl rand -base64 32`                    |
| The Prisma shadow-database privilege puzzle   | First-time-Prisma users hit this; the model proposed several wrong fixes before we picked the right one |
| Real payment / email / object-storage configs | Out-of-scope without real provider credentials                                                    |
| Catching the `.strict()` bug on `process.env` | A bug the model wrote and humans caught at runtime — fix now documented in `ai/guidelines/08-code-style.md` |
| The `Server-Timing` header bug                | Header set after response finished → integration tests caught it before merge                      |
| Picking the model per stage                   | Opus for load-bearing work (blueprint, schema), Sonnet for leaf work (single tests, single primitives) |

### How prompts were structured

1. **Decision-first.** Before any code, the model asked the human to lock down 4 decisions (path, language, scope, auth strategy) via a multi-question prompt. This eliminated ambiguity for everything downstream.
2. **Plan-first.** For non-trivial work, the model emitted a numbered plan and waited for approval before executing.
3. **Atomic commits.** Each step landed as one Conventional Commit with a clear message — the git log reads like the table of contents of this README.
4. **Self-test against a checklist.** `ai/initial.md` ends with a deliverables checklist; the model verified its own output against it before declaring "done."
5. **Verify, then trust.** Every generated batch was followed by an explicit verification: `pnpm test`, `docker build`, `curl /healthz`. Two real bugs were caught this way (`.strict()` on env, and the `Server-Timing` header bug).

The full prompt log lives in `ai/interactions/prompts.md`. Model selection lives in `ai/interactions/models.md`. Tooling in `ai/interactions/tools.md`.

### How the output was manually verified

- **Type-check across the monorepo** (`pnpm typecheck`) after every batch of changes.
- **Run the unit tests** after every backend change.
- **Run the integration tests** after every change that touches a controller or service — they exercise the full HTTP path.
- **Build the Docker images** after any change to deps, build config, or Prisma schema.
- **Smoke-test the running app** in a browser: registered a new user, browsed, added to cart, checked out with a test card, viewed the order under Account → Orders.

A change is only considered done when *all four* of these pass.

---

## Operational runbook

### "The API doesn't start"

1. `make ps` — is the MySQL container healthy?
2. Look at `apps/api/.env` — are `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` set and at least 32 bytes each?
3. `make logs` — pino logs every fatal env validation error on startup.

### "Tests pass locally, fail in CI"

- CI runs against a fresh MySQL service container — every test must seed its own data. If a test relies on `make seed` running, that's a bug.
- CI sets `NODE_ENV=test`, which disables rate limiting. If a test relies on rate-limit headers, gate it on `NODE_ENV !== 'test'`.

### "Docker build is slow"

- The first build downloads pnpm + Node base layers. Subsequent builds reuse them via BuildKit cache.
- Local cache is at `~/.docker/buildx/`. CI uses GHA cache (`cache-from: type=gha`).

### "I changed the Prisma schema"

```
pnpm --filter @app/api db:migrate    # creates + applies a new migration
pnpm --filter @app/api db:generate   # regenerates the client (auto-runs in migrate)
```

### "I need to reset everything"

```
make nuke   # drops DB volumes
make up     # rebuild + start fresh
```

---

## Conventional commits + branching

See `CONTRIBUTING.md` for the full rules. Short version:

- `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, `ci`, `build`, `perf`.
- Branches: `feat/<slug>`, `fix/<slug>`.
- PRs squash-merge to `main`.
- Each commit should leave the repo buildable. Each PR should pass CI.

---

## License

MIT.
