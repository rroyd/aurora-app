# Contributing

How we work on this repo. Short, opinionated, enforced.

---

## The non-negotiables

1. **Every commit leaves the repo buildable.** `pnpm typecheck && pnpm test` must pass.
2. **Every commit is atomic.** One logical change per commit. If you'd describe it with "and", it's two commits.
3. **No `any`. No `console.log` left in.** Caught by lint.
4. **No secrets in git.** Real values live in `.env` (gitignored). Use `.env.example` for the shape.
5. **No `dangerouslySetInnerHTML`.** Sanitize or rethink the design.

---

## Branching

```
main          ← protected, squash-only, CI must pass
└── feat/<slug>     ← new features
└── fix/<slug>      ← bug fixes
└── chore/<slug>    ← tooling, dep bumps, refactors
└── docs/<slug>     ← README, ADRs
```

- Branch off `main`. Rebase onto `main` before opening the PR.
- One PR per topic. If your PR description has bullet points starting with "also", it's two PRs.
- PRs squash-merge so `main` history stays clean. Your branch history is yours.

---

## Conventional Commits

We use [Conventional Commits](https://www.conventionalcommits.org/) — both for individual commits on a branch and for the squashed merge commit on `main`.

### Format

```
<type>(<scope>): <subject>

<body — wrap at 72>

<footer>
```

### Types we use

| Type        | When                                                                  | Example                                                   |
| ----------- | --------------------------------------------------------------------- | --------------------------------------------------------- |
| `feat`      | New user-facing capability                                            | `feat(orders): add cancel order endpoint`                 |
| `fix`       | Bug fix                                                               | `fix(auth): clear refresh cookie on logout`               |
| `refactor`  | Internal change with no behavior diff                                 | `refactor(api): extract pagination helper`                |
| `test`      | Tests only                                                            | `test(checkout): add idempotency replay case`             |
| `docs`      | Docs only                                                             | `docs: clarify shadow-database setup`                     |
| `chore`     | Tooling, deps, configs                                                | `chore: bump pnpm to 9.1.0`                               |
| `ci`        | CI workflow changes                                                   | `ci: cache pnpm store across jobs`                        |
| `build`     | Build system / Docker / bundling                                      | `build: shrink runtime image by skipping dev deps`        |
| `perf`      | Performance improvement                                               | `perf(catalog): index products on (categoryId, createdAt)`|

### Scopes we use

Match the workspace or module: `api`, `web`, `shared`, `auth`, `products`, `cart`, `orders`, `users`, `docs`, `ci`, `build`. Skip the scope only when the change is truly cross-cutting.

### Good subjects

- Imperative mood: "add", not "added" or "adds".
- Under 60 characters. The body is for context, not the subject.
- Specific: "add cancel order endpoint" beats "update orders".

### When to write a body

Always, except for trivial one-line fixes. Explain:

- **Why** the change exists (not what — `git diff` shows what).
- Any non-obvious decisions or trade-offs.
- Links to related issues, ADRs, or external references.

### Example

```
feat(orders): support idempotent order creation

Adds an `Idempotency-Key` header to POST /v1/orders. When the same key is
replayed with any input, the server returns the original order rather than
creating a duplicate or attempting a second charge.

The key is stored as a unique index on Order.idempotencyKey; on replay we
look it up and short-circuit before touching the payment provider.

Closes #42
```

---

## Recommended commit sequence for non-trivial work

Mirror the way Step 1–9 landed in this repo's history (`git log --oneline`). The pattern:

1. **Foundation / utilities** (small, no behavior change).
2. **One feature or layer at a time**, each with its tests.
3. **Wire / integrate** the feature into the app.
4. **Docs + tests** for the feature.
5. **CI + ops** (Docker, workflow) last, since they need the rest to exist.

```
feat(api): add timeout/retry utilities and request-timing middleware
build: add production multi-stage Dockerfiles
build: extend docker-compose with api, web, and migrate services
chore: add Makefile for common workflows
ci: add GitHub Actions workflow
test(api): add integration tests for auth, checkout, and products
docs(api): generate OpenAPI spec, Swagger UI, and Postman collection
docs: rewrite README to staff-engineer template
docs: add CONTRIBUTING.md and commit conventions
```

Each commit above is independently reviewable and reversible. That's the bar.

---

## Pull-request checklist

Before opening the PR:

- [ ] Branch is rebased onto current `main`.
- [ ] `pnpm typecheck` is clean.
- [ ] `pnpm test` is green.
- [ ] If the change touches HTTP endpoints, `pnpm test:int` is green.
- [ ] If the change touches the Prisma schema, you generated and committed the migration.
- [ ] If the change adds an env var, `.env.example` is updated and the env validator (`apps/api/src/config/env.ts`) accepts it.
- [ ] If the change is user-facing, screenshots/GIFs are in the PR description.
- [ ] If the change touches security (auth, cookies, validation), at least one integration test covers the new path.

The PR template prompts for the same items.

---

## Code review

Reviewers should:

- **Check the architecture seams.** Did a controller call Prisma? Did a service touch `req`/`res`? Block the merge.
- **Question every new dependency.** Does it eliminate >50 lines, or solve a real correctness problem? If not, push back.
- **Check error paths.** Every new endpoint should be exercisable into a 400 and a 401/403/404 — not just a 200.
- **Be specific with feedback.** "This won't work because X" beats "weird".

Authors should:

- **Respond to every comment.** Even a 👍 on something you fixed.
- **Don't take feedback personally.** Take it literally.

---

## When AI helps

This repo was built with an LLM as a major contributor. If you use an LLM during your work, follow the same rules everyone else does:

- **You are responsible for the code.** Read it before you commit it.
- **Verify, then trust.** Run the same checks (`typecheck`, tests, build) before pushing.
- **Don't paste secrets into prompts.** Treat the model as you would any external service.
- **Document non-trivial AI assists** in the PR description if the choice is unusual.

---

## Releasing

We don't have a formal release cadence yet. When we do:

- Tag with `vX.Y.Z` on `main`.
- Generate a changelog from Conventional Commits (`git-cliff` or similar).
- Build + tag the Docker images `aurora-api:X.Y.Z` and `aurora-web:X.Y.Z`.

---

Questions? Open an issue. Discussions about *how we work* are first-class.
