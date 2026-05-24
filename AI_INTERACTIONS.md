# AI Interactions Documentation

This is **component 4** of the submission: every prompt, search query, planning inquiry, model selection, plugin, and tool used to produce this project. It is intentionally exhaustive so the workflow is reproducible and auditable.

This file is the consolidated root index. The same content is split across three per-topic files for navigation:

- [`ai/interactions/prompts.md`](./ai/interactions/prompts.md) — full prompt and query log
- [`ai/interactions/models.md`](./ai/interactions/models.md) — per-stage model selection
- [`ai/interactions/tools.md`](./ai/interactions/tools.md) — tooling, plugins, libraries

---

## Table of contents

1. [Up-front clarifying questions (decision lock-down)](#1-up-front-clarifying-questions-decision-lock-down)
2. [Blueprint authoring (the `ai/` folder)](#2-blueprint-authoring-the-ai-folder)
3. [Architecture inquiries](#3-architecture-inquiries)
4. [Code-generation prompts](#4-code-generation-prompts)
5. [Searches consulted](#5-searches-consulted)
6. [External AI tools (Gemini)](#6-external-ai-tools-gemini)
7. [Claude Code session continuity (`--resume`)](#7-claude-code-session-continuity---resume)
8. [Models used per stage and why](#8-models-used-per-stage-and-why)
9. [Plugins, agents, tools, and libraries](#9-plugins-agents-tools-and-libraries)
10. [Sample dialogue (illustrative)](#10-sample-dialogue-illustrative)

---

## 1. Up-front clarifying questions (decision lock-down)

Before any code, the model asked the human to lock down four decisions. Each subsequent prompt assumed these answers — the model never re-asked or guessed.

| # | Decision | Locked answer |
|---|---|---|
| 1 | Project path | `~/Documents/ai-blueprint-ecommerce` |
| 2 | Language | TypeScript (strict, no `any`, no implicit `any`) |
| 3 | Scope | Full runnable monorepo (web + api + shared) |
| 4 | Auth strategy | JWT access (15 min, httpOnly cookie) + opaque refresh (30 d, sha256-hashed in DB) with family revocation |

> **Lesson:** front-loading decisions removed ambiguity from every downstream prompt. The model never had to guess scope.

---

## 2. Blueprint authoring (the `ai/` folder)

### 2a. System prompt template (for every blueprint file)

> "You are a senior full-stack engineer authoring engineering guidelines for an AI-driven monorepo. Output one Markdown file per topic. Each file MUST be self-contained, technical, opinionated, and enforceable. No vague advice."

### 2b. Per-guideline prompt template

> "Write `ai/guidelines/<file>.md`. The content must be specific enough that an LLM following it could not produce non-conformant code. Include: rule, why, example, and forbidden patterns where applicable. Cross-link to other guidelines with relative paths."

### 2c. Capabilities prompt template

> "Write `ai/capabilities/<area>.md`. Describe the interface (TypeScript), the wire format (HTTP), the cookie/header conventions, and the extension points. Include the rules an LLM must follow when using this capability."

### 2d. `ai/initial.md` (bootstrap) prompt

> "Write `ai/initial.md` — the single prompt that, when pasted into a fresh model conversation, causes it to read every guideline and capability, then generate the full eCommerce app in one numbered plan. The model must self-check against a deliverables checklist at the end."

---

## 3. Architecture inquiries

These were design conversations *before* writing the blueprint, to make sure the conventions matched modern practice.

| Question | Resolution |
|---|---|
| Modular monolith vs micro-frontends for this scope? | Modular monolith. Five domains, one team, no fan-out justification. |
| Prisma vs raw SQL (mysql2 + Kysely)? | Prisma. Type-safe migrations + auto-generated types + acceptable lock-in for this scope. |
| JWT access + JWT refresh, or JWT access + opaque refresh? | **Opaque refresh** (random 64-byte, sha256-hashed in DB) so refresh tokens can be revoked individually; cheaper than JWT-with-jti revocation lists. |
| How to prevent stolen-refresh-token replay? | **Family revocation**: if a revoked refresh token is presented, revoke every refresh in that family. Established pattern; see Auth0 docs. |
| Where does money live? | Integer cents (`priceCents`) everywhere. Never floats. Documented in `ai/guidelines/04-naming-conventions.md`. |
| Cart strategy for guest + logged-in? | Guest cart in localStorage via Zustand `persist`; server cart in DB; merge-on-login via `POST /v1/cart/merge`. |
| Stock decrement isolation? | `prisma.$transaction(..., { isolationLevel: 'Serializable' })` around validate → decrement → create-order → clear-cart. |

---

## 4. Code-generation prompts

### Plan-emit prompt

> "Read `ai/initial.md` and produce the numbered build plan only. Do not emit any code yet."

### Step-execute prompt

> "Execute step N of the plan. Emit every file in full — no `// ...` ellipses. Reference the relevant guideline/capability paths in your inline reasoning. Stop after the step."

### Per-module prompts

For each backend module:

> "Generate `apps/api/src/modules/<domain>/{repository,service,routes,schemas}.ts`. Follow `ai/guidelines/02-architecture.md` strictly — controllers thin, services pure, repositories the only Prisma users."

For each frontend feature:

> "Generate `apps/web/src/features/<domain>/{api.ts,components/...,hooks/...}`. Use TanStack Query for server state, Zustand for cross-component UI state, react-hook-form + zodResolver for forms. Schemas come from `@shared/contracts`."

### Test-generation prompt (Vitest + supertest)

> "For each route in `apps/api/src/modules/<domain>/<domain>.routes.ts`, write supertest integration tests that exercise the full HTTP path against a real MySQL test DB. Cover the happy path, validation rejection, auth rejection, and one edge case per route. Tests must truncate tables between cases."

### Bug-fix prompt (used for the cart-drawer fix in the follow-up session)

> "User reports: open cart → delete a product → close cart → UI is uninteractive. Diagnose the root cause, then fix with the minimum diff. Verify with `pnpm typecheck`."

### E2E flow-test prompt (Playwright, follow-up session)

> "Build an E2E test for the full purchase flow: register → get a product → add to cart → checkout → create order."

Decisions locked down before any code was emitted (via clarifying questions):

| Decision | Locked answer |
|---|---|
| Test type | Browser E2E with Playwright (rejected: API-only supertest, since the project already has `apps/api/tests/integration/checkout.test.ts` covering the contract layer) |
| Backend wiring | Real API + real MySQL (rejected: mocked network, dedicated test DB) so the test exercises Express + Prisma + the mock payment provider, not stubs |
| Browser scope | Chromium only (skipped Firefox/WebKit) to keep install ~92 MB instead of ~400 MB |
| Worker count | 1 (single test, shares one dev API + one dev web), `reuseExistingServer: !CI` so local runs piggyback on whatever `pnpm dev` is already running |
| Test data | Hit the seeded slug `nimbus-laptop-stand` directly rather than scraping the home page — survives sort/filter changes |
| Isolation | Fresh email per run (timestamp + random suffix), no DB cleanup — orders accumulate harmlessly in the seeded DB |

Deliverables emitted: `apps/web/playwright.config.ts` (with `webServer` blocks that boot the API at `:4000` and web at `:5173`), `apps/web/e2e/full-flow.spec.ts` (one `test()` split into seven labelled `test.step(...)` blocks for readable traces), `apps/web/e2e/tsconfig.json` (so `tsc` in `apps/web` doesn't try to compile the specs), plus `e2e` / `e2e:ui` scripts in `apps/web/package.json` and Playwright artifact dirs added to `.gitignore`.

> **Lesson:** the integration test in `apps/api/tests/` proves the HTTP contract; the Playwright spec proves the *UI wiring* — they catch different regressions (e.g., the cart-drawer Sheet/Dialog bug from the previous session would have been caught by the E2E but not by supertest).

---

## 5. Searches consulted

### Library / framework docs (read directly, not via search)

- **Anthropic docs** — prompt caching, structured outputs, multi-turn tool use patterns.
- **Prisma docs** — `findMany` with `cursor`, transaction isolation levels, JSON column.
- **TanStack Query docs** — `useInfiniteQuery` API and stable key conventions.
- **Radix UI docs** — Dialog / DropdownMenu / Toast accessibility primitives.
- **Framer Motion docs** — `AnimatePresence`, `motion` variants, exit animations.

### Technical searches (web)

| Query | What we wanted to confirm |
|---|---|
| "Prisma cursor pagination with cursor+skip pattern" | `{ cursor: { id }, skip: 1 }` semantics for stable pagination |
| "Express + helmet + CORS credentials cookie SameSite" | `sameSite=lax` + `credentials: 'include'` on FE |
| "Argon2id recommended params 2026" | `m=64MB`, `t=3`, `p=1` |
| "TanStack Query v5 useInfiniteQuery initialPageParam" | v5 signature |
| "Radix Dialog with Framer Motion AnimatePresence" | `forceMount` + `asChild` pattern (the same pattern that later produced the cart-drawer bug — see README §7) |

### Google searches (operational / environment fixes)

| Query | Resolution |
|---|---|
| **"how to stop local mysql service on macOS"** | `brew services stop mysql` — needed because the host MySQL service was holding `:3306`, blocking the Docker container from binding the port. Documented in `ENGINEERING.md` → Operational runbook. |
| "Docker Desktop port already in use 3306" | Corroborated the host-MySQL diagnosis above. |

---

## 6. External AI tools (Gemini)

**Google Gemini** was used as a "second opinion" / brainstorm partner before prompting Claude. **No Gemini output landed in this repo as code.** Gemini's outputs were summarized by the human and re-phrased into prompts to Claude.

| Inquiry to Gemini | How it shaped what we asked Claude |
|---|---|
| "What should I ask Claude to focus on first when generating a full-stack TypeScript e-commerce app?" | Gemini suggested locking down auth strategy, data model, and testing approach. This shaped the four clarifying questions in §1. |
| "Suggest a clean architecture for a small-team monorepo handling auth + catalog + cart + checkout." | Gemini proposed a modular-monolith with a shared `contracts` package and a strict layering rule (`routes → controller → service → repository`). Matched Claude's later proposal — gave the human confidence the direction was conventional. Encoded into `ai/guidelines/02-architecture.md`. |
| "What pitfalls should I watch for when an LLM generates Prisma + Express code?" | Gemini listed: shadow-database setup, N+1 queries, default transaction isolation, unbounded `findMany`. These became items on the human's verification checklist for Claude's output. |

---

## 7. Claude Code session continuity (`--resume`)

This project spans multiple Claude Code sessions. Resumed sessions used `--resume <session-id>` so the model kept full prior context (not just the repo state) when continuing work.

Example — the cart-drawer fix and this documentation update were both done in a resumed session:

```bash
claude --resume 4b24d4bd-9bce-4c81-a17e-76371c1d6d18
```

**Why resume rather than start fresh.** The previous session already had the mental model of the Sheet / Dialog / AnimatePresence interaction. A cold start would have re-derived it from the code, costing time and risking a different (potentially worse) fix because the AI would have had no memory of *why* the current pattern was chosen.

---

## 8. Models used per stage and why

### Claude — the primary code-generation model

| Stage | Model | Why |
|---|---|---|
| Engineering guidelines (`ai/guidelines/`) | **Claude Opus 4.7** | Long-form structured writing benefits from the strongest reasoning model. |
| Capability docs (`ai/capabilities/`) | **Claude Opus 4.7** | These documents are the public contract the AI generates against. Errors here propagate everywhere. |
| `ai/initial.md` (bootstrap) | **Claude Opus 4.7** | High-leverage prompt; mistakes propagate everywhere. |
| Prisma schema + seed data | **Claude Opus 4.7** | Schema design is reasoning-heavy; mistakes here are expensive to roll back. |
| Backend modules (auth, products, cart, orders, users) | **Claude Opus 4.7** | Multi-file edits with cross-module consistency; benefits from larger context window. |
| Frontend pages and feature slices | **Claude Opus 4.7** | UX polish + cross-page consistency. |
| UI primitives (Button, Input, Select, Sheet, Card, …) | **Claude Sonnet 4.6** | Single-file, well-defined output — Sonnet is fast and sufficient. |
| Unit / component tests | **Claude Sonnet 4.6** | Tests are mechanical given the source files; faster model wins. |
| Documentation polish (README, ENGINEERING, this file) | **Claude Opus 4.7** | Tone, structure, and accuracy matter more than speed. |
| Cart-drawer bug fix (follow-up session) | **Claude Opus 4.7** | Cross-library interaction reasoning (Radix + framer-motion); used the resumed session so prior context was intact. |
| Full-flow E2E test (Playwright, follow-up session) | **Claude Opus 4.7** | Multi-file scaffold (config + spec + tsconfig + script wiring) plus selector choices that needed to survive future UI churn; benefits from larger context window and resumed session memory of the page structure. |

### Model-selection rules of thumb

- Use **Opus** for load-bearing work: blueprint, schema, anything that gets referenced from many other places.
- Use **Sonnet** for leaf work: a single isolated component, a single test, a single util.
- Use **Haiku** for lookup work (none in this project): trivial reformatting, simple data extraction.
- Always do **prompt caching** when interacting with the API: long system prompts (guidelines + capabilities) are cache-eligible and dramatically reduce cost on repeated calls.

### Non-Anthropic models (advisory only)

| Model | Use | Code in repo from this model? |
|---|---|---|
| **Google Gemini** | Pre-prompt brainstorming, architecture second-opinion (see §6) | **No.** Outputs filtered by the human and re-phrased as Claude prompts. |

---

## 9. Plugins, agents, tools, and libraries

### AI tooling

| Tool | Purpose |
|---|---|
| **Claude Code** (CLI) | Primary harness for generation, file ops, and reviewing diffs across multiple sessions. |
| **`claude --resume <session-id>`** | Re-entered prior sessions (`4b24d4bd-9bce-4c81-a17e-76371c1d6d18`) so the model kept its prior mental model. |
| **Anthropic SDK** | Programmatic API access for the generation loop and prompt caching. |
| **Google Gemini** (web) | Pre-prompt brainstorming and architecture second-opinion. No code landed. |
| **Google Search** | Operational fixes — primarily the host MySQL port collision (§5). |
| **Cursor** (optional) | Editor with inline AI for spot fixes during review. |

### Claude Code plugins / sub-agents

The repo ships a **5-agent feature pipeline** (commit `28ee74e`): **product-owner → architect → engineer → sdet → reviewer**. Each stage is a Claude Code subagent invoked via skills (`/feature-triage`, `/feature-design`, `/feature-build`, `/feature-test`, `/feature-review`, or the umbrella `/feature-pipeline`). Stages halt on rejection rather than guessing.

The pipeline contract and per-agent schemas live in `.aurora-pipeline/` — `feature_context.schema.json` is the strict JSON Schema every agent reads from and writes to.

Built-in Claude Code skills used during development: `/code-review`, `/verify`, `/run`, `/init`, `/security-review`, `/update-config`, `/fewer-permission-prompts`.

### Runtime libraries

#### Backend (`apps/api`)

`express`, `prisma`, `@prisma/client`, `argon2`, `jsonwebtoken`, `cookie-parser`, `cors`, `helmet`, `express-rate-limit`, `pino`, `pino-http`, `zod`, `dotenv`.

#### Frontend (`apps/web`)

`react`, `react-dom`, `react-router-dom`, `@tanstack/react-query`, `zustand`, `react-hook-form`, `@hookform/resolvers`, `tailwindcss`, `autoprefixer`, `postcss`, `framer-motion`, `lucide-react`, `@radix-ui/react-{dialog,dropdown-menu,toast,select,label}`, `class-variance-authority`, `clsx`, `tailwind-merge`.

#### Shared (`packages/shared`)

`zod` (single source of truth for FE/BE schemas).

#### Dev / test

`typescript` (strict), `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `tsx`, `supertest`, `@playwright/test` (browser E2E — Chromium-only install), `prettier`, ESLint (flat config).

---

## 10. Sample dialogue (illustrative)

The pattern below repeated across every non-trivial design decision: model proposes, human probes for failure modes, model refines, human approves, model implements.

```
USER: We need cart logic for both guest (no auth) and logged-in users, with a
      merge on login.

MODEL: Proposed design:
       - Guest cart in localStorage via Zustand `persist`.
       - Server cart in DB (1 per user).
       - On login, frontend sees auth state flip → calls
         POST /v1/cart/merge with guest items → clears local guest cart.

USER: What if the merge fails (e.g., network)?

MODEL: Keep guest cart until merge confirms success. Show toast on failure.
       Retry on next route change.

USER: ✓ Implement.
```

The same loop produced the final designs for: refresh-token rotation policy, order idempotency, stock-decrement transaction isolation, the multi-step checkout state model, and the cart-drawer bug fix.

---

## Cross-references

- `ai/initial.md` — the bootstrap prompt that kicked off the whole project.
- `ai/guidelines/*.md` — the binding rules every prompt referenced.
- `ai/capabilities/*.md` — the per-area building blocks.
- `ai/interactions/prompts.md`, `models.md`, `tools.md` — the per-topic detail files this document consolidates.
- `README.md` — manual interventions (component 3 of the submission).
- `ENGINEERING.md` — full engineering documentation.
