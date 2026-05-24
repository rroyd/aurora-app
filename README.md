# Aurora — eCommerce Platform

A production-grade full-stack TypeScript eCommerce monorepo (React 18 + Vite on the web, Express + Prisma + MySQL on the API, shared Zod contracts) generated from an AI Blueprint (`ai/`) and hardened by hand.

This file is **component 3** of the submission: documentation of every manual intervention the AI could not handle on its own, and exactly why.

## Submission layout

The repository is organized around the four required deliverables:

| # | Component | Where to find it |
|---|---|---|
| 1 | **Resulted Code** — the final, working codebase | `apps/api/`, `apps/web/`, `packages/shared/`, `prisma/`, `docker-compose*.yml`, `Makefile` |
| 2 | **AI Boilerplate** — `initial.md` + all AI guideline files | [`initial.md`](./initial.md) (root, top-level index) and [`ai/`](./ai/) (`ai/initial.md`, `ai/guidelines/*.md`, `ai/capabilities/*.md`) |
| 3 | **README.md** — manual interventions | this file (below) |
| 4 | **AI interactions Documentation** — prompts, searches, models, tools | [`AI_INTERACTIONS.md`](./AI_INTERACTIONS.md) (consolidated root index) and [`ai/interactions/`](./ai/interactions/) (per-topic detail) |

Full engineering documentation (architecture, quickstart, design patterns, testing, runbook, path to production) lives in [`ENGINEERING.md`](./ENGINEERING.md). This README intentionally limits itself to the assignment-required content.

---

## Quickstart (one-liner)

```bash
pnpm install && cp apps/api/.env.example apps/api/.env && cp apps/web/.env.example apps/web/.env
# generate JWT_ACCESS_SECRET and JWT_REFRESH_SECRET with `openssl rand -base64 32` and paste them in
make db-up && make migrate && make seed && make dev
# web → http://localhost:5173, api → http://localhost:4000
```

