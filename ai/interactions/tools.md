# Tools, Plugins, and Libraries Used

## AI tooling

| Tool                 | Purpose                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| Claude Code (CLI)    | Primary harness for code generation, file ops, and reviewing diffs. Used across multiple sessions.   |
| `claude --resume`    | Re-entered prior sessions (e.g. `claude --resume 4b24d4bd-9bce-4c81-a17e-76371c1d6d18`) so the model kept the prior mental model when continuing work. |
| Anthropic SDK        | Programmatic API access for the generation loop.                                                     |
| Google Gemini (web)  | Pre-prompt brainstorming and architecture second-opinion. No generated code landed in this repo.     |
| Cursor (optional)    | Editor with inline AI for spot fixes during review.                                                  |

### Claude Code plugins / agents in use

The repo ships a 5-agent feature pipeline (see commit `28ee74e`): **product-owner → architect → engineer → sdet → reviewer**. Each stage is a Claude Code subagent invoked via skills (`/feature-triage`, `/feature-design`, `/feature-build`, `/feature-test`, `/feature-review`, or the umbrella `/feature-pipeline`). Stages halt on rejection rather than guessing.

Built-in skills used during development: `/code-review`, `/verify`, `/run`, `/init`, `/security-review`, `/update-config`, `/fewer-permission-prompts`.

## Search / research

### Library / framework docs

- **Anthropic docs** — prompt-caching, structured outputs, multi-turn tool use patterns.
- **Prisma docs** — `findMany` with `cursor`, transaction isolation levels, JSON column.
- **TanStack Query docs** — `useInfiniteQuery` API and key conventions.
- **Radix UI docs** — Dialog/DropdownMenu accessibility primitives.
- **Framer Motion docs** — `AnimatePresence`, `motion` variants, exit animations.

### Google web searches (operational)

- **"how to stop local mysql service on macOS"** — needed because the host MySQL service was bound to `:3306`, preventing the Docker `mysql` container from starting. Fix: `brew services stop mysql` before `make db-up`. Documented in README "Operational runbook".
- **"Docker Desktop port already in use 3306"** — corroborated the diagnosis.

### Gemini inquiries (brainstorm only — see `prompts.md` §4)

- "What should I ask Claude to focus on first when generating a full-stack TS e-commerce app?"
- "Suggest a clean architecture for a small-team monorepo handling auth + catalog + cart + checkout."
- "Pitfalls when an LLM generates Prisma + Express code?"

## Runtime libraries

### Backend (`apps/api`)
- `express` — HTTP server
- `prisma`, `@prisma/client` — ORM
- `argon2` — password hashing
- `jsonwebtoken` — JWT
- `cookie-parser`, `cors`, `helmet` — request handling + security
- `express-rate-limit` — rate limiting
- `pino`, `pino-http` — structured logging
- `zod` — validation
- `dotenv` — env loading

### Frontend (`apps/web`)
- `react`, `react-dom`, `react-router-dom`
- `@tanstack/react-query` — server state
- `zustand` — client state
- `react-hook-form`, `@hookform/resolvers` — forms
- `tailwindcss`, `autoprefixer`, `postcss` — styling
- `framer-motion` — animation
- `lucide-react` — icons
- `@radix-ui/react-dialog`, `react-dropdown-menu`, `react-toast`, `react-select`, `react-label`
- `class-variance-authority`, `clsx`, `tailwind-merge` — styling utilities

### Shared (`packages/shared`)
- `zod`

### Dev / test
- `typescript` (strict)
- `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
- `tsx` — Node TS runner
- `supertest` — HTTP integration tests
- `prettier`, ESLint (flat config recommended)
