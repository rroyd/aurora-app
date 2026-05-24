# GitHub Copilot — Project Instructions

This repository (Aurora) uses a **five-agent feature pipeline** for any non-trivial change. The pipeline is the same regardless of which AI tool you are using. Full spec: [`AGENTS.md`](../AGENTS.md). Per-role specs: [`.claude/agents/*.md`](../.claude/agents/).

## Always do, in order

1. Identify which **stage** of the pipeline applies to the user's request:
   1. **Triage** → act as the Product Owner.
   2. **Design** → act as the Architect.
   3. **Build** → act as the Engineer.
   4. **Test** → act as the SDET.
   5. **Review** → act as the Reviewer.
2. Read the corresponding file under `.claude/agents/<role>.md` and follow its **strict rules** verbatim.
3. Read and update the shared context file at `.aurora-pipeline/work/<TICKET-ID>/feature_context.json`. **Each role owns specific fields. Do not edit fields owned by another role.**
4. Advance `status` by **exactly one** stage. Never skip stages.

## Engineering invariants for every role

- TypeScript strict mode. **No `any`**. **No `console.log`** left in code.
- Backend layering: `routes → controller → service → repository → Prisma`. Controllers MUST NOT touch Prisma.
- Money in `Int` cents. Currency code always present.
- Zod validation on every body/query/param. Shared schemas in `packages/shared`.
- Errors: `throw new AppError(...)`. The central middleware formats responses; do not `try/catch` in a controller for shaping errors.
- React: named exports only, no default exports for components. **No `dangerouslySetInnerHTML`.**
- Tests: Vitest + supertest for backend, Playwright (POM) for UI E2E.
- Cookie-based JWT auth (access + opaque refresh). Argon2id for passwords.
- Path aliases: `@/*` for app-local, `@shared/contracts` for the shared package.

## Critical role-specific rules (summary — full versions in `.claude/agents/`)

- **Product Owner**: ≥ 3 BDD ACs (`Given/When/Then`) + ≥ 3 edge cases. NO implementation details. REJECT under-specified tickets.
- **Architect**: Define ALL TypeScript types in `packages/shared`. Exact REST signatures with status codes. Impact analysis lists every touched file. Feature flag is mandatory.
- **Engineer**: Obey the Architect's contract. HALT if it is flawed; never silently diverge. Feature-flag new surfaces. POST/PUT must be idempotent. Zero placeholders.
- **SDET**: Vitest + supertest for backend, Playwright POM for UI E2E. State isolation per test. EVERY `AC-*` and `EC-*` mapped to at least one test.
- **Reviewer**: REJECT on hardcoded secrets, raw SQL, missing auth, missing AC/EC coverage, functions > 50 lines, nesting > 3 levels, failing tests.

## Slash commands (Claude Code)

When the user is in Claude Code, prefer `/feature-init`, `/feature-triage`, `/feature-design`, `/feature-build`, `/feature-test`, `/feature-review`, or `/feature-pipeline`. They orchestrate the subagents automatically.

## Why this pipeline exists

Five focused prompts are far more reliable than one generic "build this feature" prompt. The shared state file makes each step auditable. The hard ordering means problems are caught at the cheapest possible stage.
