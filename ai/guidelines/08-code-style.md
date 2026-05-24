# 08 — Code Style

## Prettier (enforced)

```jsonc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

## ESLint Highlights

- `@typescript-eslint/no-explicit-any`: error (use `unknown` + narrowing).
- `@typescript-eslint/consistent-type-imports`: error (`import type { ... }`).
- `react-hooks/exhaustive-deps`: error.
- `no-restricted-imports`:
  - Forbid `react-router-dom` deep imports — use the top-level package only.
  - Forbid `process.env` outside `config/env.ts` / `lib/config.ts`.

## Zod Schemas at Boundaries

- Use `z.object({...}).strict()` for HTTP request bodies, query strings, and config files where unknown keys are a bug.
- **Do NOT** use `.strict()` for schemas parsed against `process.env` — the OS injects unrelated keys (`PATH`, `HOME`, `SHELL`, …) and strict mode will reject them, causing silent `process.exit(1)`. The default behavior (passthrough then ignore) is correct for env.
- A schema parsed against `import.meta.env` (Vite client) is safe to make strict — Vite filters to `VITE_*` keys only.

## TypeScript Style

- Prefer `interface` for public object shapes, `type` for unions / mapped types.
- `as` casting only when the type system genuinely can't infer (parsing JSON, narrowing after `instanceof`). Add a one-line comment with *why*.
- `unknown` at boundaries (e.g., `req.body: unknown` until Zod parses).
- Discriminated unions for `Result<T,E>` and state machines.

## React Style

- Function components only. No class components.
- Named exports only.
- Props interface declared above the component: `interface ProductCardProps { … }`.
- Keep components < 200 lines. Extract subcomponents when a child has its own props or local state.
- Side effects only in `useEffect` and event handlers — never inside the render body.

## Comments

- **Default: no comment.** Self-explanatory code beats commented code.
- A comment is warranted only for:
  - A non-obvious constraint or invariant (e.g., `// must run before requireAuth so requestId is present in errors`).
  - A workaround with a link to the upstream issue.
  - Public API surface where consumers benefit from a one-line summary.
- ❌ Never write comments that restate the code (`// increment i`).
- ❌ Never write change-history comments (`// added by X`, `// fix for ticket-123`).

## Imports Order

1. Node built-ins
2. External packages
3. `@shared/*`
4. `@/*` (app internal, absolute)
5. Relative (`./`, `../`)

Blank line between groups. Enforced by `eslint-plugin-import`.

## Async / Promises

- Always `await` (or `return`) a promise. Never fire-and-forget unless explicitly intended; in that case, attach `.catch(logger.error)`.
- Don't mix `async/await` with `.then()` in the same function.

## Function Length

- Aim < 40 lines. If a function exceeds 60, extract.
- A pure function with no I/O is preferred wherever possible.

## Conditionals

- Early return over nested `else`.
- `switch` over chained `if`s when matching a finite set; use `noFallthroughCasesInSwitch` and an exhaustive default.
