# 2. AI Boilerplate

This document lists the AI boilerplate used to generate the **ai-blueprint-ecommerce** project, the AI tools used during development, and how to resume the original Claude Code session.

---

## Resume the Claude Code session

The original Claude Code session for this project can be re-entered with the `--resume` flag so the model picks up with full prior context (not just the repo state):

```bash
claude --resume 4b24d4bd-9bce-4c81-a17e-76371c1d6d18
```

Run this from the parent directory of the project (or any directory — Claude Code will pick the session by ID). Use `claude resume` without an ID to interactively pick a session.

---

## Bootstrap prompt

The single entry point that kicks off the whole generation is `ai/initial.md`. It defines the AI's role, the project goal, the non-negotiable inputs it must read first, the feature spec, the deliverables checklist, the output protocol, and the definition of done.

| File | Purpose |
|---|---|
| `ai/initial.md` | Bootstrap prompt pasted as the first message. Tells the AI it is a senior full-stack engineer building a production-grade eCommerce monorepo, and references every guideline / capability doc below. |

---

## AI guideline files (binding rules)

Located in `ai/guidelines/`. The AI must read these in order before emitting any code; any output that contradicts them is invalid.

| # | File | Scope |
|---|---|---|
| 01 | `engineering-standards.md` | Baseline engineering rules (TypeScript strict, no `any`, no `console.log`, etc.) |
| 02 | `architecture.md` | High-level architecture: monorepo layout, API/web/shared separation, request flow. |
| 03 | `folder-structure.md` | Canonical folder layout the AI must scaffold. |
| 04 | `naming-conventions.md` | Naming rules for files, components, hooks, services, env vars. |
| 05 | `error-handling.md` | Uniform error response shape, error middleware, no try/catch in controllers. |
| 06 | `testing.md` | Vitest conventions, what must be unit-tested vs. component-tested. |
| 07 | `security.md` | Auth, cookies, rate limits, password hashing (Argon2id), input validation. |
| 08 | `code-style.md` | Comments policy ("why" only), formatting, import ordering. |

---

## AI capability files (building blocks)

Located in `ai/capabilities/`. These describe *how* to implement each domain.

| File | Scope |
|---|---|
| `auth.md` | Session model, refresh-token rotation + family revocation, cookie flags. |
| `database.md` | Prisma schema requirements, money stored in cents (`Int`), seed expectations. |
| `api-layer.md` | Express router conventions, `/v1` prefix, request validation pipeline. |
| `ui-components.md` | Tailwind theme tokens, brand colors, primitive components (Button, Card, Field, etc.). |
| `state-management.md` | React Query for server state, Zustand for cart/UI state, separation of concerns. |
| `payments.md` | Mock card flow, test card `4242 4242 4242 4242`, idempotent order creation via `Idempotency-Key`. |

---

## Other AI-related files in the repo

| File | Purpose |
|---|---|
| `AGENTS.md` | Behavioral contract for any AI agent contributing to the repo. |
| `.cursorrules` | Rules picked up automatically by Cursor. |
| `ai/interactions/prompts.md` | Reusable prompts (e.g., "add a new endpoint", "scaffold a page"). |
| `ai/interactions/models.md` | Which AI model to use for which task. |
| `ai/interactions/tools.md` | Allowed/expected tooling per agent. |
| `.aurora-pipeline/README.md` | Description of the 5-agent feature pipeline (PO → Architect → Engineer → SDET → Reviewer). |
| `.aurora-pipeline/feature_context.schema.json` | JSON schema each pipeline agent reads/writes. |

---

## External AI / search tools used during development

| Tool | What it was used for |
|---|---|
| **Claude Code** (CLI) | Generated and refactored the entire codebase, ran the bootstrap from `ai/initial.md`, and executed the multi-agent feature pipeline. |
| **Gemini** | Brainstormed what to suggest to Claude so it would stay focused on the eCommerce scope (helped narrow down feature ideas before writing prompts). |
| **Gemini** | Suggested the best overall architecture for the project (monorepo split, React Query + Zustand, Prisma + MySQL, Vite + Tailwind) — these suggestions were then encoded into `ai/guidelines/02-architecture.md`. |
| **Google search** | Found the command to shut down the local MySQL service on macOS because port `3306` was already taken and the Docker container could not start. |

### Reference command — free port 3306 (macOS, Homebrew MySQL)

```bash
brew services stop mysql
# verify nothing is listening on 3306
lsof -i :3306
# then bring up the Dockerized MySQL
docker compose up -d mysql
```

---

## Definition of done (from `ai/initial.md`)

`pnpm setup` followed by `pnpm dev` must produce:

- API on `http://localhost:4000` responding to `GET /v1/healthz`.
- Web on `http://localhost:5173` rendering the home page with seeded products.
- A new user can sign up, browse, add to cart, check out with `4242 4242 4242 4242`, and see the order in their account.
