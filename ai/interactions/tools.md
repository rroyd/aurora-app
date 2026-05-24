# Tools, Plugins, and Libraries Used

## AI tooling

| Tool                 | Purpose                                            |
| -------------------- | -------------------------------------------------- |
| Claude Code (CLI)    | Primary harness for code generation and file ops.  |
| Anthropic SDK        | Programmatic API access for the generation loop.   |
| Cursor (optional)    | Editor with inline AI for spot fixes during review.|

## Search / research

- **Anthropic docs** — prompt-caching, structured outputs, multi-turn tool use patterns.
- **Prisma docs** — `findMany` with `cursor`, transaction isolation levels, JSON column.
- **TanStack Query docs** — `useInfiniteQuery` API and key conventions.
- **Radix UI docs** — Dialog/DropdownMenu accessibility primitives.
- **Framer Motion docs** — `AnimatePresence`, `motion` variants, exit animations.

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
