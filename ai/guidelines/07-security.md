# 07 — Security Baseline

> The AI MUST implement every item below. Items marked **(P0)** are blocking for shipping.

## Authentication (P0)

- **Passwords:** Argon2id via `argon2` (default params: timeCost=3, memoryCost=64 MB, parallelism=1). Never bcrypt-fallback.
- **JWT:**
  - Access token: HS256, 15 min, payload `{ sub, role, iat, exp }`.
  - Refresh token: HS256, 30 days, **opaque value** stored in DB (`RefreshToken` model) with `tokenHash` only — never the plaintext.
  - Both delivered as `httpOnly`, `secure`, `sameSite=lax` cookies.
- **Logout:** clears cookies + revokes the refresh-token row.
- **Refresh rotation:** every refresh issues a new pair and revokes the previous refresh token. If a revoked refresh token is presented, **revoke the whole family** (suspected theft).

## Transport (P0)

- `helmet()` with sensible defaults; opt-in CSP that allows the FE origin and self.
- `cors()` restricted to `WEB_ORIGIN` env var; credentials true.
- HSTS in production. The FE must be served over HTTPS.

## Input Validation (P0)

- Every controller validates `body`, `query`, `params` with Zod **before** calling the service.
- Reject unknown keys (`z.object({...}).strict()`).
- Limit body size: `express.json({ limit: '100kb' })`.

## Rate Limiting (P0)

- Auth endpoints (`/auth/login`, `/auth/register`, `/auth/refresh`): 10 req / 15 min per IP.
- Global API: 300 req / 5 min per IP.
- Use `express-rate-limit` with an in-memory store for dev and Redis in prod (configurable via `RATE_LIMIT_STORE`).

## Authorization

- Middleware `requireAuth` populates `req.user` from access token.
- Middleware `requireRole('admin')` for admin endpoints.
- **Object-level checks:** an order is readable only by its owner or an admin. The service performs the check; the controller passes `req.user.id`.

## Secrets

- Never commit secrets. `.env.example` shows shape, real values live in `.env` (gitignored).
- JWT secrets: at least 32 random bytes (`openssl rand -base64 32`). Different secrets for access vs refresh.

## SQL Injection / ORM

- Prisma parameterized queries only. No `$queryRawUnsafe` unless gated behind a code-reviewed allowlist.

## XSS

- React escapes by default. Forbidden: `dangerouslySetInnerHTML`. Exception requires inline justification + DOMPurify.

## CSRF

- Refresh-token cookie is `sameSite=lax` — covers most cases.
- For non-idempotent endpoints called from cross-site contexts, require `Authorization: Bearer` (forces JS access, which CSRF cannot do).

## Sensitive Data

- Passwords are write-only. The user shape returned to the client never includes `passwordHash`.
- Order history may include partial payment info (last 4 digits only) — never PAN.

## Audit Logging

- Log: login (success/fail), logout, password change, role change. Include `userId`, `ip`, `userAgent`, `requestId`. Never log the password or token.

## Dependencies

- `pnpm audit --prod` must report 0 high/critical issues before release. CI enforces it.
