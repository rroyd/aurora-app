# Aurora — AI-Blueprint eCommerce

A production-grade eCommerce monorepo generated from an **AI Blueprint** (`ai/initial.md` + guidelines + capabilities). The blueprint is the "engine"; the code in `apps/` is the output that engine produced.

---

## What's inside

```
ai-blueprint-ecommerce/
├── ai/                    # ← The Engine (Blueprint, Guidelines, Capabilities)
│   ├── initial.md
│   ├── guidelines/
│   ├── capabilities/
│   └── interactions/      # prompts, models, tools
├── apps/
│   ├── api/               # Node + Express + TypeScript + Prisma + MySQL
│   └── web/               # React + TypeScript + Vite + Tailwind + Framer Motion
├── packages/
│   └── shared/            # Zod schemas + inferred types shared by FE/BE
├── docker-compose.yml     # Local MySQL
└── README.md              # ← you are here
```

---

## Quick start

### 1. Prerequisites

- Node.js ≥ 20.11
- pnpm 9 (`npm i -g pnpm`)
- Docker Desktop (for local MySQL)

### 2. Install

```bash
pnpm install
```

### 3. Configure env

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Generate secrets (replace JWT_* in apps/api/.env)
openssl rand -base64 32
openssl rand -base64 32
```

### 4. Bring up the database

```bash
pnpm db:up           # starts MySQL on :3306 via docker compose
pnpm db:migrate      # applies Prisma migrations
pnpm db:seed         # categories + ~40 products + 2 demo users
```

### 5. Run dev servers

```bash
pnpm dev             # api → :4000, web → :5173
```

Open <http://localhost:5173>.

**Demo credentials**

| Role     | Email             | Password       |
| -------- | ----------------- | -------------- |
| Customer | demo@shop.dev     | Password123!   |
| Admin    | admin@shop.dev    | Password123!   |

**Test cards (mock provider)**

| Outcome    | Number                  |
| ---------- | ----------------------- |
| Success    | 4242 4242 4242 4242     |
| Declined   | 4000 0000 0000 0002     |
| Expired    | Any card with past year |

---

## How the AI Blueprint works

The directory `ai/` is the **engine** of this project. Running the blueprint against an LLM produces the contents of `apps/` and `packages/`.

1. **`ai/initial.md`** is the bootstrap prompt — paste it first.
2. The model reads it, which forces it to read every file under `ai/guidelines/` and `ai/capabilities/` *before emitting any code*.
3. The model then emits a numbered build plan and walks through it, producing files that conform to the guidelines.
4. Once code is generated, `pnpm setup && pnpm dev` brings the app online.

The blueprint encodes:

- **8 binding guidelines** (engineering standards, architecture, folder structure, naming, error handling, testing, security, code style).
- **6 capability docs** describing reusable building blocks (auth, database, API layer, UI composition, state management, payments).
- **A self-test checklist** the model must run against its own output before declaring "done."

---

## Manual Interventions

This section documents every place where AI generation was insufficient and human intervention was required, with the *why*.

> Even with a strong blueprint, certain classes of work are faster or safer for a human to do. Identifying them is part of the assignment ("AI-Gap" analysis).

### 1. Prisma migration generation (cannot be automated by the LLM)

- **Why**: `prisma migrate dev` needs an interactive shell connected to MySQL. The LLM cannot run it in this sandbox.
- **Fix**: After `pnpm install` and `pnpm db:up`, run `pnpm db:migrate`. The blueprint references this in `README.md` so a human or CI runs it.
- **Lesson**: Keep schema-as-code in the blueprint; let humans/CI apply.

### 2. Secrets generation

- **Why**: The model should never emit real secrets. `.env.example` contains placeholders only.
- **Fix**: README instructs `openssl rand -base64 32` for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.

### 3. Real payment integration

- **Why**: The assignment did not include payment provider credentials. Inventing a Stripe integration without a sandbox account produces dead code.
- **Fix**: The blueprint defines a `PaymentProvider` *interface* and a `MockPaymentProvider`. Swapping in Stripe is documented in `ai/capabilities/payments.md` and is a one-day change.

### 4. Image hosting

- **Why**: The model can't host images. Seed data references public Unsplash URLs. In production these would be moved to a CDN.
- **Fix**: Seed URLs are intentionally external and easy to replace.

### 5. Production deployment manifests

- **Why**: K8s manifests / Terraform are environment-specific (cluster name, ingress, secrets manager). Generating generic ones rots fast.
- **Fix**: Out of scope for the blueprint. The app is container-ready (`apps/api` runs from `node dist/server.js`; `apps/web` builds to static assets).

### 6. Email service

- **Why**: Account flows (verification email, password reset) need an email provider (Resend/SES). Pending a provider decision, the blueprint stops at password change.
- **Fix**: A `MailProvider` interface is the natural extension point — analogous to `PaymentProvider`.

### 7. Env-schema strictness bug (caught at runtime)

- **Symptom**: `pnpm dev` showed Vite at :5173 but the API never bound :4000. No error visible — the env validator did `process.exit(1)` silently.
- **Root cause**: `apps/api/src/config/env.ts` used `z.object({...}).strict()` and then parsed `process.env`. On macOS, `process.env` contains many OS-level keys (`PATH`, `HOME`, `SHELL`, …) that aren't in the schema, so strict mode rejected the parse.
- **Fix**: removed `.strict()`. Zod's default behavior passes unknown keys through (they're absent from the typed output), which is the correct semantics for env parsing.
- **Lesson for the blueprint**: `08-code-style.md` should add a rule: "never use `.strict()` on a schema parsed against `process.env`." The AI applied `.strict()` uniformly because the guideline encouraged it for HTTP inputs — but env is a different boundary with implicit OS keys.

### 8. Prisma shadow database needs explicit setup

- **Symptom**: `pnpm db:migrate` failed with `P1017: Server has closed the connection`, then `P1003: Database ecommerce_shadow does not exist`.
- **Root cause**: The official MySQL Docker image grants `MYSQL_USER` privileges only on `MYSQL_DATABASE`. Prisma `migrate dev` needs to create a temporary shadow database, which requires `CREATE DATABASE` privileges the `app` user doesn't have.
- **Fix**: Added `shadowDatabaseUrl = env("SHADOW_DATABASE_URL")` to `schema.prisma`, pointed it at `mysql://root:rootpw@localhost:3306/ecommerce_shadow`, and pre-created that database. Documented in `.env.example`.

