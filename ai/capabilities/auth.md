# Capability — Authentication

## Surface

```ts
// apps/api/src/modules/auth/auth.service.ts
register(input: RegisterInput): Promise<AuthSession>
login(input: LoginInput): Promise<AuthSession>
refresh(refreshToken: string): Promise<AuthSession>
logout(refreshToken: string): Promise<void>
me(userId: string): Promise<PublicUser>
```

`AuthSession` = `{ user: PublicUser; accessToken: string; refreshToken: string; expiresAt: string }`.

## Endpoints

| Method | Path                | Auth | Description                                |
| ------ | ------------------- | ---- | ------------------------------------------ |
| POST   | `/auth/register`    | —    | Create account, return session + set cookies |
| POST   | `/auth/login`       | —    | Authenticate, return session                |
| POST   | `/auth/refresh`     | cookie | Rotate token pair                         |
| POST   | `/auth/logout`      | cookie | Revoke refresh token, clear cookies       |
| GET    | `/auth/me`          | bearer | Return current user                       |

## Tokens

- Access: HS256 JWT, 15 min, secret `JWT_ACCESS_SECRET`.
- Refresh: random 64-byte value (`crypto.randomBytes(64).toString('base64url')`). Stored hashed (`sha256`) in `RefreshToken { id, userId, tokenHash, familyId, revokedAt, expiresAt }`.

## Cookies

```
Set-Cookie: access_token=<jwt>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=900
Set-Cookie: refresh_token=<opaque>; HttpOnly; Secure; SameSite=Lax; Path=/auth; Max-Age=2592000
```

## Frontend Hook

```ts
const { user, isAuthenticated, login, logout, register } = useAuth();
```

`useAuth` wraps TanStack Query for `me` and exposes mutations for the rest. It reacts to 401s by attempting one silent `refresh`, then redirecting to `/login` if that fails.

## Refresh-Token Rotation

1. Client calls `/auth/refresh` with cookie.
2. Server looks up `tokenHash`. If not found or revoked → revoke entire `familyId` and respond 401.
3. Else: create new token in the same family, mark old `revokedAt = now`, return new pair.

This catches token theft: an attacker using a stolen refresh token forces revocation as soon as the legitimate user refreshes.
