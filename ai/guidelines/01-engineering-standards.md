# 01 — Engineering Standards

> Every file the AI emits MUST conform to the rules below. Non-compliance is a generation failure.

## Languages & Runtimes

| Concern         | Choice                            | Rationale                                             |
| --------------- | --------------------------------- | ----------------------------------------------------- |
| Language        | TypeScript 5.5+ (`strict: true`)  | Type safety, IDE tooling, predictable refactors.      |
| Backend runtime | Node.js LTS (>=20.11)             | Native fetch, stable test runner, modern ESM support. |
| Frontend build  | Vite 5 + React 18                 | Fast HMR, modern bundling.                            |
| Package manager | pnpm 9 (workspaces)               | Strict dep hoisting, monorepo-friendly.               |
| Database        | MySQL 8.0                         | Required by spec.                                     |
| ORM             | Prisma 5                          | Type-safe queries, migrations, declarative schema.    |
| Validation      | Zod 3                             | Single source of truth for runtime + compile types.   |
| Test runner     | Vitest 1                          | Same syntax FE/BE, fast.                              |
| Linter          | ESLint 9 (flat config) + Prettier | Single style across repo.                             |

## Required Compiler Flags (`tsconfig.base.json`)

- `strict: true`
- `noUncheckedIndexedAccess: true`
- `noImplicitOverride: true`
- `noFallthroughCasesInSwitch: true`
- `esModuleInterop: true`

## Module Style

- **ESM only.** No `require()`. No `module.exports`.
- Path aliases: `@/*` for app-local imports, `@shared/*` for the `packages/shared` workspace.
- Re-export public surfaces from `index.ts` barrel files at module boundaries only — never inside a module.

## Dependency Policy

- Add a dependency only if at least one of these is true:
  1. It eliminates >50 lines of bespoke code.
  2. It solves a well-known correctness/security problem (e.g., `argon2`, `helmet`).
  3. It is required by the spec.
- Prefer first-party APIs (e.g., `fetch`) over wrappers.
- Pin major versions in `package.json`; allow patch/minor via `^`.

## Environment Configuration

- All configuration MUST be loaded via the `config` module (`apps/api/src/config/env.ts`, `apps/web/src/lib/config.ts`).
- Reading `process.env` or `import.meta.env` outside the config module is forbidden.
- The config module MUST validate env vars with Zod at startup and fail fast on missing/invalid values.
- A `.env.example` file lists every variable with a short description and a safe default for development.

## Async Conventions

- Use `async`/`await` everywhere. Do not chain `.then()` unless you have a documented reason.
- Never swallow a rejected promise — either `await` it, return it, or pass it to an error handler.
- Wrap external I/O in a `safe` helper that returns `Result<T, E>` when the caller wants to branch on failure.

## Logging

- Use `pino` on the backend (`apps/api/src/utils/logger.ts`).
- Levels: `trace`, `debug`, `info`, `warn`, `error`, `fatal`.
- Never log secrets, full tokens, or full request bodies for auth endpoints.
- Every request is logged with `requestId` (UUID v4) injected by middleware.

## Commits & Branches

- Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`).
- Branches: `feat/<slug>`, `fix/<slug>`. PRs squash-merge to `main`.
