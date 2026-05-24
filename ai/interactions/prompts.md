# Prompts, Queries, and Planning Inquiries

A faithful log of the AI interactions that produced this project. Sensitive details (real cookies, secrets) are redacted.

## 0 — Up-front decisions (clarifying questions)

Before any code, the user was asked to lock down 4 decisions to keep the generation deterministic:

1. **Project path** → `~/Documents/ai-blueprint-ecommerce`
2. **Language** → TypeScript (strict)
3. **Scope** → Full runnable app
4. **Auth strategy** → JWT with refresh tokens

> *Lesson:* Front-loading decisions removes ambiguity later — the model never has to "guess" about scope.

## 1 — Blueprint authoring (`ai/`)

### 1a. System prompt template

> "You are a senior full-stack engineer authoring the engineering guidelines for an AI-driven monorepo. Output one Markdown file per topic. Each file MUST be self-contained, technical, opinionated, and enforceable. No vague advice."

### 1b. Per-guideline prompt template

> "Write `ai/guidelines/<file>.md`. The content must be specific enough that an LLM following it could not produce non-conformant code. Include: rule, why, example, and forbidden patterns where applicable. Cross-link to other guidelines with relative paths."

### 1c. Capabilities prompt template

> "Write `ai/capabilities/<area>.md`. Describe the interface (TypeScript), the wire format (HTTP), the cookie/header conventions, and the extension points. Include the rules an LLM must follow when using this capability."

### 1d. `initial.md` prompt

> "Write `ai/initial.md` — the single prompt that, when pasted into a fresh model conversation, causes it to read every guideline and capability, then generate the full eCommerce app in one numbered plan. The model must self-check against a deliverables checklist at the end."

## 2 — Architecture inquiries

These were design conversations *before* writing the blueprint, to make sure the conventions matched modern practice.

- *"Modular monolith vs micro-frontends for this scope?"* → Modular monolith. Five domains, one team, no fan-out justification.
- *"Prisma vs raw SQL (mysql2 + Kysely)?"* → Prisma. Type-safe migrations + auto-generated types + acceptable lock-in for this scope.
- *"JWT access + JWT refresh, or JWT access + opaque refresh?"* → **Opaque refresh** (random 64-byte, sha256-hashed in DB) so refresh tokens can be revoked individually; cheaper than JWT-with-jti revocation lists.
- *"How to prevent stolen-refresh-token replay?"* → **Family revocation**: if a revoked refresh token is presented, revoke every refresh in that family. (Established pattern; see Auth0 docs.)
- *"Where does money live?"* → Integer cents (`priceCents`) everywhere. Never floats. Documented in `04-naming-conventions.md`.

## 3 — Code-generation prompts (executed against the blueprint)

### Plan-emit prompt

> "Read `ai/initial.md` and produce the numbered build plan only. Do not emit any code yet."

### Step-execute prompt

> "Execute step N of the plan. Emit every file in full — no `// ...` ellipses. Reference the relevant guideline/capability paths in your inline reasoning. Stop after the step."

### Per-module prompts

For each backend module:
> "Generate `apps/api/src/modules/<domain>/{repository,service,routes,schemas}.ts`. Follow `ai/guidelines/02-architecture.md` strictly — controllers thin, services pure, repositories the only Prisma users."

For each frontend feature:
> "Generate `apps/web/src/features/<domain>/{api.ts,components/...,hooks/...}`. Use TanStack Query for server state, Zustand for cross-component UI state, react-hook-form + zodResolver for forms. Schemas come from `@shared/contracts`."

## 4 — Searches consulted

### Technical searches (Anthropic + library docs + general web)

- "Prisma cursor pagination with cursor+skip pattern" — to confirm `{ cursor: { id }, skip: 1 }` semantics for stable pagination.
- "Express + helmet + CORS credentials cookie SameSite" — confirmed `sameSite=lax` + `credentials: 'include'` on FE.
- "Argon2id recommended params 2026" — confirmed `m=64MB`, `t=3`, `p=1`.
- "TanStack Query v5 useInfiniteQuery initialPageParam" — confirmed v5 signature.
- "Radix Dialog with Framer Motion AnimatePresence" — confirmed `forceMount` + `asChild` pattern.

### Google searches (operational / environment fixes)

- **"how to stop local mysql service on macOS"** — the Docker `mysql` container failed to bind to `:3306` because a host-installed MySQL service was already listening on that port. Resolution found via Google: `brew services stop mysql` (also documented `sudo /usr/local/mysql/support-files/mysql.server stop` as the non-Homebrew variant). After stopping the host service, `make db-up` succeeded.
- "Docker Desktop port already in use 3306" — confirmed the diagnosis above (host-OS MySQL holding the port, not another container).

### Gemini (Google Gemini) inquiries — used for human-side brainstorming, NOT code generation

Gemini was used as a "second-opinion" / brainstorm partner BEFORE prompting Claude. Its outputs were filtered by the human and then re-phrased as instructions to Claude. Gemini never wrote code that landed in this repo.

- **"What should I ask Claude to focus on first when generating a full-stack TypeScript e-commerce app?"** — Gemini suggested locking down (1) the auth strategy, (2) the data model for products/orders, (3) the testing approach. This shaped the Stage-0 clarifying questions Claude later asked the human.
- **"Suggest a clean architecture for a small-team monorepo handling auth + catalog + cart + checkout."** — Gemini sketched a modular-monolith with a shared `contracts` package and a strict layering rule (routes → controller → service → repository). This matched the AI's later proposal and gave the human confidence the direction was conventional, not idiosyncratic.
- **"What pitfalls should I watch for when an LLM generates Prisma + Express code?"** — Gemini listed: shadow-database setup, N+1 queries, transaction isolation defaults, unbounded `findMany`. These became items on the human's verification checklist when reviewing Claude's output.

## 4b — Claude Code session continuity

This project spans multiple Claude Code sessions. Resumed sessions used the `--resume <session-id>` flag so that the model had full prior context (not just the repo state) when continuing work.

Example used for the cart-drawer fix and follow-up documentation:

```bash
claude --resume 4b24d4bd-9bce-4c81-a17e-76371c1d6d18
```

Why resume rather than start fresh: the previous session already had the mental model of the Sheet/Dialog/AnimatePresence interaction. A cold start would have re-derived it, costing time and risking a different (worse) fix.

## 5 — Manual interventions (humans did this, not the AI)

See README.md → "Manual Interventions" for the full list. The big ones:

- Running `prisma migrate dev` (interactive — cannot be done by the model).
- Generating real JWT secrets (`openssl rand -base64 32`).
- Choosing demo Unsplash image URLs and verifying licenses.

## 6 — Sample dialogue (illustrative)

```
USER: We need cart logic for both guest (no auth) and logged-in users, with a merge on login.

MODEL: Proposed design:
- Guest cart in localStorage via Zustand `persist`.
- Server cart in DB (1 per user).
- On login, frontend sees auth state flip → calls POST /v1/cart/merge with guest items → clears local guest cart.

USER: What if the merge fails (e.g., network)?
MODEL: Keep guest cart until merge confirms success. Show toast on failure. Retry on next route change.

USER: ✓ Implement.
```

This same back-and-forth happened for: refresh token rotation policy, order idempotency, stock-decrement transaction isolation, and the multi-step checkout state model.