Demo credentials: `demo@shop.dev` / `Password123!`. Test card: `4242 4242 4242 4242`. See [`ENGINEERING.md`](./ENGINEERING.md#quickstart) for full quickstart, Docker option, make targets, and the operational runbook.

---

## Manual interventions

This is the assignment-required content: every step where the AI failed (or could not, by design) handle the work, what we did by hand, and **why** the AI did not handle it.

The table is ordered roughly chronologically — from blueprint authoring through to the last bug fix.

### 1. Generating real JWT secrets

**What we did by hand.** Ran `openssl rand -base64 32` twice and pasted the outputs into `apps/api/.env` as `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.

**Why the AI did not handle it.** A guardrail, not a capability gap. The model is prohibited from emitting real secret material into source files or env templates. The `.env.example` files committed by the AI contain placeholders (`change-me-...`), with the README telling the human to generate real values. This is the correct posture for any production-bound repo.

### 2. Running `prisma migrate dev`

**What we did by hand.** Ran `pnpm --filter @app/api db:migrate` and named the initial migration. Re-ran it when the schema changed.

**Why the AI did not handle it.** `prisma migrate dev` is interactive (it prompts for a migration name and asks for confirmation if it detects drift) and requires a live MySQL connection on the host. The model's sandbox has neither a TTY for interactive prompts nor outbound network access to a real database. We exposed this as a `make migrate` target so reruns are scripted.

### 3. Prisma shadow-database privilege puzzle

**What we did by hand.** Granted the dev MySQL user `CREATE`/`DROP` on a separate `<db>_shadow` database, then set `shadowDatabaseUrl` in `prisma/schema.prisma`. We resolved this by reading Prisma's diagnostic output, not by following any of the AI's first two suggestions (which proposed switching to SQLite, then to `db push --skip-generate`).

**Why the AI did not handle it.** This is a class of problem where the AI cannot observe the runtime error directly. It produced plausible-sounding fixes from training data ("just use SQLite for dev") that conflicted with our MySQL-only constraint. Once the human pasted the specific error text into the prompt, the model proposed the correct fix on the next turn. **Lesson:** when the AI's suggestion drifts from the project's known constraints, paste the actual error verbatim rather than paraphrasing.

### 4. Host-OS MySQL port collision on `make db-up`

**What we did by hand.** The Docker `mysql` service failed to bind to `:3306` because a host-installed MySQL service (Homebrew) was already listening on that port. A Google search ("how to stop local mysql service on macOS") surfaced `brew services stop mysql`. After stopping the host service, `make db-up` succeeded.

**Why the AI did not handle it.** Two reasons: (1) the model cannot run `brew` / `systemctl` / `launchctl` commands on the developer's machine — those are out-of-sandbox. (2) The symptom (`docker: Error response from daemon: ports are not available: ... 0.0.0.0:3306`) was visible only on the human's terminal. We fed the error back into the next prompt and the AI proposed the same `brew services stop` resolution, but by then the human had already fixed it via Google. The fix is now documented in `ENGINEERING.md` → "Operational runbook" and in `ai/interactions/tools.md`.

### 5. The `.strict()` bug on `process.env` parsing

**What we did by hand.** Removed `.strict()` from the Zod schema that validates `process.env` in `apps/api/src/config/env.ts`. Documented the rule in `ai/guidelines/08-code-style.md` so future generations don't repeat it.

**Why the AI did not handle it.** The model wrote `z.object({ ... }).strict().parse(process.env)`. That looked correct in isolation. At runtime it threw because `process.env` always contains keys the schema didn't declare (`PATH`, `HOME`, every CI variable, ...) and `.strict()` rejects unknown keys. The AI's failure mode here is the classic one: it generated a pattern that is correct for *parsed JSON request bodies* and applied it to the wrong input shape. Caught by humans on first `pnpm dev` boot, fixed in one edit.

### 6. The `Server-Timing` header bug

**What we did by hand.** Moved `res.setHeader('Server-Timing', ...)` into the `'finish'` event handler so the header is set before the body is flushed, not after.

**Why the AI did not handle it.** The model's first version called `res.setHeader` inside an `on('finish', ...)` callback that ran *after* headers were already sent — Node logged the warning `Cannot set headers after they are sent`, the integration test failed with `expect(res.headers['server-timing']).toBeDefined()`, and the diagnosis required reading both the warning and the test failure together. The AI fixed it correctly once we pasted the test failure back in.

### 7. Cart drawer leaves UI uninteractive after deleting a product

**What we did by hand.** Edited two files (`apps/web/src/components/ui/Sheet.tsx`, `apps/web/src/features/cart/CartDrawer.tsx`):

- In `Sheet.tsx`: added a stable `key="sheet-portal"` to `Dialog.Portal` so `AnimatePresence` reliably tracks its identity; replaced the spring exit transition on `motion.aside` with a deterministic duration-based easing (`{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }`) so AnimatePresence's exit-complete detection cannot stall.
- In `CartDrawer.tsx`: replaced `motion.li` with a plain `<li>` and removed the `layout` prop. Those motion props had no observable effect (there was no surrounding `AnimatePresence`), but the `layout` animation triggered on item removal was interfering with the parent's exit animation.

**Why the AI did not handle it.** Two distinct failures:

1. **The AI wrote the buggy pattern in the first place.** It composed `Radix Dialog + forceMount on Portal/Overlay/Content + AnimatePresence wrapping a conditional render + spring exit transition + nested `motion.li` with `layout``. Each piece is individually a documented pattern; the combination interacts badly. Specifically: with `forceMount` on `Dialog.Content`, Radix keeps `RemoveScroll` mounted, which keeps `pointer-events: none` on the body. That lock is only released when `AnimatePresence` unmounts the dialog, which only happens after exit animations resolve. The spring exit + the interfering layout animation occasionally never resolved → body stayed locked → page stayed uninteractive.
2. **Automated tests did not catch it.** The repo's tests cover the API and the components in isolation, but not the cross-cutting interaction between Radix's body lock, framer-motion's exit detection, and a real browser event loop. A live human smoke-test was the only way to surface it.

The AI was perfectly capable of identifying and fixing the bug once a human reported the symptom in a follow-up Claude Code session (`claude --resume 4b24d4bd-9bce-4c81-a17e-76371c1d6d18`). It cannot, today, be relied on to anticipate combinatorial UI bugs across third-party libraries without an explicit live reproduction.

### 8. Picking the right model per stage

**What we did by hand.** Chose Claude Opus 4.7 for "load-bearing" work (the AI Blueprint files, schema design, multi-file backend modules, documentation) and Claude Sonnet 4.6 for "leaf" work (single primitives, single tests, mechanical edits). Used Google Gemini as an out-of-band brainstorm partner only — Gemini outputs never landed in this repo as code.

**Why the AI did not handle it.** A meta-decision; the AI does not (and should not) self-promote/demote between model tiers mid-conversation. The human picks the model based on the cost-vs-quality trade-off for each step. See [`AI_INTERACTIONS.md`](./AI_INTERACTIONS.md#models) for the full per-stage table.

### 9. Real payment / email / object-storage configurations

**What we did by hand.** Nothing — we deliberately stopped at a `MockPaymentProvider` that implements the same `PaymentProvider` interface a real Stripe adapter would.

**Why the AI did not handle it.** Out-of-scope without real provider credentials. The repo is structured so that swapping `MockPaymentProvider` for a `StripeProvider` is a single class. The path-to-production table in `ENGINEERING.md` lists every remaining swap and how to do it.

### 10. Choosing seed product images

**What we did by hand.** Picked Unsplash URLs by hand and verified the licenses allowed embedding.

**Why the AI did not handle it.** The model can suggest URLs but cannot verify they resolve to a live image, that the license permits commercial reuse, or that the image content matches the product name. A human did the verification pass before seeding.

---

## How we caught these failures

A change is only considered done when **all four** of these pass:

1. `pnpm typecheck` across the monorepo (catches type-level drift introduced by AI edits).
2. `pnpm test` (unit) — fast, no DB. Caught the `.strict()` bug.
3. `pnpm test:int` (integration) — full HTTP path against a real MySQL. Caught the `Server-Timing` header bug.
4. Live smoke-test in a browser: register a new user, browse, add to cart, check out with the test card, view the order under Account → Orders. Caught the cart-drawer bug.

The first three are automated and run in CI. The fourth is the human's responsibility on every PR. Cart-drawer-class bugs are the reason it stays manual.

---

## What is in each of the other components

- **[`initial.md`](./initial.md)** is the top-level AI Boilerplate index. It points at `ai/initial.md` (the actual bootstrap prompt fed into Claude) and lists every guideline and capability file that constrains the AI's output.
- **[`ai/`](./ai/)** holds the binding rules: `ai/initial.md`, `ai/guidelines/01..08-*.md`, `ai/capabilities/*.md`. Any AI-generated file that contradicts these is invalid and gets reverted.
- **[`AI_INTERACTIONS.md`](./AI_INTERACTIONS.md)** is the consolidated prompt / query / search / model / tool log for the entire project. The per-topic detail files live under `ai/interactions/`.
- **[`ENGINEERING.md`](./ENGINEERING.md)** is the full engineering documentation (architecture, design patterns, security, testing, trade-offs, path to production, operational runbook) — useful for reading or extending the code but not part of the assignment-required README content.

---

## License

MIT.
