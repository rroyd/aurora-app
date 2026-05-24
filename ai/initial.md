# initial.md — Bootstrap Prompt

> Paste this entire file as the first prompt to the AI. It references the rest of `ai/`.
> The AI must follow every guideline and capability document before generating any code.

---

## Role

You are a senior full-stack engineer generating a **production-grade eCommerce platform** end-to-end. You are not free-styling: every output must comply with the binding rules under `ai/guidelines/` and use the building blocks defined under `ai/capabilities/`.

## Goal

Generate a monorepo named `ai-blueprint-ecommerce` containing:

1. **Backend** (`apps/api`) — Node.js + Express + TypeScript + Prisma + MySQL.
2. **Frontend** (`apps/web`) — React + TypeScript + Vite + Tailwind + Framer Motion.
3. **Shared types** (`packages/shared`) — Zod schemas consumed by both.
4. **Docker Compose** — local MySQL.
5. **Tests** — Vitest, with a working sample for one service and one component.
6. **Seed data** — categories + ~40 products + 2 demo users.

The result MUST `pnpm setup` cleanly and run with `pnpm dev`.

## Non-Negotiable Inputs

Before emitting any code, **read in order**:

1. `ai/guidelines/01-engineering-standards.md`
2. `ai/guidelines/02-architecture.md`
3. `ai/guidelines/03-folder-structure.md`
4. `ai/guidelines/04-naming-conventions.md`
5. `ai/guidelines/05-error-handling.md`
6. `ai/guidelines/06-testing.md`
7. `ai/guidelines/07-security.md`
8. `ai/guidelines/08-code-style.md`
9. `ai/capabilities/auth.md`
10. `ai/capabilities/database.md`
11. `ai/capabilities/api-layer.md`
12. `ai/capabilities/ui-components.md`
13. `ai/capabilities/state-management.md`
14. `ai/capabilities/payments.md`

If anything in your output contradicts one of these, the output is invalid. Halt and ask before deviating.

## Feature Spec

### Authentication
- Sign-up (email, password, firstName, lastName) — Argon2id, returns session, sets cookies.
- Login — returns session, sets cookies.
- Logout — revokes refresh token, clears cookies.
- Refresh — rotates token pair.
- `GET /auth/me` — current user.

### Product Catalog
- Listing with search (`q`), filters (`category`, `minPrice`, `maxPrice`), sort (`price-asc`, `price-desc`, `popular`, `newest`), and cursor pagination (`limit=20`).
- Product detail page (`/products/:slug`).
- Categories endpoint for the filter UI.

### Cart
- Server cart for authenticated users (one cart per user).
- Guest cart in `localStorage` for anonymous users.
- Merge guest → server on login.
- Operations: add, increment, decrement, remove, clear.

### Checkout (multi-step)
- Step 1 — Shipping address (use saved address or enter new).
- Step 2 — Payment (mock card form; the test card `4242…` succeeds).
- Step 3 — Review & place order.
- On success: clear cart, redirect to confirmation page.
- Backend: single transaction, idempotent via `Idempotency-Key` header.

### Account
- Profile read/update (name, password change).
- Address book (list, add, set default, remove).
- Order history (cursor-paginated) and order detail.

## Deliverables Checklist

- [ ] Repo skeleton matches `ai/guidelines/03-folder-structure.md`.
- [ ] All env vars validated at startup via Zod (`apps/api/src/config/env.ts`, `apps/web/src/lib/config.ts`).
- [ ] Prisma schema matches `ai/capabilities/database.md`.
- [ ] `seed.ts` produces demo data.
- [ ] All endpoints behind `/v1`.
- [ ] Uniform error response shape from `ai/guidelines/05-error-handling.md`.
- [ ] Auth follows `ai/capabilities/auth.md` (rotation + family revocation).
- [ ] Rate limits on auth + global.
- [ ] Tailwind theme with brand tokens (`ai/capabilities/ui-components.md`).
- [ ] Framer Motion page transitions + product card hover.
- [ ] Cart drawer with add-to-cart bounce.
- [ ] Multi-step checkout with progress indicator.
- [ ] `README.md` with run instructions and a "Manual Interventions" section.
- [ ] At least one unit test (cart totals) and one component test (`ProductCard`).
- [ ] No `any`. No `dangerouslySetInnerHTML`. No `console.log` left in code.

## Output Protocol

1. **Plan first.** Produce a numbered build plan (1–N) covering: skeleton, Prisma schema, env validation, auth module, products module, cart module, orders module, users module, frontend scaffolding, UI primitives, pages, polish, tests, seed, docs.
2. **Execute step-by-step.** For each step:
   - State the step number and title.
   - Emit the full set of files for that step (no `// ...` placeholders).
   - Stop and wait if a decision is needed (rare).
3. **No "for brevity" omissions.** If a file would normally be hundreds of lines, emit hundreds of lines.
4. **Self-review at the end** against the deliverables checklist. List any items left undone with a one-line reason.

## Style Reminders (high-leverage)

- **No comments restating what the code does.** Names should explain. Comment only the non-obvious *why*.
- **No `try/catch` in controllers.** Let errors propagate to the error middleware.
- **Never import Prisma inside controllers.** Go through the repository.
- **Currency is in cents (`Int`).** Never floats.
- **Frontend forms** use `react-hook-form` + `zodResolver` with schemas from `@shared`.
- **All money displays** go through `formatMoney(cents, currency)` in `lib/format.ts`.

## Definition of Done

`pnpm setup` then `pnpm dev` produces:

- API on `:4000` responding to `GET /v1/healthz`.
- Web on `:5173` rendering the home page with seeded products.
- A new user can sign up, browse, add to cart, checkout with `4242 4242 4242 4242`, and see the order in their account.

If any of these is not true, you have not finished. Continue.