---

## Architecture (overview)

```
┌────────────┐   HTTPS/JSON   ┌─────────────┐   SQL   ┌──────────┐
│  apps/web  │ ──────────────▶│  apps/api   │────────▶│  MySQL   │
│  React 18  │ ◀──────────────│  Express    │◀────────│   8.0    │
└────────────┘                └─────────────┘         └──────────┘
       └──── @shared types (Zod) ─────┘
```

- **API**: modular monolith. Each domain (`auth`, `products`, `cart`, `orders`, `users`) is a self-contained module with `routes → controller → service → repository → Prisma`.
- **Frontend**: feature-sliced. `features/<domain>/{api,components,hooks}`, generic `components/ui`, layout in `components/layout`, pages in `pages/`.
- **Shared**: `@shared/contracts` exposes Zod schemas. Both sides import them so the wire contract has a single source of truth.

Full details: `ai/guidelines/02-architecture.md`.

---

## Scripts

| Command                   | What it does                                |
| ------------------------- | ------------------------------------------- |
| `pnpm install`            | Install all workspace dependencies          |
| `pnpm db:up` / `db:down`  | Start / stop MySQL container                |
| `pnpm db:migrate`         | Apply Prisma migrations                     |
| `pnpm db:seed`            | Seed categories, products, demo users       |
| `pnpm dev`                | Run API + web in dev mode (parallel)        |
| `pnpm build`              | Build both apps                             |
| `pnpm test`               | Run all Vitest suites                       |
| `pnpm typecheck`          | TS typecheck across the monorepo            |
| `pnpm setup`              | All of: install + db:up + migrate + seed    |

---

## Definition of Done

Per `ai/initial.md`, the build is "done" when:

- [x] `pnpm setup && pnpm dev` runs both servers.
- [x] `GET /v1/healthz` → 200.
- [x] Home page renders seeded products.
- [x] A new user can sign up, browse, add to cart, check out with `4242...`, and see the order under Account → Orders.
- [x] All endpoints prefixed with `/v1`.
- [x] Uniform error response shape across endpoints.
- [x] Auth uses Argon2id + JWT (access) + opaque refresh with family-revocation.
- [x] Rate limits on auth and global.
- [x] No `any`, no `dangerouslySetInnerHTML`.
- [x] At least one unit test (cart totals) and one component test (`ProductCard`).
